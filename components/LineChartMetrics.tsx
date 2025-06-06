'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function LineChartMetrics({
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
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!clientId || !startDate || !endDate || !groupBy) return;

      const { data, error } = await supabase.rpc('get_leads_line_chart_metrics', {
        input_client_id: clientId,
        input_start_date: startDate,
        input_end_date: endDate,
        input_group_by: groupBy,
      });

      if (!error && data) {
        setChartData(data);
      }
    }

    fetchData();
  }, [clientId, startDate, endDate, groupBy]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Qualified Leads Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="ppc" stroke="#3b82f6" name="PPC" />
          <Line type="monotone" dataKey="lsa" stroke="#10b981" name="LSA" />
          <Line type="monotone" dataKey="seo" stroke="#f59e0b" name="SEO" />
          <Line type="monotone" dataKey="other" stroke="#ef4444" name="Other" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}