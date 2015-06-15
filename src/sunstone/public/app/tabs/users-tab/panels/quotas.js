define(function(require) {
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var QuotaDefaults = require('utils/quotas/quota-defaults');
  var QuotaWidgets = require('utils/quotas/quota-widgets');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./quotas/panelId');
  var RESOURCE = "User";
  var XML_ROOT = "USER";

  /*
    CONSTRUCTOR
   */

  function Panel(info, tabId) {
    this.tabId = tabId || TAB_ID;
    this.title = Locale.tr("Quotas");
    this.icon = "fa-align-left";

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
    return QuotaWidgets.initQuotasPanel(
      this.element,
      QuotaDefaults.getDefaultQuotas(RESOURCE),
      Config.isTabActionEnabled(this.tabId, RESOURCE+".quotas_dialog"));
  }

  function _setup(context) {
    QuotaWidgets.setupQuotasPanel(
      this.element,
      context,
      Config.isTabActionEnabled(this.tabId, RESOURCE+".quotas_dialog"),
      RESOURCE);

    return false;
  }
});
