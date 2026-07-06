const fs = require('fs');
const path = require('path');

const CONFIG_PATH = '/etc/one/fireedge/sunstone/sunstone-server.conf';

let config = {
  timezone: 'browser',
  date_format: 'browser'
};

try {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  const lines = raw.split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) return;
    const [key, value] = trimmed.split('=').map(s => s.trim());
    if (key === 'currentTimeZone') {
      config.timezone = value || 'browser';
    } else if (key === 'dateFormat') {
      config.date_format = value || 'browser';
    }
  });
} catch (e) {
  console.warn('Could not read sunstone configuration, using defaults.');
}

module.exports = config;
