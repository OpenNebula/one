define(function(require) {
  /*
    Generate the HTML representing the capacity of the Datastore
   */

  var ProgressBar = require('utils/progress-bar');
  var Humanize = require('utils/humanize')

  /*
    @param {Object} info Object representing the Datastore as returned by OpenNebula
   */
  var _html = function(info) {
    var total = parseInt(info.TOTAL_MB);
    var used = total - parseInt(info.FREE_MB);

    if (total > 0) {
      var ratio = Math.round((used / total) * 100);
      info_str = Humanize.sizeFromMB(used) + ' / ' + Humanize.sizeFromMB(total) + ' (' + ratio + '%)';
    } else {
      if (info.TYPE == 1) {
        info_str = '- / -';
      } else {
        info_str = Humanize.size(used) + ' / -';
      }
    }

    return ProgressBar.html(used, total, info_str);
  }

  return {
    'html': _html
  }
})
