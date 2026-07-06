const { readFileSync } = require('fs');
const { join } = require('path');

const configPath = '/etc/one/fireedge/sunstone/sunstone-server.conf';

function parseConfig() {
  try {
    const content = readFileSync(configPath, 'utf-8');
    const lines = content.split('\n');
    const config = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex).trim();
          const value = trimmed.substring(eqIndex + 1).trim();
          config[key] = value;
        }
      }
    }
    return config;
  } catch (err) {
    console.error('Failed to read time config:', err);
    return {};
  }
}

function getTimeConfig(req, res) {
  const config = parseConfig();
  const currentTimeZone = config.currentTimeZone || 'browser';
  const dateFormat = config.dateFormat || '24h';
  
  let timezone, dateFormatVal;
  
  if (currentTimeZone === 'os') {
    // Use OS environment
    try {
      const execSync = require('child_process').execSync;
      const tz = execSync('timedatectl show --property=Timezone --value', { encoding: 'utf-8' }).trim();
      timezone = tz || 'UTC';
    } catch (e) {
      timezone = 'UTC';
    }
    // For date format, try to get from locale
    try {
      const locale = execSync('localectl status --no-pager', { encoding: 'utf-8' });
      if (locale.includes('LC_TIME=')) {
        const match = locale.match(/LC_TIME=([^\n]+)/);
        if (match && match[1].includes('UTF-8')) {
          dateFormatVal = '24h'; // C.UTF-8 implies 24h
        } else {
          dateFormatVal = '12h';
        }
      } else {
        dateFormatVal = '24h';
      }
    } catch (e) {
      dateFormatVal = '24h';
    }
  } else {
    // Use browser (client-side will determine)
    timezone = 'browser';
    dateFormatVal = dateFormat; // as configured
  }
  
  res.json({
    timezone: timezone,
    dateFormat: dateFormatVal
  });
}

module.exports = { getTimeConfig };
