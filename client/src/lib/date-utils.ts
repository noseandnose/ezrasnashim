// Date utilities for consistent timezone handling
// Day starts at 02:00 local time for analytics

/**
 * Get the analytics date string (YYYY-MM-DD) for a given timestamp
 * Day transitions at 02:00 local time instead of midnight
 */
export function getAnalyticsDateString(date: Date = new Date()): string {
  const localDate = new Date(date);
  const hours = localDate.getHours();
  
  // If it's between midnight and 02:00, count it as the previous day
  if (hours < 2) {
    localDate.setDate(localDate.getDate() - 1);
  }
  
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get the start of the analytics day (02:00 local time)
 */
export function getAnalyticsDayStart(date: Date = new Date()): Date {
  const result = new Date(date);
  const hours = result.getHours();
  
  // If it's before 02:00, go to 02:00 of the previous day
  if (hours < 2) {
    result.setDate(result.getDate() - 1);
  }
  
  result.setHours(2, 0, 0, 0);
  return result;
}

/**
 * Get the end of the analytics day (01:59:59 of the next calendar day)
 */
export function getAnalyticsDayEnd(date: Date = new Date()): Date {
  const start = getAnalyticsDayStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setSeconds(end.getSeconds() - 1);
  return end;
}

/**
 * Check if a date falls within today's analytics period
 */
export function isAnalyticsToday(date: Date): boolean {
  const now = new Date();
  const todayStart = getAnalyticsDayStart(now);
  const todayEnd = getAnalyticsDayEnd(now);
  
  return date >= todayStart && date <= todayEnd;
}

/**
 * Get the analytics month (considers 02:00 cutoff)
 */
export function getAnalyticsMonth(date: Date = new Date()): string {
  const analyticsDate = getAnalyticsDateString(date);
  return analyticsDate.substring(0, 7); // YYYY-MM
}

/**
 * Standard date string for non-analytics use (local midnight reset)
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}