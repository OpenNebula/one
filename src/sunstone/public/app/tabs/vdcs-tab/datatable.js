define(function(require) {
  /*
    DEPENDENCIES
   */

  var TabDataTable = require('utils/tab-datatable');
  var Config = require('sunstone-config');
  var Locale = require('utils/locale');

  /*
    CONSTANTS
   */

  var RESOURCE = "Vdc";
  var XML_ROOT = "VDC";
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
          { "bSortable": false, "aTargets": ["check"] },
          { "sWidth": "35px", "aTargets": [0] },
          { "bVisible": true, "aTargets": Config.tabTableColumns(TAB_NAME)},
          { "bVisible": false, "aTargets": ['_all']}
      ]
    };

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Name"),
      Locale.tr("Groups"),
      Locale.tr("Clusters"),
      Locale.tr("Hosts"),
      Locale.tr("VNets"),
      Locale.tr("Datastores")
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "select_resource": Locale.tr("Please select a VDC from the list"),
      "you_selected": Locale.tr("You selected the following VDC:"),
      "select_resource_multiple": Locale.tr("Please select one or more VDCs from the list"),
      "you_selected_multiple": Locale.tr("You selected the following VDCs:")
    };

    this.totalElements = 0;

    TabDataTable.call(this);
  }

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.preUpdateView = _preUpdateView;
  Table.prototype.postUpdateView = _postUpdateView;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    this.totalElements++;

    var element = element_json[XML_ROOT];

    return [
      '<input class="check_item" type="checkbox" id="'+RESOURCE.toLowerCase()+'_' +
                           element.ID + '" name="selected_items" value="' +
                           element.ID + '"/>',
      element.ID,
      element.NAME,
      _lengthOf(element.GROUPS.ID),
      _lengthOf(element.CLUSTERS.CLUSTER),
      _lengthOf(element.HOSTS.HOST),
      _lengthOf(element.VNETS.VNET),
      _lengthOf(element.DATASTORES.DATASTORE)
    ];
  }

  function _lengthOf(ids){
    var l = 0;
    if ($.isArray(ids))
      l = ids.length;
    else if (!$.isEmptyObject(ids))
      l = 1;

    return l;
  }

  function _preUpdateView() {
    this.totalElements = 0;
  }

  function _postUpdateView() {
    $(".total_vdcs").text(this.totalElements);
  }
});
