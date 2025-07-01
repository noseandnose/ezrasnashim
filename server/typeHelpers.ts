// TypeScript utility functions for better type safety and performance

/**
 * Safely gets codePoint from a string character with null check
 */
export function safeCodePointAt(str: string, index: number = 0): number | null {
  const codePoint = str.codePointAt(index);
  return codePoint !== undefined ? codePoint : null;
}

/**
 * Optimized Hebrew text cleaner with proper type safety
 */
export function cleanHebrewText(text: string): string {
  return text
    .replace(/&[a-zA-Z]+;|&#\d+;/g, '') // Remove HTML entities
    .replace(/\{[פס]\}/g, '') // Remove Hebrew paragraph markers
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .replace(/[\u25A0-\u25FF]/g, '') // Remove geometric shapes
    .replace(/[\uE000-\uF8FF]/g, '') // Remove private use area characters
    .replace(/[\u2400-\u243F]/g, '') // Remove control pictures
    .replace(/[\u2500-\u257F]/g, '') // Remove box drawing characters
    .replace(/[\uFE00-\uFE0F]/g, '') // Remove variation selectors
    .replace(/[\u0590-\u05CF]/g, (match) => {
      // Keep valid Hebrew characters, remove problematic ones
      const codePoint = safeCodePointAt(match);
      if (!codePoint) return '';
      if (codePoint >= 0x05D0 && codePoint <= 0x05EA) return match; // Hebrew letters
      if (codePoint >= 0x05B0 && codePoint <= 0x05BD) return match; // Hebrew points
      if (codePoint >= 0x05BF && codePoint <= 0x05C2) return match; // Hebrew points
      if (codePoint >= 0x05C4 && codePoint <= 0x05C5) return match; // Hebrew points
      if (codePoint === 0x05C7) return match; // Hebrew point
      return ''; // Remove other characters in Hebrew block
    })
    .trim();
}

/**
 * Performance-optimized date formatter
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Memoization utility for expensive operations
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Optimized async retry utility
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Type-safe environment variable getter
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue!;
}