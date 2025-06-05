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

  useEffect(() => {
    if (!clientId || !startDate || !endDate) return;

    async function fetchData() {
      const { data, error } = await supabase.rpc('get_leads_line_chart_metrics', {
        input_client_id: clientId,
        input_start_date: startDate,
        input_end_date: endDate,
        input_group_by: groupBy,
      });

      if (error || !data) return;

      const transformed = data.map((d: any) => ({
        date: d.date,
        ppc: d.ppc || 0,
        lsa: d.lsa || 0,
        seo: d.seo || 0,
        other: d.other || 0,
        all: (d.ppc || 0) + (d.lsa || 0) + (d.seo || 0) + (d.other || 0),
      }));

      setChartData(transformed);
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
