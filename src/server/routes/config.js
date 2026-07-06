const express = require('express');
const router = express.Router();
const { getConfig } = require('../config');

// Endpoint to provide time configuration to frontend
router.get('/api/time-config', (req, res) => {
  const config = getConfig();
  res.json({
    source: config.timeConfigSource,
    timezone: config.currentTimeZone,
    dateFormat: config.dateFormat
  });
});

module.exports = router;
