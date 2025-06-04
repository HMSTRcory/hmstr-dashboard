import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function nextDay(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

export function getKeyByGroup(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  const d = new Date(date);
  if (groupBy === 'day') {
    return d.toISOString().split('T')[0];
  } else if (groupBy === 'week') {
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    return weekStart.toISOString().split('T')[0];
  } else {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  }
}
