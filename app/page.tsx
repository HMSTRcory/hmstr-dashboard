'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import TopMetrics from '@/components/TopMetrics';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">HMSTR Dashboard</h1>

      {/* Date Picker */}
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('w-[200px] justify-start text-left font-normal')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'MMM d, yyyy') : <span>Start date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('w-[200px] justify-start text-left font-normal')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'MMM d, yyyy') : <span>End date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Client Selector */}
      <div className="pt-2">
        <label htmlFor="client-select" className="block text-sm font-medium text-gray-700">
          Select Client
        </label>
        <select
          id="client-select"
          className="mt-1 block w-[300px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={selectedClient ?? ''}
          onChange={(e) => setSelectedClient(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">-- Choose a client --</option>
          <option value={188194855}>Chapman Plumbing</option>
          <option value={515168587}>Barn Hill Pest Control</option>
          <option value={234982374}>Example Client</option>
        </select>
      </div>

      <Separator />

      {/* Metrics Display */}
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
