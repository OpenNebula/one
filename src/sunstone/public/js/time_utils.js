// Time utility functions
(function() {
  var config = window.SunstoneConfig || {};
  var useServerTime = (config.timezone_mode === 'os');
  var serverTimezone = config.timezone || '';
  var dateFormat = config.date_format || '24h';

  function getCurrentTimezone() {
    if (useServerTime) {
      return serverTimezone;
    } else {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  }

  function getDateFormat() {
    if (useServerTime) {
      return dateFormat === '24h' ? 'HH:mm' : 'hh:mm A';
    } else {
      // respect browser locale
      return undefined; // let moment handle
    }
  }

  // Override or expose functions used across Sunstone
  window.SunstoneTime = {
    getCurrentTimezone: getCurrentTimezone,
    getDateFormat: getDateFormat,
    formatTimestamp: function(timestamp) {
      // Example using moment.js (assumed available)
      var tz = getCurrentTimezone();
      var fmt = getDateFormat();
      var m = moment(timestamp).tz(tz);
      if (fmt) {
        return m.format(fmt);
      } else {
        return m.format('YYYY-MM-DD HH:mm:ss');
      }
    }
  };
})();