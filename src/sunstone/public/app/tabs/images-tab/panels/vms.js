define(function(require){
  /*
    DEPENDENCIES
   */
  
  var Locale = require('utils/locale');
  var VMsTable = require('tabs/vms-tab/datatable');
  
  /*
    CONSTANTS
   */

  var PANEL_ID = require('./vms/panelId');
  var VMS_TABLE_ID = PANEL_ID + "VMsTable";
  var RESOURCE = "Image";
  var XML_ROOT = "IMAGE";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("VMs");
    this.icon = "fa-cloud";

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
    var vms = [];

    if (this.element.VMS.ID != undefined){
      vms = this.element.VMS.ID;

      if (!$.isArray(vms)){
        vms = [vms];
      }
    }

    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: vms
      }
    };

    this.vmsTable = new VMsTable(VMS_TABLE_ID, opts);

    return this.vmsTable.dataTableHTML;
  }

  function _setup(context) {
    this.vmsTable.initialize();
    this.vmsTable.refreshResourceTableSelect();

    return false;
  }
})