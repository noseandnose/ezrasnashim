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