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

  const fetchMetrics = async () => {
    if (!clientId || !startDate || !endDate) return;

    const { data: leads, error: leadsError } = await supabase
      .from('hmstr_leads')
      .select('first_qual_date, first_lead_source, lead_score_max, close_score_max')
      .eq('client_id', clientId)
      .eq('hmstr_qualified_lead', true)
      .gte('first_qual_date', startDate)
      .lte('first_qual_date', endDate);

    if (leadsError || !leads) return;

    const result = {
      all: { count: 0, leadScore: 0, closeScore: 0, cost: 0 },
      ppc: { count: 0, leadScore: 0, closeScore: 0, cost: 0 },
      lsa: { count: 0, leadScore: 0, closeScore: 0, cost: 0 },
      seo: { count: 0, leadScore: 0, closeScore: 0, cost: 0 },
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

    const ppcTotal = await getCost('googleads_campain_data', 'cost_micros', 'google_ads_customer_id', clientId);
    const lsaTotal = await getCost('spend_data_lsa', 'spend', 'client_id', clientId);
    const seoTotal = await getCost('spend_data_seo', 'spend', 'client_id', clientId);

    result.all.cost = ppcTotal + lsaTotal + seoTotal;
    result.ppc.cost = ppcTotal;
    result.lsa.cost = lsaTotal;
    result.seo.cost = seoTotal;

    setMetrics(result);
    setPieData([
      { name: 'PPC', value: result.ppc.count },
      { name: 'LSA', value: result.lsa.count },
      { name: 'SEO', value: result.seo.count },
    ]);
  };

  const getCost = async (table: string, column: string, clientColumn: string, clientId: number) => {
    const { data } = await supabase
      .from(table)
      .select(column)
      .eq(clientColumn, clientColumn === 'google_ads_customer_id' ? getCustomerId(clientId) : clientId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (!data) return 0;

    return data.reduce((sum: number, row: any) => {
      const value = row[column];
      return sum + (column === 'cost_micros' ? value / 1_000_000 : value);
    }, 0);
  };

  const getCustomerId = (clientId: number) => {
    const map: Record<number, string> = {
      20: '7957327797',
    };
    return map[clientId] || '';
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  useEffect(() => {
    fetchMetrics();
  }, [clientId, startDate, endDate]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Top Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div><strong>Start Date:</strong> {startDate}</div>
        <div><strong>End Date:</strong> {endDate}</div>

        <div><strong>All QLeads:</strong> {metrics.all.count}</div>
        <div><strong>PPC QLeads:</strong> {metrics.ppc.count}</div>
        <div><strong>LSA QLeads:</strong> {metrics.lsa.count}</div>
        <div><strong>SEO QLeads:</strong> {metrics.seo.count}</div>

        <div><strong>Cost/QL (All):</strong> {formatCurrency(metrics.all.count ? metrics.all.cost / metrics.all.count : 0)}</div>
        <div><strong>Cost/QL (PPC):</strong> {formatCurrency(metrics.ppc.count ? metrics.ppc.cost / metrics.ppc.count : 0)}</div>
        <div><strong>Cost/QL (LSA):</strong> {formatCurrency(metrics.lsa.count ? metrics.lsa.cost / metrics.lsa.count : 0)}</div>
        <div><strong>Cost/QL (SEO):</strong> {formatCurrency(metrics.seo.count ? metrics.seo.cost / metrics.seo.count : 0)}</div>

        <div><strong>PPC Cost Total:</strong> {formatCurrency(metrics.ppc.cost || 0)}</div>
        <div><strong>LSA Cost Total:</strong> {formatCurrency(metrics.lsa.cost || 0)}</div>
        <div><strong>SEO Cost Total:</strong> {formatCurrency(metrics.seo.cost || 0)}</div>

        <div><strong>Avg Lead Score:</strong> {(metrics.all.count ? (metrics.all.leadScore / metrics.all.count).toFixed(1) : '0.0')}</div>
        <div><strong>Avg Sales Score:</strong> {(metrics.all.count ? (metrics.all.closeScore / metrics.all.count).toFixed(1) : '0.0')}</div>
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
