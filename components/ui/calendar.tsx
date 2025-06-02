'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import type { DayPickerProps } from 'react-day-picker';
import 'react-day-picker/dist/style.css'; // If you can't load this, you can manually add CSS below.

import { cn } from '@/lib/utils';

export function Calendar({
  className,
  classNames,
  ...props
}: DayPickerProps & { className?: string; classNames?: any }) {
  return (
    <DayPicker
      showOutsideDays
      className={cn('rounded-md border bg-white p-3 shadow', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell:
          'text-gray-500 rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md',
        day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
        day_selected:
          'bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-600',
        day_today: 'bg-muted text-muted-foreground',
        day_outside: 'text-gray-300 opacity-50',
        day_disabled: 'text-gray-400 opacity-50',
        day_range_middle:
          'aria-selected:bg-blue-100 aria-selected:text-blue-800',
        day_hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  );
}
