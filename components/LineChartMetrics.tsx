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
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface LineChartMetricsProps {
  clientId: number;
  startDate: string;
  endDate: string;
}

export default function LineChartMetrics({ clientId, startDate, endDate }: LineChartMetricsProps) {
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [chartData, setChartData] = useState<any[]>([]);

  const nextDay = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!clientId || !startDate || !endDate) return;

    async function fetchData() {
      // Get the source rules from clients_ffs
      const { data: clientSources } = await supabase
        .from('clients_ffs')
        .select('ppc_sources, lsa_sources, seo_sources')
        .eq('client_id', clientId)
        .single();

      const { data: leads } = await supabase
        .from('hmstr_leads')
        .select('first_qual_date, first_lead_source')
        .eq('client_id', clientId)
        .eq('hmstr_qualified_lead', true)
        .gte('first_qual_date', `${startDate}T00:00:00`)
        .lt('first_qual_date', `${nextDay(endDate)}T00:00:00`);

      const grouped: Record<string, any> = {};

      for (const row of leads || []) {
        const date = new Date(row.first_qual_date);
        let key = '';

        if (groupBy === 'day') {
          key = date.toISOString().split('T')[0];
        } else if (groupBy === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().split('T')[0];
        } else if (groupBy === 'month') {
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        }

        if (!grouped[key]) {
          grouped[key] = { date: key, all: 0, ppc: 0, lsa: 0, seo: 0 };
        }

        grouped[key].all++;

        if (clientSources?.ppc_sources?.includes(row.first_lead_source)) grouped[key].ppc++;
        if (clientSources?.lsa_sources?.includes(row.first_lead_source)) grouped[key].lsa++;
        if (clientSources?.seo_sources?.includes(row.first_lead_source)) grouped[key].seo++;
      }

      const final = Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));
      setChartData(final);
    }

    fetchData();
  }, [clientId, startDate, endDate, groupBy]);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Qualified Leads Over Time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
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
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="all" stroke="#64748b" strokeWidth={2} label={{ position: 'top' }} />
            <Line type="monotone" dataKey="ppc" stroke="#3b82f6" strokeWidth={2} label={{ position: 'top' }} />
            <Line type="monotone" dataKey="lsa" stroke="#10b981" strokeWidth={2} label={{ position: 'top' }} />
            <Line type="monotone" dataKey="seo" stroke="#f59e0b" strokeWidth={2} label={{ position: 'top' }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
