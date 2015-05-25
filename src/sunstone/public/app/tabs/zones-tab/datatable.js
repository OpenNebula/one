define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  
  /*
    CONSTANTS
   */
  
  var RESOURCE = "Zone";
  var XML_ROOT = "ZONE";
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
      Locale.tr("Name"),
      Locale.tr("Endpoint"),
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "select_resource": Locale.tr("Please select a Zone from the list"),
      "you_selected": Locale.tr("You selected the following Zone:"),
      "select_resource_multiple": Locale.tr("Please select one or more Zones from the list"),
      "you_selected_multiple": Locale.tr("You selected the following Zones:")
    };

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
    var element = element_json.ZONE;

    return [
        '<input class="check_item" type="checkbox" id="' + RESOURCE.toLowerCase() + '_' +
                             element.ID + '" name="selected_items" value="' +
                             element.ID + '"/>',
        element.ID,
        element.NAME,
        element.TEMPLATE.ENDPOINT
    ];
  }
});
