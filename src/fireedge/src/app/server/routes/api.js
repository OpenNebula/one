const express = require('express');
const router = express.Router();
const config = require('./sunstone-config');

router.get('/config', (req, res) => {
    const conf = config.getConfig();
    res.json({
        time_mode: conf.timeMode,
        timezone: conf.timezone,
        time_format: conf.timeFormat
    });
});

module.exports = router;
