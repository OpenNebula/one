define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var Locale = require('utils/locale');
  var DatastoresTable = require('tabs/datastores-tab/datatable');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./datastores/panelId');
  var DATASTORES_TABLE_ID = PANEL_ID + "DatastoresTable";
  var RESOURCE = "Cluster";
  var XML_ROOT = "CLUSTER";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Datastores");
    this.icon = "fa-folder-open";

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
    var datastores = [];

    if (this.element.DATASTORES.ID != undefined){
      datastores = this.element.DATASTORES.ID;

      if (!$.isArray(datastores)){
        datastores = [datastores];
      }
    }

    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: datastores
      }
    };

    this.DatastoresTable = new DatastoresTable(DATASTORES_TABLE_ID, opts);

    return this.DatastoresTable.dataTableHTML;
  }

  function _setup(context) {
    this.DatastoresTable.initialize();
    this.DatastoresTable.refreshResourceTableSelect();

    return false;
  }
});
