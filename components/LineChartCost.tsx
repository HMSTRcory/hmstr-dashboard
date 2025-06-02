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

export default function LineChartCost({
  clientId,
  startDate,
  endDate,
}: {
  clientId: number;
  startDate: string;
  endDate: string;
}) {
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

  useEffect(() => {
    setQuickRange(30);
  }, []);

  useEffect(() => {
    if (!clientId || !startDate || !endDate) return;

    async function fetchData() {
      const { data: clients } = await supabase
        .from('clients_ffs')
        .select('google_ads_act_id')
        .eq('client_id', clientId)
        .single();

      const accountId = clients?.google_ads_act_id;

      const { data: leads } = await supabase
        .from('hmstr_leads')
        .select('first_qual_date, first_lead_source, hmstr_qualified_lead')
        .eq('client_id', clientId)
        .gte('first_qual_date', startDate)
        .lte('first_qual_date', endDate);

      const { data: ppcSpend } = await supabase
        .from('googleads_campain_data')
        .select('date, cost_micros')
        .eq('google_ads_customer_id', accountId)
        .gte('date', startDate)
        .lte('date', endDate);

      const { data: lsaSpend } = await supabase
        .from('spend_data_lsa')
        .select('date, spend')
        .eq('client_id', clientId)
        .gte('date', startDate)
        .lte('date', endDate);

      const { data: seoSpend } = await supabase
        .from('spend_data_seo')
        .select('date, spend')
        .eq('client_id', clientId)
        .gte('date', startDate)
        .lte('date', endDate);

      const grouped: Record<string, any> = {};

      for (const row of leads || []) {
        if (!row.hmstr_qualified_lead) continue;

        const date = new Date(row.first_qual_date);
        let key = '';

        if (groupBy === 'day') {
          key = date.toISOString().split('T')[0];
        } else if (groupBy === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
        } else if (groupBy === 'month') {
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        }

        if (!grouped[key]) {
          grouped[key] = {
            date: key,
            all: { cost: 0, count: 0 },
            ppc: { cost: 0, count: 0 },
            lsa: { cost: 0, count: 0 },
            seo: { cost: 0, count: 0 },
          };
        }

        grouped[key].all.count++;
        if (row.first_lead_source === 'PPC Pool' || row.first_lead_source === 'CTC') grouped[key].ppc.count++;
        if (row.first_lead_source === 'LSA') grouped[key].lsa.count++;
        if (row.first_lead_source === 'GMB') grouped[key].seo.count++;
      }

      for (const spend of ppcSpend || []) {
        const key = groupBy === 'day'
          ? spend.date
          : groupBy === 'week'
          ? new Date(spend.date).toISOString().split('T')[0]
          : `${new Date(spend.date).getFullYear()}-${(new Date(spend.date).getMonth() + 1).toString().padStart(2, '0')}`;

        if (!grouped[key]) grouped[key] = { date: key, all: {}, ppc: {}, lsa: {}, seo: {} };
        grouped[key].all.cost = (grouped[key].all.cost || 0) + spend.cost_micros / 1_000_000;
        grouped[key].ppc.cost = (grouped[key].ppc.cost || 0) + spend.cost_micros / 1_000_000;
      }

      for (const spend of lsaSpend || []) {
        const key = groupBy === 'day'
          ? spend.date.split('T')[0]
          : groupBy === 'week'
          ? new Date(spend.date).toISOString().split('T')[0]
          : `${new Date(spend.date).getFullYear()}-${(new Date(spend.date).getMonth() + 1).toString().padStart(2, '0')}`;

        if (!grouped[key]) grouped[key] = { date: key, all: {}, ppc: {}, lsa: {}, seo: {} };
        grouped[key].all.cost = (grouped[key].all.cost || 0) + spend.spend;
        grouped[key].lsa.cost = (grouped[key].lsa.cost || 0) + spend.spend;
      }

      for (const spend of seoSpend || []) {
        const key = groupBy === 'day'
          ? spend.date.split('T')[0]
          : groupBy === 'week'
          ? new Date(spend.date).toISOString().split('T')[0]
          : `${new Date(spend.date).getFullYear()}-${(new Date(spend.date).getMonth() + 1).toString().padStart(2, '0')}`;

        if (!grouped[key]) grouped[key] = { date: key, all: {}, ppc: {}, lsa: {}, seo: {} };
        grouped[key].all.cost = (grouped[key].all.cost || 0) + spend.spend;
        grouped[key].seo.cost = (grouped[key].seo.cost || 0) + spend.spend;
      }

      const result = Object.values(grouped).map((d: any) => ({
        date: d.date,
        all: d.all.count ? d.all.cost / d.all.count : 0,
        ppc: d.ppc.count ? d.ppc.cost / d.ppc.count : 0,
        lsa: d.lsa.count ? d.lsa.cost / d.lsa.count : 0,
        seo: d.seo.count ? d.seo.cost / d.seo.count : 0,
      })).sort((a: any, b: any) => a.date.localeCompare(b.date));

      setChartData(result);
    }

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
            <Line type="monotone" dataKey="all" stroke="#64748b" strokeWidth={2} label={({ x, y, value }) => <text x={x} y={y - 10} fontSize="10">${value.toFixed(2)}</text>} />
            <Line type="monotone" dataKey="ppc" stroke="#3b82f6" strokeWidth={2} label={({ x, y, value }) => <text x={x} y={y - 10} fontSize="10">${value.toFixed(2)}</text>} />
            <Line type="monotone" dataKey="lsa" stroke="#10b981" strokeWidth={2} label={({ x, y, value }) => <text x={x} y={y - 10} fontSize="10">${value.toFixed(2)}</text>} />
            <Line type="monotone" dataKey="seo" stroke="#f59e0b" strokeWidth={2} label={({ x, y, value }) => <text x={x} y={y - 10} fontSize="10">${value.toFixed(2)}</text>} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
