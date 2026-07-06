// Sunstone time configuration
// Assumes a global variable `sunstoneSettings` fetched from /sunstone/config

(function() {
    'use strict';

    // Function to get the desired timezone
    function getTimezone() {
        if (typeof sunstoneSettings !== 'undefined' && sunstoneSettings.timezone_mode === 'os') {
            // Use server's timezone (passed from backend)
            if (sunstoneSettings.server_timezone) {
                return sunstoneSettings.server_timezone;
            }
        }
        // Default: use browser's timezone
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    // Override the time formatting function (example, adjust to actual codebase)
    // Assume there's a global formatTimestamp function
    if (typeof window.formatTimestamp === 'function') {
        var originalFormat = window.formatTimestamp;
        window.formatTimestamp = function(timestamp, options) {
            options = options || {};
            options.timeZone = getTimezone();
            return originalFormat.call(this, timestamp, options);
        };
    }

    // Also update date/time pickers if any
    // ...
})();

// Fetch settings on load
fetch('/sunstone/config')
    .then(response => response.json())
    .then(data => {
        window.sunstoneSettings = data;
        // Trigger re-render of timestamps if needed
        if (typeof refreshTimestamps === 'function') {
            refreshTimestamps();
        }
    })
    .catch(err => console.error('Failed to load sunstone time config:', err));