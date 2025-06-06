'use client';

import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type LineChartCostProps = {
  clientId: number;
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'week' | 'month';
};

export default function LineChartCost({
  clientId,
  startDate,
  endDate,
  groupBy,
}: LineChartCostProps) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!clientId || !startDate || !endDate || !groupBy) return;

      const { data, error } = await supabase.rpc('get_cost_line_chart_metrics', {
        input_client_id: clientId,
        input_start_date: startDate,
        input_end_date: endDate,
        input_group_by: groupBy,
      });

      if (error) {
        console.error('Error fetching chart data:', error);
        return;
      }

      setData(data);
    }

    fetchData();
  }, [clientId, startDate, endDate, groupBy]);

  return (
    <Card className="mt-6">
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-2">Cost Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="group_date" />
            <YAxis />
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
            <Legend />
            <Line type="monotone" dataKey="ppc" stroke="#3b82f6" name="PPC" />
            <Line type="monotone" dataKey="lsa" stroke="#10b981" name="LSA" />
            <Line type="monotone" dataKey="seo" stroke="#f59e0b" name="SEO" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
