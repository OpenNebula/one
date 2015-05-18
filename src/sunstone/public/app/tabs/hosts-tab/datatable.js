define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var CPUBars = require('./utils/cpu-bars');
  var MemoryBars = require('./utils/memory-bars');
  var OpenNebulaHost = require('opennebula/host')
  
  /*
    CONSTANTS
   */
  
  var RESOURCE = "Host"
  var TAB_NAME = require('./tabId');

  /*
    CONSTRUCTOR
   */
  
  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;

    this.dataTableOptions = {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check", 5, 6, 7, 8]},
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']}
      ]
    }

    this.columns = [
      Locale.tr("ID") ,
      Locale.tr("Name") ,
      Locale.tr("Cluster"),
      Locale.tr("RVMs"),
      Locale.tr("Real CPU"),
      Locale.tr("Allocated CPU"),
      Locale.tr("Real MEM"),
      Locale.tr("Allocated MEM"),
      Locale.tr("Status"),
      Locale.tr("IM MAD"),
      Locale.tr("VM MAD"),
      Locale.tr("Last monitored on")
    ]

    TabDataTable.call(this);
  };

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    var element = element_json.HOST;

    var cpuBars = CPUBars.html(element);
    var memoryBars = MemoryBars.html(element);

    // TODO Calculate table footer TOTAL ON OFF ERROR
    // TODO Update dashboard 

    return [
        '<input class="check_item" type="checkbox" id="' + RESOURCE.toLowerCase() + '_' +
                             element.ID + '" name="selected_items" value="' +
                             element.ID + '"/>',
        element.ID,
        element.NAME,
        element.CLUSTER.length ? element.CLUSTER : "-",
        element.HOST_SHARE.RUNNING_VMS, //rvm
        cpuBars.real,
        cpuBars.allocated,
        memoryBars.real,
        memoryBars.allocated,
        OpenNebulaHost.simpleStateStr(element.STATE),
        element.IM_MAD,
        element.VM_MAD,
        Humanize.prettyTime(element.LAST_MON_TIME)
    ];
  }
});
