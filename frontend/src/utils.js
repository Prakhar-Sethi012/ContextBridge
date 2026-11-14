import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx and twMerge.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format ISO timestamp into clean UTC string.
 */
export function formatTimestamp(raw) {
  if (!raw) return 'Unknown timestamp';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
  } catch {
    return raw;
  }
}

