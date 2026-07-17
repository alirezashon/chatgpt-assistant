import { clsx, type ClassValue } from 'clsx';

export function cn(...values: readonly ClassValue[]): string {
  return clsx(values);
}
