const fs = require('fs');
const path = require('path');
const { parse } = require('ini');

const SUNSTONE_CONFIG_PATH = '/etc/one/fireedge/sunstone/sunstone-server.conf';

function loadTimezoneConfig() {
    let config = {};
    try {
        const content = fs.readFileSync(SUNSTONE_CONFIG_PATH, 'utf-8');
        config = parse(content);
    } catch (err) {
        console.warn(`Could not read sunstone config: ${err.message}. Using defaults.`);
    }
    const timezone = config.currentTimeZone || 'os';
    return timezone;
}

function applyTimezone(timezone) {
    if (timezone === 'browser') {
        // Do nothing, keep browser timezone behavior
        console.log('Timezone: using browser environment (no server override).');
    } else if (timezone === 'os') {
        // Use the system's timezone (default behavior of Node.js)
        console.log('Timezone: using OS environment.');
        // Ensure TZ is unset to let system default apply
        delete process.env.TZ;
    } else {
        // Set a specific timezone (e.g., 'UTC', 'America/New_York')
        process.env.TZ = timezone;
        console.log(`Timezone: set to ${timezone}.`);
    }
}

function initializeTimezone() {
    const tz = loadTimezoneConfig();
    applyTimezone(tz);
}

module.exports = { initializeTimezone, loadTimezoneConfig, applyTimezone };
