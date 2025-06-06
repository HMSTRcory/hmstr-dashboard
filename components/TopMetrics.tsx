'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { getSPC } from '@/lib/spc';
import { Separator } from '@/components/ui/separator';

interface Client {
  cr_client_id: string;
  cr_company_name: string;
  ppc_sources: string[];
  lsa_sources: string[];
  seo_sources: string[];
}

interface Lead {
  source: string;
  lead_qualified: boolean;
  lead_score_max: number;
  close_score_max: number;
}

interface Spend {
  spend: number;
}

interface Props {
  clientId: string;
  startDate: string;
  endDate: string;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
};

export default function TopMetrics({ clientId, startDate, endDate }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from('clients_ffs')
        .select('cr_client_id, cr_company_name, ppc_sources, lsa_sources, seo_sources');

      if (data) {
        setClients(data);
      }
    };

    fetchClients();
  }, [supabase]);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!clientId || !startDate || !endDate) return;

      const client = clients.find((c) => c.cr_client_id === clientId);
      if (!client) return;

      const { ppc_sources, lsa_sources, seo_sources } = client;

      const { data: leads } = await supabase
        .from('hmstr_leads')
        .select('source, lead_qualified, lead_score_max, close_score_max')
        .eq('client_id', clientId)
        .gte('last_qual_date', startDate)
        .lte('last_qual_date', endDate);

      const { data: spendPPC } = await supabase
        .from('googleads_campain_data')
        .select('cost_micros')
        .eq('google_ads_customer_id', clientId)
        .gte('date', startDate)
        .lte('date', endDate);

      const { data: spendLSA } = await supabase
        .from('spend_data_lsa')
        .select('spend')
        .eq('client_id', clientId)
        .gte('date', startDate)
        .lte('date', endDate);

      const { data: spendSEO } = await supabase
        .from('spend_data_seo')
        .select('spend')
        .eq('client_id', clientId)
        .gte('date', startDate)
        .lte('date', endDate);

      let total = {
        all: { spend: 0, count: 0, lead: 0, sales: 0 },
        ppc: { spend: 0, count: 0, lead: 0, sales: 0 },
        lsa: { spend: 0, count: 0, lead: 0, sales: 0 },
        seo: { spend: 0, count: 0, lead: 0, sales: 0 },
      };

      if (leads) {
        leads.forEach((lead: Lead) => {
          if (!lead.lead_qualified) return;

          const type = getSPC(lead.source, ppc_sources, lsa_sources, seo_sources);

          total.all.count++;
          total.all.lead += lead.lead_score_max;
          total.all.sales += lead.close_score_max;

          if (type !== 'other') {
            total[type].count++;
            total[type].lead += lead.lead_score_max;
            total[type].sales += lead.close_score_max;
          }
        });
      }

      if (spendPPC) {
        total.ppc.spend = spendPPC.reduce((sum, s) => sum + (s.cost_micros || 0), 0) / 1_000_000;
      }

      if (spendLSA) {
        total.lsa.spend = spendLSA.reduce((sum, s: Spend) => sum + s.spend, 0);
      }

      if (spendSEO) {
        total.seo.spend = spendSEO.reduce((sum, s: Spend) => sum + s.spend, 0);
      }

      total.all.spend = total.ppc.spend + total.lsa.spend + total.seo.spend;

      setMetrics(total);
    };

    fetchMetrics();
  }, [clientId, startDate, endDate, clients]);

  if (!metrics) return null;

  return (
    <div className="space-y-4 rounded-xl border p-4 shadow-sm">
      <div className="text-lg font-bold">Top Metrics</div>
      <Separator />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>All QLeads: {metrics.all.count}</div>
        <div>PPC QLeads: {metrics.ppc.count}</div>
        <div>LSA QLeads: {metrics.lsa.count}</div>
        <div>SEO QLeads: {metrics.seo.count}</div>

        <div>Total Cost (All): {formatCurrency(metrics.all.spend)}</div>
        <div>Total Cost (PPC): {formatCurrency(metrics.ppc.spend)}</div>
        <div>Total Cost (LSA): {formatCurrency(metrics.lsa.spend)}</div>
        <div>Total Cost (SEO): {formatCurrency(metrics.seo.spend)}</div>

        <div>Cost/QL (All): {formatCurrency(metrics.all.spend / Math.max(metrics.all.count, 1))}</div>
        <div>Cost/QL (PPC): {formatCurrency(metrics.ppc.spend / Math.max(metrics.ppc.count, 1))}</div>
        <div>Cost/QL (LSA): {formatCurrency(metrics.lsa.spend / Math.max(metrics.lsa.count, 1))}</div>
        <div>Cost/QL (SEO): {formatCurrency(metrics.seo.spend / Math.max(metrics.seo.count, 1))}</div>

        <div>Avg Lead Score: {(metrics.all.lead / Math.max(metrics.all.count, 1)).toFixed(1)}</div>
        <div>Avg Sales Score: {(metrics.all.sales / Math.max(metrics.all.count, 1)).toFixed(1)}</div>
        <div>Avg PPC Lead Score: {(metrics.ppc.lead / Math.max(metrics.ppc.count, 1)).toFixed(1)}</div>
        <div>Avg PPC Sales Score: {(metrics.ppc.sales / Math.max(metrics.ppc.count, 1)).toFixed(1)}</div>
        <div>Avg LSA Lead Score: {(metrics.lsa.lead / Math.max(metrics.lsa.count, 1)).toFixed(1)}</div>
        <div>Avg LSA Sales Score: {(metrics.lsa.sales / Math.max(metrics.lsa.count, 1)).toFixed(1)}</div>
        <div>Avg SEO Lead Score: {(metrics.seo.lead / Math.max(metrics.seo.count, 1)).toFixed(1)}</div>
        <div>Avg SEO Sales Score: {(metrics.seo.sales / Math.max(metrics.seo.count, 1)).toFixed(1)}</div>
      </div>
    </div>
  );
}
