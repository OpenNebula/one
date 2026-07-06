// Utility functions for date formatting
// Uses global SUNSTONE_TIMEZONE if available

var SunstoneDate = {
  timezone: null,
  dateFormat: 'browser',

  init: function() {
    if (typeof SUNSTONE_TIMEZONE !== 'undefined') {
      this.timezone = SUNSTONE_TIMEZONE.timezone;
      this.dateFormat = SUNSTONE_TIMEZONE.dateFormat;
    }
  },

  format: function(date, format) {
    if (!date) return '';
    if (typeof date === 'string' || typeof date === 'number') {
      date = new Date(date);
    }
    if (isNaN(date.getTime())) return '';

    var tz = this.timezone;
    var df = this.dateFormat;
    var options = {};

    if (tz && tz !== 'browser' && tz !== 'os') {
      options.timeZone = tz;
    } else if (tz === 'os') {
      // Use server's OS timezone; in client, we cannot get server timezone directly,
      // but we can infer it from the timezone config value if it's a valid zone.
      // Here we assume the server provided the actual timezone string it detected.
      // For simplicity, we keep the current behavior.
      // To fully implement, server should detect its timezone and pass that string.
      options.timeZone = 'UTC'; // placeholder; ideally from server
    }

    // Format using Intl.DateTimeFormat for consistency
    try {
      var formatter = new Intl.DateTimeFormat('en-US', options);
      return formatter.format(date);
    } catch (e) {
      // Fallback to default formatting
      return date.toString();
    }
  },

  formatTime: function(date) {
    var tz = this.timezone;
    var df = this.dateFormat;
    var options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    if (df === '24h') {
      options.hour12 = false;
    } else if (df === '12h') {
      options.hour12 = true;
    }
    if (tz && tz !== 'browser' && tz !== 'os') {
      options.timeZone = tz;
    }
    try {
      var formatter = new Intl.DateTimeFormat('en-US', options);
      return formatter.format(date);
    } catch (e) {
      return date.toLocaleTimeString();
    }
  }
};

SunstoneDate.init();
