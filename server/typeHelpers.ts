// TypeScript utility functions for better type safety and performance

/**
 * Performance-optimized date formatter
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}