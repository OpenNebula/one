// Sunstone client-side configuration
// Fetch server time settings and apply them

let sunstoneConfig = {
    timeConfigurationSource: 'os',
    timezone: '',
    dateFormat: '24h'
};

async function loadSunstoneConfig() {
    try {
        const response = await fetch('/api/sunstone/config');
        const data = await response.json();
        sunstoneConfig.timeConfigurationSource = data.time_configuration_source || 'os';
        sunstoneConfig.timezone = data.timezone || '';
        sunstoneConfig.dateFormat = data.date_format || '24h';
        applyTimeConfiguration();
    } catch (error) {
        console.error('Failed to load Sunstone time config:', error);
    }
}

function applyTimeConfiguration() {
    if (sunstoneConfig.timeConfigurationSource === 'os') {
        // Use server timezone (injected via config)
        moment.tz.setDefault(sunstoneConfig.timezone);
    } else if (sunstoneConfig.timeConfigurationSource === 'browser') {
        // Use browser timezone (default behavior)
        moment.tz.setDefault(moment.tz.guess());
    }

    // Apply date format
    if (sunstoneConfig.dateFormat === '12h') {
        moment.defaultFormat = 'YYYY-MM-DD h:mm:ss A';
    } else {
        moment.defaultFormat = 'YYYY-MM-DD H:mm:ss';
    }
}

document.addEventListener('DOMContentLoaded', loadSunstoneConfig);