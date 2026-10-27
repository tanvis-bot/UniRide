import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';

export function currency(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function formatDay(date: string): string {
  const parsed = parseISO(date);
  if (isToday(parsed)) return 'Today';
  if (isTomorrow(parsed)) return 'Tomorrow';
  return format(parsed, 'EEE, d MMM');
}

export function formatLongDay(date: string): string {
  return format(parseISO(date), 'EEEE, d MMMM yyyy');
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return format(date, 'h:mm a');
}

export function fromNow(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const rideStageLabel: Record<string, string> = {
  starting_soon: 'Starting soon',
  driver_on_the_way: 'Driver on the way',
  ride_started: 'Ride started',
  in_progress: 'In progress',
  arriving: 'Arriving',
  completed: 'Completed'
};