'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getSPC } from '@/lib/spc';
import { Separator } from '@/components/ui/separator';

interface Metric {
  label: string;
  value: string | number;
}

interface TopMetricsProps {
  clientId: string;
  startDate: string;
  endDate: string;
}

export default function TopMetrics({ clientId, startDate, endDate }: TopMetricsProps) {
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    async function fetchMetrics() {
      const { data: clientRow } = await supabase
        .from('clients_ffs')
        .select('ppc_sources, lsa_sources, seo_sources')
        .eq('cr_client_id', clientId)
        .single();

      const ppcSources: string[] = clientRow?.ppc_sources || [];
      const lsaSources: string[] = clientRow?.lsa_sources || [];
      const seoSources: string[] = clientRow?.seo_sources || [];

      const { data: leads } = await supabase
        .from('hmstr_leads')
        .select('source, lead_score_max, close_score_max')
        .eq('client_id', clientId)
        .gte('last_qual_date', startDate)
        .lte('last_qual_date', endDate);

      const sourceBuckets = {
        all: [] as number[],
        ppc: [] as number[],
        lsa: [] as number[],
        seo: [] as number[],
      };

      const closeBuckets = {
        all: [] as number[],
        ppc: [] as number[],
        lsa: [] as number[],
        seo: [] as number[],
      };

      leads?.forEach((lead) => {
        const spc = getSPC(lead.source, ppcSources, lsaSources, seoSources);
        const ls = lead.lead_score_max ?? 0;
        const cs = lead.close_score_max ?? 0;

        sourceBuckets.all.push(ls);
        closeBuckets.all.push(cs);

        if (spc in sourceBuckets) {
          sourceBuckets[spc as keyof typeof sourceBuckets].push(ls);
          closeBuckets[spc as keyof typeof closeBuckets].push(cs);
        }
      });

      function avg(arr: number[]) {
        return arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '0.0';
      }

      const allCount = sourceBuckets.all.length;
      const ppcCount = sourceBuckets.ppc.length;
      const lsaCount = sourceBuckets.lsa.length;
      const seoCount = sourceBuckets.seo.length;

      const cost = { all: 0, ppc: 0, lsa: 0, seo: 0 }; // Add real spend logic here if needed

      const metricsData: Metric[] = [
        { label: 'All QLeads', value: allCount },
        { label: 'PPC QLeads', value: ppcCount },
        { label: 'LSA QLeads', value: lsaCount },
        { label: 'SEO QLeads', value: seoCount },
        { label: 'Total Cost (All)', value: `$${cost.all.toFixed(2)}` },
        { label: 'Total Cost (PPC)', value: `$${cost.ppc.toFixed(2)}` },
        { label: 'Total Cost (LSA)', value: `$${cost.lsa.toFixed(2)}` },
        { label: 'Total Cost (SEO)', value: `$${cost.seo.toFixed(2)}` },
        { label: 'Cost/QL (All)', value: allCount ? `$${(cost.all / allCount).toFixed(2)}` : '$0.00' },
        { label: 'Cost/QL (PPC)', value: ppcCount ? `$${(cost.ppc / ppcCount).toFixed(2)}` : '$0.00' },
        { label: 'Cost/QL (LSA)', value: lsaCount ? `$${(cost.lsa / lsaCount).toFixed(2)}` : '$0.00' },
        { label: 'Cost/QL (SEO)', value: seoCount ? `$${(cost.seo / seoCount).toFixed(2)}` : '$0.00' },
        { label: 'Avg Lead Score', value: avg(sourceBuckets.all) },
        { label: 'Avg Sales Score', value: avg(closeBuckets.all) },
        { label: 'Avg PPC Lead Score', value: avg(sourceBuckets.ppc) },
        { label: 'Avg PPC Sales Score', value: avg(closeBuckets.ppc) },
        { label: 'Avg LSA Lead Score', value: avg(sourceBuckets.lsa) },
        { label: 'Avg LSA Sales Score', value: avg(closeBuckets.lsa) },
        { label: 'Avg SEO Lead Score', value: avg(sourceBuckets.seo) },
        { label: 'Avg SEO Sales Score', value: avg(closeBuckets.seo) },
      ];

      setMetrics(metricsData);
    }

    fetchMetrics();
  }, [clientId, startDate, endDate]);

  return (
    <div className="rounded-xl border p-6 mt-6 bg-white shadow-sm">
      <div className="text-xl font-bold mb-2">
        Showing data from {startDate} to {endDate}
      </div>
      <Separator className="my-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="text-center">
            <div className="text-sm text-gray-500">{metric.label}</div>
            <div className="text-lg font-semibold">{metric.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
