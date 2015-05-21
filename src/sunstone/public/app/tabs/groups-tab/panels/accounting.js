define(function(require) {
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var Accounting = require('utils/accounting');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./accounting/panelId');
  var RESOURCE = "Group";
  var XML_ROOT = "GROUP";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Accounting");
    this.icon = "fa-bar-chart-o";

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
    return Accounting.html();
  }

  function _setup(context) {
    Accounting.setup(
      context,
      { fixed_group: this.element.ID,
        init_group_by: "user"
      });
  }
});
