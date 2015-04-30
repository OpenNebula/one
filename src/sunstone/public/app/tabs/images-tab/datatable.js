define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var Notifier = require('utils/notifier');
  var OpenNebulaImage = require('opennebula/image');

  /*
    CONSTANTS
   */
  
  var RESOURCE = "Image"
  var TAB_NAME = require('./tabId');
  var COLUMN_IDS = {
    "DATASTORE": 5
  }
  /*
    CONSTRUCTOR
   */
  
  function Table(dataTableId, conf, tabId) {
    this.conf = conf || {};
    this.tabId = tabId;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;

    this.dataTableOptions = {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check"]},
          {"sWidth": "35px", "aTargets": [0]},
          {"sWidth": "250px", "aTargets": [5]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']}
      ]
    }

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Owner"),
      Locale.tr("Group"),
      Locale.tr("Name"),
      Locale.tr("Datastore"),
      Locale.tr("Size"),
      Locale.tr("Type"),
      Locale.tr("Registration time"),
      Locale.tr("Persistent"),
      Locale.tr("Status"),
      Locale.tr("#VMS"),
      Locale.tr("Target"),
    ]

    TabDataTable.call(this);
  };

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.list = _list;
  Table.COLUMN_IDS = COLUMN_IDS;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */
  
  function _elementArray(element_json) {
    var element = element_json.IMAGE;

    // KERNEL || RAMDISK || CONTEXT
    if (element.TYPE == "3" ||  element.TYPE == "4" || element.TYPE == "5") {
      return false;
    }

    return [
      '<input class="check_item" type="checkbox" id="image_' + element.ID + '" name="selected_items" value="' + element.ID + '"/>',
      element.ID,
      element.UNAME,
      element.GNAME,
      element.NAME,
      element.DATASTORE,
      element.SIZE,
      OpenNebulaImage.typeStr(element.TYPE),
      Humanize.prettyTime(element.REGTIME),
      parseInt(element.PERSISTENT) ? "yes" : "no",
      OpenNebulaImage.stateStr(element.STATE),
      element.RUNNING_VMS,
      element.TEMPLATE.TARGET ? element.TEMPLATE.TARGET : '--'
    ];
  }

  function _list(){
    var that = this;
    OpenNebulaImage.list({
      success: function(req, resp) {
        that.updateView(req, resp);
      },
      error: Notifier.onError
    });
  }
});