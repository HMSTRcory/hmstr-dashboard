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

interface LineChartCostProps {
  clientId: number;
  startDate: string;
  endDate: string;
}

const CurrencyLabel = ({ x, y, value }: any) => (
  <text x={x} y={y} dy={-4} fontSize={12} textAnchor="middle" fill="#333">
    {`$${value.toFixed(2)}`}
  </text>
);

export default function LineChartCost({ clientId, startDate, endDate }: LineChartCostProps) {
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!clientId || !startDate || !endDate) return;

    async function fetchData() {
      const { data, error } = await supabase.rpc('get_cost_line_chart_metrics', {
        input_client_id: clientId,
        input_start_date: startDate,
        input_end_date: endDate,
        input_group_by: groupBy,
      });

      if (error || !data) return;

      const formatted = data.map((row: any) => ({
        date: row.date,
        all: row.cpql_total || 0,
        ppc: row.cpql_ppc || 0,
        lsa: row.cpql_lsa || 0,
        seo: row.cpql_seo || 0,
      }));

      setChartData(formatted);
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
            <Line type="monotone" dataKey="all" stroke="#64748b" strokeWidth={2} label={<CurrencyLabel />} />
            <Line type="monotone" dataKey="ppc" stroke="#3b82f6" strokeWidth={2} label={<CurrencyLabel />} />
            <Line type="monotone" dataKey="lsa" stroke="#10b981" strokeWidth={2} label={<CurrencyLabel />} />
            <Line type="monotone" dataKey="seo" stroke="#f59e0b" strokeWidth={2} label={<CurrencyLabel />} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
