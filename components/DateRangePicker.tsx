'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function DateRangePicker({
  onChange,
}: {
  onChange: (start: string, end: string) => void;
}) {
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    const formattedStart = format(startDate, 'yyyy-MM-dd');
    const formattedEnd = format(endDate, 'yyyy-MM-dd');
    onChange(formattedStart, formattedEnd);
  }, [startDate, endDate, onChange]);

  return (
    <div className="flex gap-2 items-center text-sm">
      <label>Start:</label>
      <input
        type="date"
        value={format(startDate, 'yyyy-MM-dd')}
        onChange={(e) => setStartDate(new Date(e.target.value))}
      />
      <label>End:</label>
      <input
        type="date"
        value={format(endDate, 'yyyy-MM-dd')}
        onChange={(e) => setEndDate(new Date(e.target.value))}
      />
    </div>
  );
}
