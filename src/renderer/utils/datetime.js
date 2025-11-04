/**
 * Datetime utilities for handling epoch milliseconds and local time formatting
 */

/**
 * Parse a value that might be epoch ms, Date object, or MySQL datetime string
 * @param {number|Date|string} value - The value to parse
 * @returns {Date} - Date object in local timezone
 */
export function parsePossiblyUTCStringToDate(value) {
  if (!value) return null;
  
  // If it's already a Date object
  if (value instanceof Date) {
    return value;
  }
  
  // If it's a number (epoch milliseconds)
  if (typeof value === 'number') {
    return new Date(value);
  }
  
  // If it's a string, parse it
  if (typeof value === 'string') {
    // MySQL datetime format: "YYYY-MM-DD HH:mm:ss"
    // Assume UTC and convert
    if (value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
      return new Date(value + 'Z'); // Add Z to treat as UTC
    }
    
    // ISO format or other string formats
    return new Date(value);
  }
  
  return null;
}

/**
 * Format a datetime value to local timezone string
 * @param {number|Date|string} value - The value to format
 * @param {string} format - Format type: 'full' (default), 'date', 'time'
 * @returns {string} - Formatted datetime string
 */
export function formatLocal(value, format = 'full') {
  const date = parsePossiblyUTCStringToDate(value);
  if (!date || isNaN(date.getTime())) return '-';
  
  const options = {
    full: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
    date: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    time: {
      hour: '2-digit',
      minute: '2-digit'
    }
  };
  
  return date.toLocaleString(undefined, options[format] || options.full);
}

/**
 * Convert epoch ms or Date to datetime-local input value
 * @param {number|Date|string} value - The value to convert
 * @returns {string} - String in format "YYYY-MM-DDTHH:mm"
 */
export function toLocalDateTimeInputValue(value) {
  const date = parsePossiblyUTCStringToDate(value);
  if (!date || isNaN(date.getTime())) return '';
  
  // Get local datetime components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert datetime-local input value to epoch milliseconds
 * @param {string} localDateTimeString - String in format "YYYY-MM-DDTHH:mm"
 * @returns {number} - Epoch milliseconds
 */
export function localDateTimeInputToEpoch(localDateTimeString) {
  if (!localDateTimeString) return null;
  
  const date = new Date(localDateTimeString);
  return date.getTime();
}
