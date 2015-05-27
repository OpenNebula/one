define(function(require) {
  /*
    DEPENDENCIES
   */

  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var OpenNebulaNetwork = require('opennebula/network');
  var Utils = require('tabs/vnets-tab/utils/common');
  var Notifier = require('utils/notifier');
  var ProgressBar = require('utils/progress-bar');

  /*
    CONSTRUCTOR
   */

  /**
   * Constructor
   * @param {string} dataTableId 
   * @param {object} conf        Same options as TabDatatable constructor, plus
   *                             conf.vnetId 
   */
  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.dataTableId = dataTableId;

    //this.tabId = TAB_NAME;
    //this.resource = RESOURCE;
    //this.xmlRoot = XML_ROOT;

    this.vnetId = conf.vnetId;

    this.dataTableOptions = {
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
        //{ "bSortable": false, "aTargets": [3,4] },
      ]
    };

    this.columns = [
      Locale.tr("Address Range"),
      Locale.tr("Type"),
      Locale.tr("Start"),
      Locale.tr("IPv6 Prefix"),
      Locale.tr("Leases")
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 1,
      "select_resource": Locale.tr("Please select an Address Range from the list"),
      "you_selected": Locale.tr("You selected the following Address Range:")
    };

    TabDataTable.call(this);
  }

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.updateFn = _updateFn;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _updateFn() {
    var that = this;

    OpenNebulaNetwork.show({
      data : {
        id: that.vnetId
      },
      timeout: true,
      success: function (request, vn){
        var ar_list_array = [];

        var ar_list = Utils.getARList(vn.VNET);

        $.each(ar_list, function(){
          var ar = this;
          var id = ar.AR_ID;

          var start;

          if(ar.TYPE == "IP4" || ar.TYPE == "IP4_6"){
            start = (ar.IP ? ar.IP : "--");
          } else {
            start = (ar.MAC ? ar.MAC : "--");
          }

          var prefix = "";

          if(ar.GLOBAL_PREFIX && ar.ULA_PREFIX){
            prefix += ar.GLOBAL_PREFIX + "<br>" + ar.ULA_PREFIX;
          } else if (ar.GLOBAL_PREFIX){
            prefix += ar.GLOBAL_PREFIX;
          } else if (ar.ULA_PREFIX){
            prefix += ar.ULA_PREFIX;
          } else {
            prefix = "--";
          }

          ar_list_array.push([
            null,
            id,
            (ar.TYPE ? ar.TYPE : "--"),
            start,
            prefix,
            ProgressBar.html(ar.USED_LEASES, ar.SIZE)
            ]);
        });

        that.updateView(null, ar_list_array, true);
      },
      error: Notifier.onError
    });
  }

  function _elementArray(element_json) {
    return [];
  }
});
