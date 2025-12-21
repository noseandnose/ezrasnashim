// Centralized date utility for consistent local timezone handling
// This ensures all user activities reset at the same local time
// Day starts at 02:00 local time for analytics and daily resets

export const getLocalDateString = (): string => {
  const now = new Date();
  const hours = now.getHours();
  
  // Day starts at 02:00 local time
  // If it's between midnight and 02:00, count it as the previous day
  if (hours < 2) {
    now.setDate(now.getDate() - 1);
  }
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalYesterdayString = (): string => {
  const yesterday = new Date();
  const hours = yesterday.getHours();
  
  // Day starts at 02:00 local time
  // Adjust the date based on current time
  if (hours < 2) {
    // If it's between midnight and 02:00, we're still in "yesterday" 
    // so actual yesterday is 2 days ago
    yesterday.setDate(yesterday.getDate() - 2);
  } else {
    // Normal case: yesterday is 1 day ago
    yesterday.setDate(yesterday.getDate() - 1);
  }
  
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Add days to a YYYY-MM-DD date string using pure arithmetic - no Date objects
 * This ensures consistent results regardless of timezone or execution environment
 */
function addDaysToDateString(dateString: string, daysToAdd: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Days in each month (non-leap year)
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Check for leap year
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  if (isLeap) {
    daysInMonth[1] = 29; // February has 29 days in leap year
  }
  
  let newDay = day + daysToAdd;
  let newMonth = month;
  let newYear = year;
  
  // Handle day overflow
  while (newDay > daysInMonth[newMonth - 1]) {
    newDay -= daysInMonth[newMonth - 1];
    newMonth++;
    
    // Handle month overflow
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
      
      // Recalculate leap year for new year
      const newIsLeap = (newYear % 4 === 0 && newYear % 100 !== 0) || (newYear % 400 === 0);
      daysInMonth[1] = newIsLeap ? 29 : 28;
    }
  }
  
  // Format back to YYYY-MM-DD
  const yearStr = String(newYear);
  const monthStr = String(newMonth).padStart(2, '0');
  const dayStr = String(newDay).padStart(2, '0');
  
  return `${yearStr}-${monthStr}-${dayStr}`;
}

export const getLocalTomorrowString = (): string => {
  // Get today's date using the app's consistent day-start logic
  const today = getLocalDateString();
  
  // Add one day using pure string arithmetic (no Date objects = no timezone issues)
  return addDaysToDateString(today, 1);
};

/**
 * Get the halachic date string (YYYY-MM-DD) accounting for shkia (sunset).
 * In Jewish law, the day begins at sunset, so after shkia we're in the next day.
 * 
 * @param shkiaTime - The sunset time as an ISO string or Date, or null if unknown
 * @returns The halachic date string in YYYY-MM-DD format
 * 
 * If shkia is unknown, falls back to civil date with 2am day boundary.
 */
export const getHalachicDateString = (shkiaTime?: string | Date | null): string => {
  const now = new Date();
  
  // If no shkia time provided, fall back to simple civil date
  if (!shkiaTime) {
    return getLocalDateString();
  }
  
  // Parse shkia time
  let shkia: Date;
  if (typeof shkiaTime === 'string') {
    shkia = new Date(shkiaTime);
  } else {
    shkia = shkiaTime;
  }
  
  // Check if shkia is valid
  if (isNaN(shkia.getTime())) {
    return getLocalDateString();
  }
  
  // Get today's date (civil)
  const civilYear = now.getFullYear();
  const civilMonth = String(now.getMonth() + 1).padStart(2, '0');
  const civilDay = String(now.getDate()).padStart(2, '0');
  const civilDate = `${civilYear}-${civilMonth}-${civilDay}`;
  
  // If current time is after shkia, we're in the next halachic day
  if (now > shkia) {
    return addDaysToDateString(civilDate, 1);
  }
  
  return civilDate;
};

/**
 * Check if the current time is after shkia (sunset).
 * Useful for determining if we've transitioned to the next Jewish day.
 */
export const isAfterShkia = (shkiaTime?: string | Date | null): boolean => {
  if (!shkiaTime) return false;
  
  const now = new Date();
  let shkia: Date;
  
  if (typeof shkiaTime === 'string') {
    shkia = new Date(shkiaTime);
  } else {
    shkia = shkiaTime;
  }
  
  return !isNaN(shkia.getTime()) && now > shkia;
};