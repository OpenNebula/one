// Client-side time formatting utility

(function() {
  'use strict';

  const config = window.SUNSTONE_TIME_CONFIG || {
    timeSource: 'browser',
    currentTimeZone: 'UTC',
    timeFormat: '24h'
  };

  /**
   * Format a date according to the configured time behavior.
   * @param {Date|string|number} date - The date to format.
   * @param {Object} [options] - Override options (locale, etc.)
   * @returns {string} Formatted date string.
   */
  function formatSunstoneDate(date, options = {}) {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      console.error('Invalid date:', date);
      return '';
    }

    // Determine timezone and format
    let timeZone;
    let hour12;

    if (config.timeSource === 'os') {
      timeZone = config.currentTimeZone;
      hour12 = config.timeFormat === '12h';
    } else {
      // Use browser's default timezone and locale format
      const locale = options.locale || navigator.language || 'en-US';
      const formatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: undefined // Let Intl decide based on locale
      };
      return d.toLocaleString(locale, formatOptions);
    }

    // For OS source, use Intl.DateTimeFormat with fixed timezone and hour12
    const locale = options.locale || 'en-US';
    return d.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZone: timeZone,
      hour12: hour12
    });
  }

  // Expose globally
  window.formatSunstoneDate = formatSunstoneDate;

  // Override any existing date formatting functions used in Sunstone
  // Example: if Sunstone uses a global function like 'formatDate', replace it
  if (typeof window.formatDate !== 'undefined') {
    console.log('Sunstone time: Replacing existing formatDate with timezone-aware version');
    window.formatDate = formatSunstoneDate;
  }
})();
