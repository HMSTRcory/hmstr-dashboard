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
  });
  const [pieData, setPieData] = useState<any[]>([]);

  const fetchMetrics = async () => {
    if (!clientId || !startDate || !endDate) return;

    const { data, error } = await supabase.rpc('get_top_metrics', {
      input_client_id: clientId,
      input_start_date: startDate,
      input_end_date: endDate,
    });

    if (error || !data || !data[0]) return;

    const row = data[0];

    const result = {
      all: {
        count: row.qualified_leads || 0,
        costPerQL: row.cpql_total || 0,
        totalCost: row.spend_total || 0,
        leadScore: 0,
        closeScore: 0,
      },
      ppc: {
        count: row.qualified_leads_ppc || 0,
        costPerQL: row.cpql_ppc || 0,
        totalCost: row.spend_ppc || 0,
        leadScore: 0,
        closeScore: 0,
      },
      lsa: {
        count: row.qualified_leads_lsa || 0,
        costPerQL: row.cpql_lsa || 0,
        totalCost: row.spend_lsa || 0,
        leadScore: 0,
        closeScore: 0,
      },
      seo: {
        count: row.qualified_leads_seo || 0,
        costPerQL: row.cpql_seo || 0,
        totalCost: row.spend_seo || 0,
        leadScore: 0,
        closeScore: 0,
      },
    };

    setMetrics(result);
    setPieData([
      { name: 'PPC', value: result.ppc.count },
      { name: 'LSA', value: result.lsa.count },
      { name: 'SEO', value: result.seo.count },
    ]);
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

        <div><strong>PPC Cost Total:</strong> {formatCurrency(metrics.ppc.totalCost || 0)}</div>
        <div><strong>LSA Cost Total:</strong> {formatCurrency(metrics.lsa.totalCost || 0)}</div>
        <div><strong>SEO Cost Total:</strong> {formatCurrency(metrics.seo.totalCost || 0)}</div>

        <div><strong>Avg Lead Score:</strong> 0.0</div>
        <div><strong>Avg Sales Score:</strong> 0.0</div>

        <div><strong>Avg PPC Lead Score:</strong> 0.0</div>
        <div><strong>Avg PPC Sales Score:</strong> 0.0</div>

        <div><strong>Avg LSA Lead Score:</strong> 0.0</div>
        <div><strong>Avg LSA Sales Score:</strong> 0.0</div>

        <div><strong>Avg SEO Lead Score:</strong> 0.0</div>
        <div><strong>Avg SEO Sales Score:</strong> 0.0</div>
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
