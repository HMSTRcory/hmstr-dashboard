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
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!clientId || !startDate || !endDate) return;

    const fetchMetrics = async () => {
      const { data, error } = await supabase.rpc('get_top_metrics', {
        input_client_id: clientId,
        input_start_date: startDate,
        input_end_date: endDate,
      });

      if (error || !data || !data[0]) return;
      setData(data[0]);
    };

    fetchMetrics();
  }, [clientId, startDate, endDate]);

  const formatCurrency = (value: number | string) => {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    return `$${(n || 0).toFixed(2)}`;
  };

  if (!data) return null;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Top Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div><strong>All QLeads:</strong> {data.qualified_leads}</div>
        <div><strong>PPC QLeads:</strong> {data.qualified_leads_ppc}</div>
        <div><strong>LSA QLeads:</strong> {data.qualified_leads_lsa}</div>
        <div><strong>SEO QLeads:</strong> {data.qualified_leads_seo}</div>

        <div><strong>Cost/QL (All):</strong> {formatCurrency(data.cpql_total)}</div>
        <div><strong>Cost/QL (PPC):</strong> {formatCurrency(data.cpql_ppc)}</div>
        <div><strong>Cost/QL (LSA):</strong> {formatCurrency(data.cpql_lsa)}</div>
        <div><strong>Cost/QL (SEO):</strong> {formatCurrency(data.cpql_seo)}</div>

        <div><strong>PPC Cost Total:</strong> {formatCurrency(data.spend_ppc)}</div>
        <div><strong>LSA Cost Total:</strong> {formatCurrency(data.spend_lsa)}</div>
        <div><strong>SEO Cost Total:</strong> {formatCurrency(data.spend_seo)}</div>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-2">Qualified Leads by Source</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={[
              { name: 'PPC', value: data.qualified_leads_ppc || 0 },
              { name: 'LSA', value: data.qualified_leads_lsa || 0 },
              { name: 'SEO', value: data.qualified_leads_seo || 0 },
            ]}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
          >
            {[0, 1, 2].map((index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
