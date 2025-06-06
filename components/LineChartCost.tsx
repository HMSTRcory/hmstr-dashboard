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
  groupBy: 'day' | 'week' | 'month';
}

export default function LineChartCost({
  clientId,
  startDate,
  endDate,
  groupBy,
}: LineChartCostProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  const formatDate = (date: Date): string => date.toISOString().split('T')[0];

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
          key = formatDate(date);
        } else if (groupBy === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = formatDate(weekStart);
        } else if (groupBy === 'month') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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
        if (['PPC Pool', 'CTC'].includes(row.first_lead_source)) grouped[key].ppc.count++;
        if (row.first_lead_source === 'LSA') grouped[key].lsa.count++;
        if (row.first_lead_source === 'GMB') grouped[key].seo.count++;
      }

      for (const spend of ppcSpend || []) {
        const date = new Date(spend.date);
        const key =
          groupBy === 'day'
            ? formatDate(date)
            : groupBy === 'week'
            ? formatDate(new Date(date.setDate(date.getDate() - date.getDay())))
            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        grouped[key] = grouped[key] || { date: key, all: {}, ppc: {}, lsa: {}, seo: {} };
        grouped[key].all.cost = (grouped[key].all.cost || 0) + spend.cost_micros / 1_000_000;
        grouped[key].ppc.cost = (grouped[key].ppc.cost || 0) + spend.cost_micros / 1_000_000;
      }

      for (const spend of lsaSpend || []) {
        const date = new Date(spend.date);
        const key =
          groupBy === 'day'
            ? formatDate(date)
            : groupBy === 'week'
            ? formatDate(new Date(date.setDate(date.getDate() - date.getDay())))
            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        grouped[key] = grouped[key] || { date: key, all: {}, ppc: {}, lsa: {}, seo: {} };
        grouped[key].all.cost = (grouped[key].all.cost || 0) + spend.spend;
        grouped[key].lsa.cost = (grouped[key].lsa.cost || 0) + spend.spend;
      }

      for (const spend of seoSpend || []) {
        const date = new Date(spend.date);
        const key =
          groupBy === 'day'
            ? formatDate(date)
            : groupBy === 'week'
            ? formatDate(new Date(date.setDate(date.getDate() - date.getDay())))
            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        grouped[key] = grouped[key] || { date: key, all: {}, ppc: {}, lsa: {}, seo: {} };
        grouped[key].all.cost = (grouped[key].all.cost || 0) + spend.spend;
        grouped[key].seo.cost = (grouped[key].seo.cost || 0) + spend.spend;
      }

      const result = Object.values(grouped).map((d: any) => ({
        date: d.date,
        all: d.all.count ? d.all.cost / d.all.count : 0,
        ppc: d.ppc.count ? d.ppc.cost / d.ppc.count : 0,
        lsa: d.lsa.count ? d.lsa.cost / d.lsa.count : 0,
        seo: d.seo.count ? d.seo.cost / d.seo.count : 0,
      }));

      result.sort((a, b) => a.date.localeCompare(b.date));
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
