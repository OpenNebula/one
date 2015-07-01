define(function(require) {
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var HostsTable = require('tabs/hosts-tab/datatable');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./hosts/panelId');
  var HOSTS_TABLE_ID = PANEL_ID + "HostsTable";
  var RESOURCE = "Cluster";
  var XML_ROOT = "CLUSTER";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Hosts");
    this.icon = "fa-hdd-o";

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
    var hosts = [];

    if (this.element.HOSTS.ID != undefined){
      hosts = this.element.HOSTS.ID;

      if (!$.isArray(hosts)){
        hosts = [hosts];
      }
    }

    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: hosts
      }
    };

    this.HostsTable = new HostsTable(HOSTS_TABLE_ID, opts);

    return this.HostsTable.dataTableHTML;
  }

  function _setup(context) {
    this.HostsTable.initialize();
    this.HostsTable.refreshResourceTableSelect();

    return false;
  }
});
