define(function(require) {
  /*
    DEPENDENCIES
   */

  var TemplateHTML = require('hbs!./resources/html');
  var Locale = require('utils/locale');
  var Utils = require('../utils/common');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./resources/panelId');
  var RESOURCE = "Vdc";
  var XML_ROOT = "VDC";

  var ZONE_TAB_ID = require('tabs/zones-tab/tabId');
  var Sunstone = require('sunstone');

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Resources");
    this.icon = "fa-th";

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
    return TemplateHTML();
  }

  function _setup(context) {
    var indexed_resources = Utils.indexedVdcResources(this.element);

    $.each(indexed_resources, function(zone_id,objects){
        Utils.addVdcResourceTab(
            "vdc_info_panel",
            zone_id,
            Sunstone.getDataTable(ZONE_TAB_ID).getName(zone_id),
            context,
            indexed_resources);
    });

    Utils.setupVdcResourceTab("vdc_info_panel", context);
  }
});
