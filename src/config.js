const fs = require('fs');
const path = require('path');

let configCache = null;

function parseSunstoneConfig() {
  const confPath = process.env.SUNSTONE_CONFIG || '/etc/one/fireedge/sunstone/sunstone-server.conf';
  const content = fs.readFileSync(confPath, 'utf8');
  const lines = content.split('\n');
  const config = {
    currentTimeZone: 'OS',
    timeFormat: '24h'
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed === '') continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length > 0) {
      const value = rest.join('=').trim();
      if (key === 'currentTimeZone') {
        config.currentTimeZone = value;
      } else if (key === 'timeFormat') {
        config.timeFormat = value;
      }
    }
  }
  return config;
}

function getConfig() {
  if (!configCache) {
    configCache = parseSunstoneConfig();
  }
  return configCache;
}

module.exports = { getConfig };
