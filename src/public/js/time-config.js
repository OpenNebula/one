// Fetch time configuration from server and apply
(async function() {
  try {
    const response = await fetch('/api/time-config');
    if (!response.ok) throw new Error('Failed to fetch time config');
    const config = await response.json();

    // Store globally for other scripts to use
    window.__timeConfig = config;

    // If source is 'os', apply server timezone and format
    if (config.source === 'os' && config.timezone) {
      // Intl.DateTimeFormat uses timezone from options
      // Override default formatters globally
      // This simple approach changes how dates are displayed in all places
      const originalToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = function( locales, options) {
        const opts = options || {};
        opts.timeZone = opts.timeZone || config.timezone;
        if (config.dateFormat === '12h') {
          opts.hour12 = true;
        } else {
          opts.hour12 = false;
        }
        return originalToLocaleString.call(this, locales, opts);
      };

      // Also override toLocaleTimeString and toLocaleDateString similarly
      const originalToLocaleTimeString = Date.prototype.toLocaleTimeString;
      Date.prototype.toLocaleTimeString = function( locales, options) {
        const opts = options || {};
        opts.timeZone = opts.timeZone || config.timezone;
        if (config.dateFormat === '12h') {
          opts.hour12 = true;
        } else {
          opts.hour12 = false;
        }
        return originalToLocaleTimeString.call(this, locales, opts);
      };

      const originalToLocaleDateString = Date.prototype.toLocaleDateString;
      Date.prototype.toLocaleDateString = function( locales, options) {
        const opts = options || {};
        opts.timeZone = opts.timeZone || config.timezone;
        return originalToLocaleDateString.call(this, locales, opts);
      };

      console.log('Time configuration applied from OS env');
    } else {
      console.log('Using browser time configuration');
    }
  } catch (err) {
    console.warn('Failed to load time config, using browser defaults:', err.message);
  }
})();
