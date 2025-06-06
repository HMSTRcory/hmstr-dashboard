'use client';

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

interface DashboardFiltersProps {
  clients: { id: number; name: string }[];
  selectedClient: number | null;
  onClientChange: (clientId: number) => void;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  groupBy: 'day' | 'week' | 'month';
  onGroupByChange: (g: 'day' | 'week' | 'month') => void;
}

function DashboardFilters({
  clients,
  selectedClient,
  onClientChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  groupBy,
  onGroupByChange,
}: DashboardFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 flex-wrap">
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

      {/* Group By */}
      <div className="flex items-center gap-2">
        <Label>Group By:</Label>
        <select
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value as 'day' | 'week' | 'month')}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>
    </div>
  );
}

export default DashboardFilters;
