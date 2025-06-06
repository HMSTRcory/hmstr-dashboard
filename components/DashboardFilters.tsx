'use client';

import { useEffect, useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface DashboardFiltersProps {
  clients: { id: number; name: string }[];
  selectedClient: number | null;
  onClientChange: (clientId: number) => void;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

function DashboardFilters({
  clients,
  selectedClient,
  onClientChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DashboardFiltersProps) {
  function setRange(days: number) {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - days);
    onStartDateChange(past);
    onEndDateChange(now);
  }

  function setLastMonth() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    onStartDateChange(firstDay);
    onEndDateChange(lastDay);
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
      {/* Client Selector */}
      <div className="flex items-center gap-2">
        <Label htmlFor="client">Client:</Label>
        <select
          id="client"
          value={selectedClient || ''}
          onChange={(e) => onClientChange(Number(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date Pickers */}
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="default" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {startDate ? format(startDate, 'MM/dd/yyyy') : 'Pick start'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="default" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {endDate ? format(endDate, 'MM/dd/yyyy') : 'Pick end'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick Range Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="default" onClick={() => setRange(7)}>
          Last 7 Days
        </Button>
        <Button variant="default" onClick={() => setRange(30)}>
          Last 30 Days
        </Button>
        <Button variant="default" onClick={() => setRange(90)}>
          Last 90 Days
        </Button>
        <Button variant="default" onClick={setLastMonth}>
          Last Month
        </Button>
      </div>
    </div>
  );
}

export default DashboardFilters;
