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

interface Metric {
  count: number;
  leadScore: number;
  closeScore: number;
  costPerQL?: number;
}

interface AllMetrics {
  all: Metric;
  ppc: Metric;
  lsa: Metric;
  seo: Metric;
}

interface PieDatum {
  name: string;
  value: number;
}

export default function TopMetrics({
  clientId,
  startDate,
  endDate,
}: {
  clientId: number;
  startDate: string;
  endDate: string;
}) {
  const [metrics, setMetrics] = useState<AllMetrics>({
    all: { count: 0, leadScore: 0, closeScore: 0 },
    ppc: { count: 0, leadScore: 0, closeScore: 0 },
    lsa: { count: 0, leadScore: 0, closeScore: 0 },
    seo: { count: 0, leadScore: 0, closeScore: 0 },
  });

  const [pieData, setPieData] = useState<PieDatum[]>([]);
  const [costs, setCosts] = useState<{ all: number; ppc: number; lsa: number; seo: number }>({
    all: 0,
    ppc: 0,
    lsa: 0,
    seo: 0,
  });

  const getSpcCosts = async (clientId: number, start: string, end: string) => {
    const { data, error } = await supabase.rpc('get_spc_cost_by_channel', {
      input_client_id: clientId,
      input_start_date: start,
      input_end_date: end,
    });

    if (error || !data || !Array.isArray(data)) return { ppc: 0, lsa: 0, seo: 0 };

    const row = data[0];
    return {
      ppc: row.cost_ppc || 0,
      lsa: row.cost_lsa || 0,
      seo: row.cost_seo || 0,
    };
  };

  useEffect(() => {
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

      const result: AllMetrics = {
        all: { count: 0, leadScore: 0, closeScore: 0 },
        ppc: { count: 0, leadScore: 0, closeScore: 0 },
        lsa: { count: 0, leadScore: 0, closeScore: 0 },
        seo: { count: 0, leadScore: 0, closeScore: 0 },
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

      const spc = await getSpcCosts(clientId, startDate, endDate);
      const total = spc.ppc + spc.lsa + spc.seo;

      result.all.costPerQL = result.all.count ? total / result.all.count : 0;
      result.ppc.costPerQL = result.ppc.count ? spc.ppc / result.ppc.count : 0;
      result.lsa.costPerQL = result.lsa.count ? spc.lsa / result.lsa.count : 0;
      result.seo.costPerQL = result.seo.count ? spc.seo / result.seo.count : 0;

      setMetrics(result);
      setCosts({ all: total, ...spc });
      setPieData([
        { name: 'PPC', value: result.ppc.count },
        { name: 'LSA', value: result.lsa.count },
        { name: 'SEO', value: result.seo.count },
      ]);
    };

    fetchMetrics();
  }, [clientId, startDate, endDate]);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Top Metrics</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Showing data from <strong>{startDate}</strong> to <strong>{endDate}</strong>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div><strong>All QLeads:</strong> {metrics.all.count}</div>
        <div><strong>PPC QLeads:</strong> {metrics.ppc.count}</div>
        <div><strong>LSA QLeads:</strong> {metrics.lsa.count}</div>
        <div><strong>SEO QLeads:</strong> {metrics.seo.count}</div>

        <div><strong>Total Cost (All):</strong> {formatCurrency(costs.all)}</div>
        <div><strong>Total Cost (PPC):</strong> {formatCurrency(costs.ppc)}</div>
        <div><strong>Total Cost (LSA):</strong> {formatCurrency(costs.lsa)}</div>
        <div><strong>Total Cost (SEO):</strong> {formatCurrency(costs.seo)}</div>

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
