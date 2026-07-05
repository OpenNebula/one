let timezoneConfig = {
  useBrowser: true,
  dateFormat: '24h'
};

export function initTimezone(config) {
  if (config.timezone_config === 'os') {
    timezoneConfig.useBrowser = false;
    // Get server timezone from config (passed from fireedge)
    // In production, this would be set via the initial page load
    // For simplicity, assume config.serverTimezone is set
    timezoneConfig.serverTimezone = config.server_timezone || 'UTC';
  }
  if (config.date_format) {
    timezoneConfig.dateFormat = config.date_format;
  }
}

export function getTimezone() {
  if (timezoneConfig.useBrowser) {
    // Return browser timezone
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } else {
    return timezoneConfig.serverTimezone;
  }
}

export function getDateFormat() {
  return timezoneConfig.dateFormat;
}
