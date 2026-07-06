const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const CONFIG_PATH = '/etc/one/fireedge/sunstone/sunstone-server.conf';

let timezoneConfig = null;

function loadConfig() {
  try {
    const doc = yaml.safeLoad(fs.readFileSync(CONFIG_PATH, 'utf8'));
    timezoneConfig = {
      timezone: doc.timezone || 'browser',
      dateFormat: doc.date_format || '24h'
    };
  } catch (e) {
    console.warn('Failed to load sunstone-server.conf, using defaults:', e.message);
    timezoneConfig = {
      timezone: 'browser',
      dateFormat: '24h'
    };
  }
}

// Initialize on module load
loadConfig();

/**
 * Returns the effective timezone based on configuration.
 * If 'browser', return null (client will decide).
 * If 'server', return the OS timezone (from Intl or process.env.TZ).
 * Otherwise, return the configured string.
 */
function getEffectiveTimezone() {
  if (!timezoneConfig) loadConfig();
  const cfg = timezoneConfig.timezone;
  if (cfg === 'browser') {
    return null;
  } else if (cfg === 'server') {
    // Use server's timezone (fallback to UTC)
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      return 'UTC';
    }
  } else {
    // Assume it's a valid timezone string
    return cfg;
  }
}

function getDateFormat() {
  if (!timezoneConfig) loadConfig();
  return timezoneConfig.dateFormat;
}

module.exports = {
  getEffectiveTimezone,
  getDateFormat
};
