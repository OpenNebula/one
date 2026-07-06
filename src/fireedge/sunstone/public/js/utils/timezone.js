// timezone.js - Utility to handle timezone from server configuration
// If server provides a timezone, use it; otherwise fallback to browser

(function() {
    'use strict';

    var SunstoneTimezone = {
        // The timezone set by the server (e.g., 'America/New_York', 'UTC')
        serverTimezone: null,
        // The format (12h or 24h) from server
        timeFormat: null,
        // Flag to indicate if we should use server settings
        useServerSettings: false,

        init: function(serverTimezone, timeFormat) {
            if (serverTimezone && serverTimezone !== 'browser') {
                this.serverTimezone = serverTimezone;
                this.timeFormat = timeFormat || '24h';
                this.useServerSettings = true;
            } else {
                this.useServerSettings = false;
            }
        },

        // Get the effective timezone
        getTimezone: function() {
            if (this.useServerSettings) {
                return this.serverTimezone;
            }
            return moment.tz.guess(); // browser's timezone
        },

        // Format a date/time using the effective settings
        formatDateTime: function(date, format) {
            var m = moment(date);
            if (!format) {
                format = this.useServerSettings && this.timeFormat === '24h' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD hh:mm:ss A';
            }
            if (this.useServerSettings) {
                return m.tz(this.serverTimezone).format(format);
            }
            return m.format(format);
        }
    };

    // Export to global scope
    window.SunstoneTimezone = SunstoneTimezone;
})();
