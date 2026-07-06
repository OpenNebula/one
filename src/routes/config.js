const express = require('express');
const router = express.Router();
const { getEffectiveTimezone, getEffectiveTimeFormat } = require('../utils/timezone');

router.get('/api/config/time', (req, res) => {
  res.json({
    timezone: getEffectiveTimezone(),
    timeFormat: getEffectiveTimeFormat()
  });
});

module.exports = router;
