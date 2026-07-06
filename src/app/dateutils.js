const moment = require('moment-timezone');
const timezone = require('./timezone');

function formatTimestamp(timestamp, format) {
  const tz = timezone.getEffectiveTimezone();
  const df = format || timezone.getDateFormat() || '24h';
  
  const m = moment(timestamp);
  if (tz) {
    m.tz(tz);
  }
  
  if (df === '12h') {
    return m.format('YYYY-MM-DD hh:mm:ss A');
  } else {
    return m.format('YYYY-MM-DD HH:mm:ss');
  }
}

module.exports = {
  formatTimestamp
};
