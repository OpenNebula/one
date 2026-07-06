const express = require('express');
const path = require('path');
const config = require('./config/sunstone-config');

const app = express();

// Inject timezone configuration into HTML responses
app.use((req, res, next) => {
  const originalRender = res.render;
  res.render = function(view, options, callback) {
    options = options || {};
    options.timezoneConfig = JSON.stringify({
      timezone: config.timezone,
      dateFormat: config.date_format
    });
    originalRender.call(this, view, options, callback);
  };
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Example route for main page
app.get('/', (req, res) => {
  res.render('index', { timezoneConfig: JSON.stringify({ timezone: config.timezone, dateFormat: config.date_format }) });
});

module.exports = app;
