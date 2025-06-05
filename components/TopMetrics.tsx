'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { nextDay } from '@/lib/utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export default function TopMetrics({
  clientId,
  startDate,
  endDate,
}: {
  clientId: number;
  startDate: string;
  endDate: string;
}) {
  const [metrics, setMetrics] = useState<any>({
    all: {},
    ppc: {},
    lsa: {},
    seo: {},
    costTotals: { ppc: 0, lsa: 0, seo: 0 },
  });
  const [pieData, setPieData] = useState<any[]>([]);

  const fetchMetrics = async () => {
    if (!clientId || !startDate || !endDate) return;

    const { data: sources } = await supabase
      .from('clients_ffs')
      .select('ppc_sources, lsa_sources, seo_sources')
      .eq('client_id', clientId)
      .single();

    const { data: leads, error: leadsError } = await supabase
      .from('hmstr_leads')
      .select('first_qual_date, first_lead_source, lead_score_max, close_score_max')
      .eq('client_id', clientId)
      .eq('hmstr_qualified_lead', true)
      .gte('first_qual_date', `${startDate}T00:00:00`)
      .lt('first_qual_date', `${nextDay(endDate)}T00:00:00`);

    if (leadsError || !leads) return;

    const result = {
      all: { count: 0, leadScore: 0, closeScore: 0, costPerQL: 0 },
      ppc: { count: 0, leadScore: 0, closeScore: 0, costPerQL: 0 },
      lsa: { count: 0, leadScore: 0, closeScore: 0, costPerQL: 0 },
      seo: { count: 0, leadScore: 0, closeScore: 0, costPerQL: 0 },
      costTotals: { ppc: 0, lsa: 0, seo: 0 },
    };

    for (const row of leads) {
      const source = row.first_lead_source;
      const leadScore = row.lead_score_max || 0;
      const closeScore = row.close_score_max || 0;

      result.all.count++;
      result.all.leadScore += leadScore;
      result.all.closeScore += closeScore;

      if (sources?.ppc_sources?.includes(source)) {
        result.ppc.count++;
        result.ppc.leadScore += leadScore;
        result.ppc.closeScore += closeScore;
      }
      if (sources?.lsa_sources?.includes(source)) {
        result.lsa.count++;
        result.lsa.leadScore += leadScore;
        result.lsa.closeScore += closeScore;
      }
      if (sources?.seo_sources?.includes(source)) {
        result.seo.count++;
        result.seo.leadScore += leadScore;
        result.seo.closeScore += closeScore;
      }
    }

    const ppcCost = await getTotalPpcCost(clientId, startDate, endDate);
    const lsaCost = await getSpendData('spend_data_lsa', clientId, startDate, endDate);
    const seoCost = await getSpendData('spend_data_seo', clientId, startDate, endDate);
    const totalCost = ppcCost + lsaCost + seoCost;

    result.costTotals.ppc = ppcCost;
    result.costTotals.lsa = lsaCost;
    result.costTotals.seo = seoCost;

    result.all.costPerQL = result.all.count ? totalCost / result.all.count : 0;
    result.ppc.costPerQL = result.ppc.count ? ppcCost / result.ppc.count : 0;
    result.lsa.costPerQL = result.lsa.count ? lsaCost / result.lsa.count : 0;
    result.seo.costPerQL = result.seo.count ? seoCost / result.seo.count : 0;

    setMetrics(result);
    setPieData([
      { name: 'PPC', value: result.ppc.count },
      { name: 'LSA', value: result.lsa.count },
      { name: 'SEO', value: result.seo.count },
    ]);
  };

  const getTotalCost = async (clientId: number, start: string, end: string) => {
    const { data } = await supabase
      .from('googleads_campain_data')
      .select('cost_micros')
      .eq('client_id', clientId)
      .gte('date', start)
      .lte('date', end);

    return data ? data.reduce((sum, row) => sum + row.cost_micros / 1_000_000, 0) : 0;
  };

  const getTotalPpcCost = async (clientId: number, start: string, end: string) => {
    return await getTotalCost(clientId, start, end);
  };

  const getSpendData = async (table: string, clientId: number, start: string, end: string) => {
    const { data } = await supabase
      .from(table)
      .select('spend')
      .eq('client_id', clientId)
      .gte('date', start)
      .lte('date', end);

    return data ? data.reduce((sum, row) => sum + row.spend, 0) : 0;
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  useEffect(() => {
    fetchMetrics();
  }, [clientId, startDate, endDate]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Top Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div><strong>All QLeads:</strong> {metrics.all.count}</div>
        <div><strong>PPC QLeads:</strong> {metrics.ppc.count}</div>
        <div><strong>LSA QLeads:</strong> {metrics.lsa.count}</div>
        <div><strong>SEO QLeads:</strong> {metrics.seo.count}</div>

        <div><strong>Cost/QL (All):</strong> {formatCurrency(metrics.all.costPerQL || 0)}</div>
        <div><strong>Cost/QL (PPC):</strong> {formatCurrency(metrics.ppc.costPerQL || 0)}</div>
        <div><strong>Cost/QL (LSA):</strong> {formatCurrency(metrics.lsa.costPerQL || 0)}</div>
        <div><strong>Cost/QL (SEO):</strong> {formatCurrency(metrics.seo.costPerQL || 0)}</div>

        <div><strong>Avg Lead Score:</strong> {metrics.all.count ? (metrics.all.leadScore / metrics.all.count).toFixed(1) : '0.0'}</div>
        <div><strong>Avg Sales Score:</strong> {metrics.all.count ? (metrics.all.closeScore / metrics.all.count).toFixed(1) : '0.0'}</div>

        <div><strong>Avg PPC Lead Score:</strong> {metrics.ppc.count ? (metrics.ppc.leadScore / metrics.ppc.count).toFixed(1) : '0.0'}</div>
        <div><strong>Avg PPC Sales Score:</strong> {metrics.ppc.count ? (metrics.ppc.closeScore / metrics.ppc.count).toFixed(1) : '0.0'}</div>

        <div><strong>Avg LSA Lead Score:</strong> {metrics.lsa.count ? (metrics.lsa.leadScore / metrics.lsa.count).toFixed(1) : '0.0'}</div>
        <div><strong>Avg LSA Sales Score:</strong> {metrics.lsa.count ? (metrics.lsa.closeScore / metrics.lsa.count).toFixed(1) : '0.0'}</div>

        <div><strong>Avg SEO Lead Score:</strong> {metrics.seo.count ? (metrics.seo.leadScore / metrics.seo.count).toFixed(1) : '0.0'}</div>
        <div><strong>Avg SEO Sales Score:</strong> {metrics.seo.count ? (metrics.seo.closeScore / metrics.seo.count).toFixed(1) : '0.0'}</div>

        <div><strong>PPC Cost Total:</strong> {formatCurrency(metrics.costTotals.ppc)}</div>
        <div><strong>LSA Cost Total:</strong> {formatCurrency(metrics.costTotals.lsa)}</div>
        <div><strong>SEO Cost Total:</strong> {formatCurrency(metrics.costTotals.seo)}</div>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-2">Qualified Leads by Source</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
            {pieData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
