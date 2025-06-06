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

    const { data: leads } = await supabase
      .from('hmstr_leads')
      .select('first_qual_date, first_lead_source, lead_score_max, close_score_max')
      .eq('client_id', clientId)
      .eq('hmstr_qualified_lead', true)
      .gte('first_qual_date', startDate)
      .lte('first_qual_date', endDate);

    const result = {
      all: { count: 0, leadScore: 0, closeScore: 0 },
      ppc: { count: 0, leadScore: 0, closeScore: 0 },
      lsa: { count: 0, leadScore: 0, closeScore: 0 },
      seo: { count: 0, leadScore: 0, closeScore: 0 },
    };

    leads?.forEach((row) => {
      const source = row.first_lead_source;
      const lead = row.lead_score_max || 0;
      const close = row.close_score_max || 0;

      result.all.count++;
      result.all.leadScore += lead;
      result.all.closeScore += close;

      if (['PPC Pool', 'CTC'].includes(source)) {
        result.ppc.count++;
        result.ppc.leadScore += lead;
        result.ppc.closeScore += close;
      } else if (source === 'LSA') {
        result.lsa.count++;
        result.lsa.leadScore += lead;
        result.lsa.closeScore += close;
      } else if (source === 'GMB') {
        result.seo.count++;
        result.seo.leadScore += lead;
        result.seo.closeScore += close;
      }
    });

    const ppcTotal = await getCost('googleads_campain_data', 'cost_micros', 'google_ads_customer_id', getCustomerId(clientId));
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

  const getCustomerId = (clientId: number): string => {
    const map: Record<number, string> = {
      20: '7957327797',
    };
    return map[clientId] || '';
  };

  const getCost = async (
    table: string,
    column: string,
    matchField: string,
    matchValue: string | number
  ) => {
    const { data } = await supabase
      .from(table)
      .select(column)
      .eq(matchField, matchValue)
      .gte('date', startDate)
      .lte('date', endDate);

    if (!data) return 0;

    return data.reduce((sum, row) => sum + (row[column] / (column === 'cost_micros' ? 1_000_000 : 1)), 0);
  };

  const formatCurrency = (val: number) => `$${val.toFixed(2)}`;

  useEffect(() => {
    fetchMetrics();
  }, [clientId, startDate, endDate]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Top Metrics</h2>

      <div className="mb-4 text-sm">
        <strong>Start Date:</strong> {startDate} <br />
        <strong>End Date:</strong> {endDate}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div><strong>All QLeads:</strong> {metrics.all.count}</div>
        <div><strong>PPC QLeads:</strong> {metrics.ppc.count}</div>
        <div><strong>LSA QLeads:</strong> {metrics.lsa.count}</div>
        <div><strong>SEO QLeads:</strong> {metrics.seo.count}</div>

        <div><strong>Cost Total (All):</strong> {formatCurrency(metrics.all.cost || 0)}</div>
        <div><strong>PPC Cost:</strong> {formatCurrency(metrics.ppc.cost || 0)}</div>
        <div><strong>LSA Cost:</strong> {formatCurrency(metrics.lsa.cost || 0)}</div>
        <div><strong>SEO Cost:</strong> {formatCurrency(metrics.seo.cost || 0)}</div>
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