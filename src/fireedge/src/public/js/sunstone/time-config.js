// This script is loaded after the main Sunstone JS.
// It overrides time formatting functions to respect server-configured timezone and date format.

(function() {
  'use strict';

  // Fetch time config from server
  function initTimeConfig() {
    fetch('/time-config')
      .then(response => response.json())
      .then(config => {
        if (config.timezone !== 'browser') {
          // Override global timezone for moment.js or similar
          if (typeof moment !== 'undefined') {
            moment.tz.setDefault(config.timezone);
          }
        }
        // Set date format preference
        if (config.dateFormat === '24h') {
          // Force 24-hour format
          if (typeof moment !== 'undefined') {
            // Modify moment's locale to use 24h
            moment.updateLocale(moment.locale(), {
              longDateFormat: {
                LT: 'HH:mm',
                LTS: 'HH:mm:ss',
                L: 'YYYY-MM-DD',
                LL: 'D MMMM YYYY',
                LLL: 'D MMMM YYYY HH:mm',
                LLLL: 'dddd, D MMMM YYYY HH:mm'
              }
            });
          }
        } else {
          // 12-hour format (AM/PM)
          if (typeof moment !== 'undefined') {
            moment.updateLocale(moment.locale(), {
              longDateFormat: {
                LT: 'h:mm A',
                LTS: 'h:mm:ss A',
                L: 'MM/DD/YYYY',
                LL: 'MMMM D, YYYY',
                LLL: 'MMMM D, YYYY h:mm A',
                LLLL: 'dddd, MMMM D, YYYY h:mm A'
              }
            });
          }
        }
      })
      .catch(err => console.error('Failed to load time config:', err));
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTimeConfig);
  } else {
    initTimeConfig();
  }
})();
