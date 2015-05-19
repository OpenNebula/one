define(function(require){
  /*
    DEPENDENCIES
   */
  
  var Locale = require('utils/locale');
  // TODO var VMsTable = require('tabs/vms-tab/datatable');
  
  /*
    CONSTANTS
   */

  var PANEL_ID = require('./vms/panelId');
  var IMAGES_TABLE_ID = PANEL_ID + "VMsTable";
  var RESOURCE = "Host";
  var XML_ROOT = "HOST";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("VMs");
    this.icon = "fa-cloud";

    this.element = info[XML_ROOT];
    // TODO this.vmsDataTable = new VMsTable(IMAGES_TABLE_ID, {info: true});

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return ''// TODO this.vmsDataTable.dataTableHTML;
  }

  function _setup(context) {
    // TODO this.vmsDataTable.initialize();
    // TODO this.vmsDataTable.filter(this.element.NAME, VMsTable.COLUMN_IDS.DATASTORE);
    // TODO this.vmsDataTable.list();

    return false;
  }
})