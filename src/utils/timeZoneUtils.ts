import { format, parse, formatISO } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

// Define time zones
export const TIME_ZONES = {
  MMT: 'Asia/Yangon', // Myanmar Time (UTC+6:30)
  ICT: 'Asia/Bangkok', // Thailand Time (UTC+7)
  UTC: 'UTC'
};

// Convert time string to a specific time zone
export const convertTimeToTimeZone = (
  timeString: string, 
  fromTimeZone: string = TIME_ZONES.MMT, 
  toTimeZone: string = TIME_ZONES.MMT
): string => {
  if (!timeString) return timeString;
  
  // Parse time string (assumed to be in 24h format like "14:30")
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const dateTime = parse(`${todayStr} ${timeString}`, 'yyyy-MM-dd HH:mm', new Date());
  
  // Create date in the source time zone
  const sourceDate = zonedTimeToUtc(dateTime, fromTimeZone);
  
  // Convert to target time zone
  const targetDate = utcToZonedTime(sourceDate, toTimeZone);
  
  // Return formatted time string
  return format(targetDate, 'HH:mm');
};

// Convert a full date string to a specific time zone
export const convertDateToTimeZone = (
  dateString: string,
  fromTimeZone: string = TIME_ZONES.MMT,
  toTimeZone: string = TIME_ZONES.MMT
): string => {
  if (!dateString) return dateString;
  
  const date = new Date(dateString);
  const sourceDate = zonedTimeToUtc(date, fromTimeZone);
  const targetDate = utcToZonedTime(sourceDate, toTimeZone);
  
  return formatISO(targetDate);
};

// Format a date for display in a specific time zone
export const formatDateInTimeZone = (
  date: Date | string,
  formatStr: string,
  timeZone: string = TIME_ZONES.MMT
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const zonedDate = utcToZonedTime(dateObj, timeZone);
  
  return format(zonedDate, formatStr);
};

// Get current time in a specific time zone
export const getCurrentTimeInTimeZone = (
  timeZone: string = TIME_ZONES.MMT
): Date => {
  const now = new Date();
  return utcToZonedTime(now, timeZone);
};

// Check if store is currently open based on working hours and time zone
export const isStoreOpen = (workingHours: any[], timeZone: string = TIME_ZONES.MMT): boolean => {
  if (!workingHours || workingHours.length === 0) return false;
  
  // Get current date/time in the specified time zone
  const now = getCurrentTimeInTimeZone(timeZone);
  const currentDay = now.getDay();
  const currentTime = format(now, 'HH:mm');
  
  // Find today's hours
  const todayHours = workingHours.find((h: any) => h.day_of_week === currentDay);
  
  if (!todayHours || todayHours.is_closed) {
    return false;
  }
  
  const opensAt = todayHours.opens_at;
  const closesAt = todayHours.closes_at;

  // Validate time strings
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!opensAt || !closesAt || !timeRegex.test(opensAt) || !timeRegex.test(closesAt)) {
    console.error('Invalid time format:', { opensAt, closesAt });
    return false;
  }

  // Check if closing time is on the next day (e.g., night shift: 17:30 to 07:30)
  const isOvernight = closesAt <= opensAt;

  if (isOvernight) {
    // Night shift: Store is open from opensAt today to closesAt tomorrow
    if (currentTime >= opensAt) {
      return true; // Open from opensAt today until midnight
    }

    // Check if open from midnight to closesAt (i.e., previous day's schedule)
    const previousDay = (currentDay - 1 + 7) % 7;
    const previousDayHours = workingHours.find((h: any) => h.day_of_week === previousDay);
    if (!previousDayHours || previousDayHours.is_closed) {
      return false;
    }

    if (
      currentTime <= previousDayHours.closes_at &&
      previousDayHours.closes_at <= previousDayHours.opens_at &&
      timeRegex.test(previousDayHours.closes_at)
    ) {
      return true; // Open from midnight to closesAt
    }

    return false;
  } else {
    // Normal store: Open and close on the same day (e.g., 01:00 to 23:00)
    return currentTime >= opensAt && currentTime <= closesAt;
  }
};

// Format time for display
export const formatTime = (time: any): string => {
  if (!time) return '';
  
  // Ensure time is a string
  if (typeof time !== 'string') {
    console.error('Error formatting time: Expected string but got', typeof time);
    return '';
  }
  
  // Extract HH:mm part if the time includes seconds (HH:mm:ss)
  let timeStr = time;
  if (time.length > 5 && time.includes(':')) {
    timeStr = time.substring(0, 5);
  }
  
  // Validate time format using regex (HH:mm)
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(timeStr)) {
    console.error('Error formatting time: Invalid time format', time);
    return time; // Return original value for debugging
  }
  
  try {
    const date = parse(timeStr, 'HH:mm', new Date());
    return format(date, 'h:mm a'); // e.g., "2:30 PM"
  } catch (error) {
    console.error('Error formatting time:', error, 'Time value:', time);
    return time;
  }
};