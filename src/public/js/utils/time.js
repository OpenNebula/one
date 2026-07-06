let cachedConfig = null;

async function fetchTimeConfig() {
  if (!cachedConfig) {
    const response = await fetch('/api/config/time');
    cachedConfig = await response.json();
  }
  return cachedConfig;
}

function formatDate(date, config) {
  if (!config) {
    config = { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, timeFormat: '24h' };
  }
  const options = {
    timeZone: config.timezone,
    hour12: config.timeFormat === '12h' ? true : false,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

// Usage example:
// const date = new Date();
// const config = await fetchTimeConfig();
// console.log(formatDate(date, config));

export { fetchTimeConfig, formatDate };
