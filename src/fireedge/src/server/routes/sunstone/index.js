// ... existing imports and setup ...
const { getTimeConfig } = require('./time-config');

// Add route for time config
router.get('/time-config', getTimeConfig);

// ... rest of routes ...
