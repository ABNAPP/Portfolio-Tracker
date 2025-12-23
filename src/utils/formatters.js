/**
 * Format a value as currency
 * @param {number} val - Value to format
 * @param {string} curr - Currency code
 * @param {string} locale - Locale string
 * @returns {string} Formatted currency string
 */
export function formatCurrency(val, curr = 'SEK', locale = 'sv-SE') {
  let loc = locale;
  if (locale === 'sv') loc = 'sv-SE';
  if (locale === 'en') loc = 'en-US';
  
  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 2
    }).format(val);
  } catch (e) {
    return `${val.toFixed(2)} ${curr}`;
  }
}

/**
 * Format a number with thousand separators
 * @param {number} val - Value to format
 * @param {number} decimals - Number of decimal places
 * @param {string} locale - Locale string
 * @returns {string} Formatted number string
 */
export function formatNumber(val, decimals = 0, locale = 'sv-SE') {
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(val);
  } catch (e) {
    return val.toFixed(decimals);
  }
}

/**
 * Format a percentage
 * @param {number} val - Value to format (already in percentage, e.g., 5.25 for 5.25%)
 * @param {number} decimals - Number of decimal places
 * @param {boolean} showSign - Whether to show + sign for positive values
 * @returns {string} Formatted percentage string
 */
export function formatPercent(val, decimals = 2, showSign = false) {
  const sign = showSign && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(decimals)}%`;
}

/**
 * Format a date
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale string
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, locale = 'sv-SE', options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
  } catch (e) {
    return String(date);
  }
}

/**
 * Format a date for display in short form
 * @param {string|Date} date - Date to format
 * @returns {string} Short date string (YYYY-MM-DD)
 */
export function formatDateShort(date) {
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch (e) {
    return String(date);
  }
}

/**
 * Format time elapsed
 * @param {Date} date - Date to calculate from
 * @param {string} lang - Language code
 * @returns {string} Human readable time elapsed
 */
export function formatTimeAgo(date, lang = 'sv') {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  const texts = {
    sv: {
      now: 'just nu',
      mins: 'min sedan',
      hours: 'tim sedan',
      days: 'dagar sedan'
    },
    en: {
      now: 'just now',
      mins: 'min ago',
      hours: 'hours ago',
      days: 'days ago'
    }
  };
  
  const t = texts[lang] || texts.sv;
  
  if (diffMins < 1) return t.now;
  if (diffMins < 60) return `${diffMins} ${t.mins}`;
  if (diffHours < 24) return `${diffHours} ${t.hours}`;
  return `${diffDays} ${t.days}`;
}

/**
 * Mask a value for privacy mode
 * @param {any} val - Value to potentially mask
 * @param {boolean} masked - Whether to mask
 * @returns {string} Masked or original value
 */
export function maskValue(val, masked = false) {
  return masked ? '***' : val;
}

/**
 * Format large numbers compactly (e.g., 1.2M, 500K)
 * @param {number} val - Value to format
 * @param {string} locale - Locale string
 * @returns {string} Compact formatted number
 */
export function formatCompact(val, locale = 'sv-SE') {
  try {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(val);
  } catch (e) {
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return val.toFixed(0);
  }
}

/**
 * Convert snake_case or kebab-case to Title Case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
export function toTitleCase(str) {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}












