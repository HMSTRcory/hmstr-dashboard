
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function LineChartCost({ clientId }: { clientId: number }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [chartData, setChartData] = useState<any[]>([]);

  const setQuickRange = (days: number) => {
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  };

  const setLastMonth = () => {
    const now = new Date();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const fetchData = async () => {
    if (!clientId || !startDate || !endDate) return;

    const { data: clients } = await supabase
      .from('clients_ffs')
      .select('ppc_sources, lsa_sources, seo_sources')
      .eq('client_id', clientId)
      .single();

    const { data: rows } = await supabase
      .from('hmstr_leads')
      .select('first_qual_date, first_lead_source, hmstr_qualified_lead')
      .eq('client_id', clientId)
      .eq('hmstr_qualified_lead', true)
      .gte('first_qual_date', startDate)
      .lte('first_qual_date', endDate);

    const { data: spc } = await supabase.rpc('get_spc_cost_by_channel', {
      input_client_id: clientId,
      input_start_date: startDate,
      input_end_date: endDate
    });

    const grouped: Record<string, any> = {};

    for (const row of rows || []) {
      const date = new Date(row.first_qual_date);
      let key = '';

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = \`\${date.getFullYear()}-\${(date.getMonth() + 1).toString().padStart(2, '0')}\`;
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          all: { count: 0 },
          ppc: { count: 0 },
          lsa: { count: 0 },
          seo: { count: 0 },
        };
      }

      grouped[key].all.count++;
      if (clients?.ppc_sources?.includes(row.first_lead_source)) grouped[key].ppc.count++;
      if (clients?.lsa_sources?.includes(row.first_lead_source)) grouped[key].lsa.count++;
      if (clients?.seo_sources?.includes(row.first_lead_source)) grouped[key].seo.count++;
    }

    const totalCounts = {
      all: Object.values(grouped).reduce((sum, d: any) => sum + (d.all.count || 0), 0),
      ppc: Object.values(grouped).reduce((sum, d: any) => sum + (d.ppc.count || 0), 0),
      lsa: Object.values(grouped).reduce((sum, d: any) => sum + (d.lsa.count || 0), 0),
      seo: Object.values(grouped).reduce((sum, d: any) => sum + (d.seo.count || 0), 0),
    };

    const costPerSource = {
      all: spc ? (spc.cost_ppc + spc.cost_lsa + spc.cost_seo) : 0,
      ppc: spc?.cost_ppc || 0,
      lsa: spc?.cost_lsa || 0,
      seo: spc?.cost_seo || 0,
    };

    const result = Object.values(grouped).map((d: any) => ({
      date: d.date,
      all: d.all.count ? costPerSource.all / totalCounts.all : 0,
      ppc: d.ppc.count ? costPerSource.ppc / totalCounts.ppc : 0,
      lsa: d.lsa.count ? costPerSource.lsa / totalCounts.lsa : 0,
      seo: d.seo.count ? costPerSource.seo / totalCounts.seo : 0,
    })).sort((a: any, b: any) => a.date.localeCompare(b.date));

    setChartData(result);
  };

  useEffect(() => {
    setQuickRange(30);
  }, []);

  useEffect(() => {
    fetchData();
  }, [clientId, startDate, endDate, groupBy]);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Cost Per Qualified Lead Over Time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm">Start:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
          <label className="text-sm">End:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setQuickRange(d)}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Last {d} Days
            </button>
          ))}
          <button
            onClick={setLastMonth}
            className="bg-blue-700 text-white px-3 py-1 rounded"
          >
            Last Month
          </button>
          <label className="ml-4 text-sm">Group by:</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="border px-2 py-1 rounded"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(v) => `$${v.toFixed(0)}`} />
            <Tooltip formatter={(v: any) => `$${v.toFixed(2)}`} />
            <Legend />
            <Line type="monotone" dataKey="all" stroke="#64748b" strokeWidth={2} />
            <Line type="monotone" dataKey="ppc" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="lsa" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="seo" stroke="#f59e0b" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
