let timeConfig = {
    timeMode: 'browser',
    timezone: null,
    timeFormat: '24h'
};

export async function initTimeConfig() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        timeConfig.timeMode = data.time_mode;
        timeConfig.timezone = data.timezone;
        timeConfig.timeFormat = data.time_format;
    } catch (e) {
        console.error('Failed to load time configuration', e);
    }
}

// Formats a date (string or Date) according to configuration
export function formatTimestamp(dateInput, options = {}) {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    let tz = timeConfig.timezone;
    let format = options.timeFormat || timeConfig.timeFormat;
    
    // If browser mode or no server timezone, use browser locale
    if (timeConfig.timeMode !== 'os' || !tz) {
        return date.toLocaleString(undefined, {
            hour12: format === '12h',
            hour: '2-digit',
            minute: '2-digit',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } else {
        // Use specified timezone from server
        return date.toLocaleString('en-US', {
            timeZone: tz,
            hour12: format === '12h',
            hour: '2-digit',
            minute: '2-digit',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
