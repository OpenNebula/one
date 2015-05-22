define(function(require) {
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Showback = require('utils/showback');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./showback/panelId');
  var RESOURCE = "User";
  var XML_ROOT = "USER";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Showback");
    this.icon = "fa-money";

    this.element = info[XML_ROOT];

    if (!Config.isFeatureEnabled("showback")) {
      throw "Showback is disabled in the configuration";
    }

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
    return Showback.html();
  }

  function _setup(context) {
    Showback.setup(
      context,
      { fixed_user: this.element.ID,
        fixed_group: ""
      }
    );
  }
});
