define(function(require) {
  /*
    DEPENDENCIES
   */

  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var ProgressBar = require('utils/progress-bar');
  var Utils = require('./utils/common');

  /*
    CONSTANTS
   */

  var RESOURCE = "Network";
  var XML_ROOT = "VNET";
  var TAB_NAME = require('./tabId');

  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    this.xmlRoot = XML_ROOT;

    this.dataTableOptions = {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check"]},
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']}
      ]
    }

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Owner"),
      Locale.tr("Group"),
      Locale.tr("Name"),
      Locale.tr("Reservation"),
      Locale.tr("Cluster"),
      Locale.tr("Bridge"),
      Locale.tr("Leases"),
      Locale.tr("VLAN ID")
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
    var element = element_json[XML_ROOT];

    // TODO: used by the dashboard
    //addresses_vnets = addresses_vnets + parseInt(network.USED_LEASES);

    var total_size = 0;

    var arList = Utils.getARList(element);

    $.each(arList, function(){
      total_size += parseInt(this.SIZE);
    });

    return [
      '<input class="check_item" type="checkbox" id="' + RESOURCE.toLowerCase() + '_' +
                           element.ID + '" name="selected_items" value="' +
                           element.ID + '"/>',
      element.ID,
      element.UNAME,
      element.GNAME,
      element.NAME,
      element.PARENT_NETWORK_ID.length ? Locale.tr("Yes") : Locale.tr("No"),
      element.CLUSTER.length ? element.CLUSTER : "-",
      element.BRIDGE,
      ProgressBar.html(element.USED_LEASES, total_size),
      element.VLAN_ID.length ? element.VLAN_ID : "-"
    ];
  }
});
