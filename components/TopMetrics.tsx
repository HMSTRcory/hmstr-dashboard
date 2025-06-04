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
  });
  const [pieData, setPieData] = useState<any[]>([]);

  const nextDay = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  const fetchMetrics = async () => {
    if (!clientId || !startDate || !endDate) return;

    const { data: leads, error: leadsError } = await supabase
      .from('hmstr_leads')
      .select('first_qual_date, first_lead_source, lead_score_max, close_score_max')
      .eq('client_id', clientId)
      .eq('hmstr_qualified_lead', true)
      .gte('first_qual_date', startDate)
      .lt('first_qual_date', nextDay(endDate));

    if (leadsError || !leads) return;

    const result = {
      all: { count: 0, leadScore: 0, closeScore: 0, costPerQL: 0 },
      ppc: { count: 0, leadScore: 0, closeScore: 0, costPerQL: 0 },
      lsa: { count: 0, leadScore: 0, closeScore: 0, costPerQL: 0 },
      seo: { count: 0, leadScore: 0, closeScore: 0, costPerQL: 0 },
    };

    leads.forEach((row) => {
      const source = row.first_lead_source;
      const score = row.lead_score_max || 0;
      const close = row.close_score_max || 0;

      result.all.count++;
      result.all.leadScore += score;
      result.all.closeScore += close;

      if (source === 'PPC Pool' || source === 'CTC') {
        result.ppc.count++;
        result.ppc.leadScore += score;
        result.ppc.closeScore += close;
      } else if (source === 'LSA') {
        result.lsa.count++;
        result.lsa.leadScore += score;
        result.lsa.closeScore += close;
      } else if (source === 'GMB') {
        result.seo.count++;
        result.seo.leadScore += score;
        result.seo.closeScore += close;
      }
    });

    const costAll = await getTotalCost(clientId, startDate, endDate);
    const ppcCost = await getTotalPpcCost(clientId, startDate, endDate);
    const lsaCost = await getSpendData('spend_data_lsa', clientId, startDate, endDate);
    const seoCost = await getSpendData('spend_data_seo', clientId, startDate, endDate);

    result.all.costPerQL = result.all.count ? costAll / result.all.count : 0;
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
    const { data: ppc } = await supabase
      .from('googleads_campain_data')
      .select('cost_micros')
      .eq('google_ads_customer_id', getCustomerId(clientId))
      .gte('date', start)
      .lte('date', end); // This table uses DATE (not timestamp)

    return ppc ? ppc.reduce((sum, row) => sum + row.cost_micros / 1_000_000, 0) : 0;
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

  const getCustomerId = (clientId: number) => {
    const map: Record<number, string> = {
      20: '7957327797',
    };
    return map[clientId] || '';
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

        <div><strong>Avg Lead Score:</strong> {(metrics.all.count ? (metrics.all.leadScore / metrics.all.count).toFixed(1) : '0.0')}</div>
        <div><strong>Avg Sales Score:</strong> {(metrics.all.count ? (metrics.all.closeScore / metrics.all.count).toFixed(1) : '0.0')}</div>

        <div><strong>Avg PPC Lead Score:</strong> {(metrics.ppc.count ? (metrics.ppc.leadScore / metrics.ppc.count).toFixed(1) : '0.0')}</div>
        <div><strong>Avg PPC Sales Score:</strong> {(metrics.ppc.count ? (metrics.ppc.closeScore / metrics.ppc.count).toFixed(1) : '0.0')}</div>

        <div><strong>Avg LSA Lead Score:</strong> {(metrics.lsa.count ? (metrics.lsa.leadScore / metrics.lsa.count).toFixed(1) : '0.0')}</div>
        <div><strong>Avg LSA Sales Score:</strong> {(metrics.lsa.count ? (metrics.lsa.closeScore / metrics.lsa.count).toFixed(1) : '0.0')}</div>

        <div><strong>Avg SEO Lead Score:</strong> {(metrics.seo.count ? (metrics.seo.leadScore / metrics.seo.count).toFixed(1) : '0.0')}</div>
        <div><strong>Avg SEO Sales Score:</strong> {(metrics.seo.count ? (metrics.seo.closeScore / metrics.seo.count).toFixed(1) : '0.0')}</div>
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
