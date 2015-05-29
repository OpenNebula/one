define(function(require) {
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var Utils = require('../utils/common');
  var ResourcesTab = require('../utils/resources-tab');

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

    this.resourcesTab = new ResourcesTab("vdc_info_panel");

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
    return this.resourcesTab.html();
  }

  function _setup(context) {
    var that = this;

    var indexed_resources = Utils.indexedVdcResources(this.element);

    $.each(indexed_resources, function(zone_id,objects){
      that.resourcesTab.addResourcesZone(
        zone_id,
        Sunstone.getDataTable(ZONE_TAB_ID).getName(zone_id),
        context,
        indexed_resources);
    });

    that.resourcesTab.setup(context);
    that.resourcesTab.onShow(context);
  }
});
