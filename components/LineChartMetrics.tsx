'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function LineChartCost({
  clientId,
  startDate,
  endDate,
  groupBy,
}: {
  clientId: number;
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'week' | 'month';
}) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.rpc('get_cost_line_chart_metrics', {
        input_client_id: clientId,
        input_start_date: startDate,
        input_end_date: endDate,
        input_group_by: groupBy,
      });

      if (error || !data) {
        console.error('Error fetching cost line chart data:', error);
        return;
      }

      setData(data);
    }

    fetchData();
  }, [clientId, startDate, endDate, groupBy]);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-lg font-semibold mb-2">Cost Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="group_date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="ppc" stroke="#3b82f6" name="PPC" />
          <Line type="monotone" dataKey="lsa" stroke="#10b981" name="LSA" />
          <Line type="monotone" dataKey="seo" stroke="#f59e0b" name="SEO" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
