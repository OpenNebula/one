const fs = require('fs');
const path = require('path');
const ini = require('ini');
const { execSync } = require('child_process');

let config = null;

function getTimezone() {
    // Try to get timezone from system
    try {
        const tz = execSync('timedatectl show --property=Timezone --value', { encoding: 'utf8' }).trim();
        if (tz) return tz;
    } catch (e) {
        // Fallback
    }
    // Use Intl as fallback
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getTimeFormat() {
    // Use LC_TIME to determine format: if 12h, return '12h', else '24h'
    try {
        const locale = execSync('localectl status --property=LC_TIME --value', { encoding: 'utf8' }).trim();
        if (locale.toLowerCase().includes('12')) return '12h';
    } catch (e) {
        // ignore
    }
    return '24h';
}

function loadConfig() {
    const configPath = process.env.SUNSTONE_CONFIG || '/etc/one/fireedge/sunstone/sunstone-server.conf';
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = ini.parse(raw);
    const sunstone = parsed.sunstone || {};
    
    const timeMode = (sunstone.time_mode || 'browser').toLowerCase();
    let timezone = null;
    let timeFormat = '24h';
    
    if (timeMode === 'os') {
        timezone = getTimezone();
        timeFormat = sunstone.time_format || getTimeFormat();
    }
    
    config = {
        timeMode,
        timezone,
        timeFormat
    };
}

function getConfig() {
    if (!config) loadConfig();
    return config;
}

module.exports = { getConfig };
