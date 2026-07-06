// main.js - Modified to apply server timezone configuration
// This file is loaded on startup

(function() {
    'use strict';

    // Assume the server injects timezone and timeformat into a global variable or HTML
    // For example, we might have a script tag that sets window.__serverTimezone and __timeFormat
    var serverTimezone = window.__serverTimezone || null;
    var timeFormat = window.__timeFormat || null;

    // Initialize SunstoneTimezone utility
    if (typeof SunstoneTimezone !== 'undefined') {
        SunstoneTimezone.init(serverTimezone, timeFormat);
    }

    // Override default moment locale to use the timezone if needed
    if (serverTimezone && serverTimezone !== 'browser') {
        moment.tz.setDefault(serverTimezone);
    }

    // Additional initialization code...
})();
