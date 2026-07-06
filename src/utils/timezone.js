const { getConfig } = require('../config');

function getEffectiveTimezone() {
  const config = getConfig();
  const tzConfig = config.currentTimeZone;
  if (!tzConfig || tzConfig === 'OS') {
    // Use server's timezone from environment or OS
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  // Use explicitly specified timezone
  return tzConfig;
}

function getEffectiveTimeFormat() {
  const config = getConfig();
  const format = config.timeFormat;
  if (format === '12h' || format === 'am-pm' || format === '12') {
    return '12h';
  }
  return '24h';
}

module.exports = { getEffectiveTimezone, getEffectiveTimeFormat };
