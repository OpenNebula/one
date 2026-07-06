const path = require('path');
const fs = require('fs');

let config = {};

function loadConfig() {
  const configPath = '/etc/one/fireedge/sunstone/sunstone-server.conf';
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    const lines = data.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valParts] = trimmed.split('=');
        if (key && valParts.length) {
          config[key.trim()] = valParts.join('=').trim();
        }
      }
    });
  } catch (err) {
    console.error('Failed to load sunstone config:', err.message);
  }
  // Set defaults
  config.timeConfigSource = config.timeConfigSource || 'browser'; // 'browser' or 'os'
  config.currentTimeZone = config.currentTimeZone || ''; // e.g., 'America/New_York'
  config.dateFormat = config.dateFormat || '24h'; // '24h' or '12h'
}

function getConfig() {
  return config;
}

// Reload config periodically or on signal? Simple: load once at startup
loadConfig();

module.exports = { getConfig, loadConfig };
