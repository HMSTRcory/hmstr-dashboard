'use client';

import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import TopMetrics from '@/components/TopMetrics';
import DashboardFilters from '@/components/DashboardFilters';
import { createClient } from '@/lib/supabaseClient';

export default function DashboardPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('clients_ffs')
        .select('cr_client_id, cr_company_name')
        .order('cr_company_name');

      if (!error && data) {
        const mapped = data.map((client) => ({
          id: client.cr_client_id,
          name: client.cr_company_name,
        }));
        setClients(mapped);
      } else {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">HMSTR Dashboard</h1>

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

      <Separator />

      {selectedClient && startDate && endDate && (
        <TopMetrics
          clientId={selectedClient.toString()}
          startDate={startDate.toISOString().split('T')[0]}
          endDate={endDate.toISOString().split('T')[0]}
        />
      )}
    </div>
  );
}
