define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var Locale = require('utils/locale');
  var SecurityGroupsTable = require('tabs/secgroups-tab/datatable');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./secgroups/panelId');
  var SG_TABLE_ID = PANEL_ID + "SecurityGroupsTable";
  var RESOURCE = "Network";
  var XML_ROOT = "VNET";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Security");
    this.icon = "fa-shield";

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
    var secgroups = [];

    if (this.element.TEMPLATE.SECURITY_GROUPS != undefined &&
        this.element.TEMPLATE.SECURITY_GROUPS.length != 0){

        secgroups = this.element.TEMPLATE.SECURITY_GROUPS.split(",");
    }

    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: secgroups
      }
    };

    this.secgroupTable = new SecurityGroupsTable(SG_TABLE_ID, opts);

    return this.secgroupTable.dataTableHTML;
  }

  function _setup(context) {
    this.secgroupTable.initialize();
    this.secgroupTable.refreshResourceTableSelect();

    return false;
  }
});
