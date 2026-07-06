const express = require('express');
const router = express.Router();
const timezone = require('../app/timezone');

// Endpoint to provide timezone and date format to the client
router.get('/api/config/time', (req, res) => {
  res.json({
    timezone: timezone.getEffectiveTimezone(),
    dateFormat: timezone.getDateFormat()
  });
});

module.exports = router;
