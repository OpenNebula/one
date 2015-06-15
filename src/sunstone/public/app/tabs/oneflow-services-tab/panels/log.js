define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');

  /*
    CONSTANTS
   */
  
  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./log/panelId');
  var XML_ROOT = "DOCUMENT";
  var RESOURCE = "Service";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Log");
    this.icon = "fa-file-text";

    this.element = info[XML_ROOT];

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var logs = this.element.TEMPLATE.BODY.log;
    var log_info = '';
    if (logs) {
      log_info += '<div class="row"><div class="large-12 columns log-tab">';

      for (var i = 0; i < logs.length; i++) {
        var line = Humanize.prettyTime(logs[i].timestamp)+' ['+logs[i].severity + '] ' + logs[i].message+ '<br>';

        if (logs[i].severity == 'E'){
          line = '<span class="vm_log_error">'+line+'</span>';
        }

        log_info += line;
      }

      log_info += '</div></div>';
    }

    return log_info;
  }

  function _setup(context) {
  }
});
