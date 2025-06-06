'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/layouts/Shell';
import TopMetrics from '@/components/TopMetrics';
import LineChartMetrics from '@/components/LineChartMetrics';
import LineChartCost from '@/components/LineChartCost';
import DashboardFilters from '@/components/DashboardFilters';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month');

  useEffect(() => {
    async function loadClients() {
      const { data: clientRows, error } = await supabase
        .from('clients_ffs')
        .select('client_id, cr_company_name');

      if (!error && clientRows && clientRows.length > 0) {
        const mapped = clientRows.map((row) => ({
          id: row.client_id,
          name: row.cr_company_name,
        }));
        setClients(mapped);
        setSelectedClient(mapped[0].id);
      }
    }

    loadClients();

    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 30);
    setStartDate(past);
    setEndDate(now);
  }, []);

  const start = startDate?.toISOString().split('T')[0] ?? '';
  const end = endDate?.toISOString().split('T')[0] ?? '';

  return (
    <Shell>
      <div className="p-6 font-sans">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

        <DashboardFilters
          clients={clients}
          selectedClient={selectedClient}
          onClientChange={setSelectedClient}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
        />

        {selectedClient && start && end && (
          <>
            <TopMetrics clientId={selectedClient} startDate={start} endDate={end} />
            <LineChartMetrics clientId={selectedClient} startDate={start} endDate={end} groupBy={groupBy} />
            <LineChartCost clientId={selectedClient} startDate={start} endDate={end} groupBy={groupBy} />
          </>
        )}
      </div>
    </Shell>
  );
}
