// Sunstone JavaScript - Timezone handling
(function() {
  'use strict';

  var timezone = SUNSTONE_TIMEZONE || null;

  function formatDate(date, format) {
    var options = {};
    if (timezone && timezone !== '') {
      options.timeZone = timezone;
    }
    // Date formatting logic here, use options.timeZone if set
    // Example for 24h or 12h based on configuration
    if (window.SUNSTONE_TIME_FORMAT === '12h') {
      options.hour12 = true;
    } else {
      options.hour12 = false;
    }
    return new Intl.DateTimeFormat('default', options).format(date);
  }

  // Override or extend existing date formatting functions
  window.SunstoneDateFormatter = {
    format: formatDate
  };
})();
