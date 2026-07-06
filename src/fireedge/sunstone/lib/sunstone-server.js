// sunstone-server.js - Modified to read timezone config and inject into frontend

const fs = require('fs');
const path = require('path');

// Existing code...

// In the server setup, we need to read the sunstone-server.conf
const confPath = '/etc/one/fireedge/sunstone/sunstone-server.conf';
let config = {};
try {
    const data = fs.readFileSync(confPath, 'utf8');
    // Parse simple key=value (assuming)
    const lines = data.split('\n');
    lines.forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            config[key] = value;
        }
    });
} catch (err) {
    console.warn('Could not read sunstone-server.conf, using defaults');
}

// Extract timezone settings
const currentTimeZone = config.currentTimeZone || 'browser'; // default to browser
const timeFormat = config.timeFormat || '24h'; // or '12h'

// Make these available to routes
app.use((req, res, next) => {
    res.locals.currentTimeZone = currentTimeZone;
    res.locals.timeFormat = timeFormat;
    next();
});

// In the main HTML template (e.g., index.html), inject these values
app.get('/', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
    const injectedHtml = html.replace(
        '</head>',
        `<script>window.__serverTimezone = '${res.locals.currentTimeZone}'; window.__timeFormat = '${res.locals.timeFormat}';</script></head>`
    );
    res.send(injectedHtml);
});

// Rest of the server code...
