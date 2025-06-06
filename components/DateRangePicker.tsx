'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function TopMetrics({ clientId }: { clientId: number }) {
  const [totals, setTotals] = useState({
    all: 0,
    ppc: 0,
    lsa: 0,
    seo: 0,
  });
  const [engageRate, setEngageRate] = useState(0);

  useEffect(() => {
    async function fetchLeadTotals() {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      const startDate = start.toISOString().split('T')[0];
      const endDate = now.toISOString().split('T')[0];

      const { data: sourceRows } = await supabase
        .from('hmstr_leads')
        .select('first_lead_source')
        .eq('client_id', clientId)
        .eq('hmstr_qualified_lead', true)
        .gte('first_qual_date', startDate)
        .lte('first_qual_date', endDate);

      const counts = {
        all: sourceRows?.length || 0,
        ppc: sourceRows?.filter((r) => ['PPC Pool', 'CTC'].includes(r.first_lead_source)).length || 0,
        lsa: sourceRows?.filter((r) => r.first_lead_source === 'LSA').length || 0,
        seo: sourceRows?.filter((r) => r.first_lead_source === 'GMB').length || 0,
      };

      setTotals(counts);
    }

    async function fetchEngageRate() {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      const startDate = start.toISOString().split('T')[0];
      const endDate = now.toISOString().split('T')[0];

      const { data: rows } = await supabase
        .from('hmstr_ai_data')
        .select('human_engaged')
        .eq('client_id', clientId)
        .gte('action_date', startDate)
        .lte('action_date', endDate);

      if (!rows || rows.length === 0) {
        setEngageRate(0);
        return;
      }

      const engaged = rows.filter((r) => r.human_engaged === true || r.human_engaged === 'true').length;
      setEngageRate((engaged / rows.length) * 100);
    }

    fetchLeadTotals();
    fetchEngageRate();
  }, [clientId]);

  const chartData = [
    { name: 'PPC', value: totals.ppc },
    { name: 'LSA', value: totals.lsa },
    { name: 'SEO', value: totals.seo },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground">All QLeads</div>
            <div className="text-xl font-bold">{totals.all}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground">PPC QLeads</div>
            <div className="text-xl font-bold">{totals.ppc}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground">LSA QLeads</div>
            <div className="text-xl font-bold">{totals.lsa}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground">SEO QLeads</div>
            <div className="text-xl font-bold">{totals.seo}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground">Human Engage Rate</div>
            <div className="text-xl font-bold">{engageRate.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Qualified Leads by Source</h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
