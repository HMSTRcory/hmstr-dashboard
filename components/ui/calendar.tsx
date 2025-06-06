'use client';

import * as React from 'react';
import { DayPickerSingleProps, DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

type CalendarProps = DayPickerSingleProps;

export function Calendar(props: CalendarProps) {
  return (
    <DayPicker
      className="rounded-md border bg-white shadow"
      classNames={{
        caption: 'flex justify-center pt-1 relative items-center',
        nav: 'flex items-center',
        nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent',
        day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
        day_selected: 'bg-primary text-primary-foreground hover:bg-primary/90',
        day_today: 'bg-accent text-accent-foreground',
      }}
      {...props}
    />
  );
}
