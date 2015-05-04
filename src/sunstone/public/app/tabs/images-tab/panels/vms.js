define(function(require){
  /*
    DEPENDENCIES
   */
  
  var Locale = require('utils/locale');
  //var VmsTable = require('tabs/vms-tab/datatable');
  
  /*
    CONSTANTS
   */
  
  //TODO var VMS_TAB_ID = require('tabs/vms-tab/tabId');
  var PANEL_ID = require('./vms/panelId');
  //var VMS_TABLE_ID = PANEL_ID + "VmsTable"
  var RESOURCE = "Image"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Vms");
    this.icon = "fa-cloud";

    this.element = info[RESOURCE.toUpperCase()];
    //this.vmsDataTable = new VmsTable(VMS_TABLE_ID, {info: true}, VMS_TAB_ID);

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
    //return this.vmsDataTable.dataTableHTML;
  }

  function _setup(context) {
    //this.vmsDataTable.initialize();
    //this.vmsDataTable.filter(this.element.NAME, VmsTable.COLUMN_IDS.DATASTORE);
    //this.vmsDataTable.list();

    return false;
  }
})