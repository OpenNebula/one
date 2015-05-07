define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var OpenNebulaDatastore = require('opennebula/datastore');
  var DatastoreCapacityBar = require('./utils/datastore-capacity-bar');
  
  /*
    CONSTANTS
   */
  
  var RESOURCE = "Datastore"
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
      Locale.tr("Capacity"),
      Locale.tr("Cluster"),
      Locale.tr("Basepath"),
      Locale.tr("TM MAD"),
      Locale.tr("DS MAD"),
      Locale.tr("Type"),
      Locale.tr("Status"),
    ]

    this.selectOptions = {
      "id_index": 1,
      "name_index": 4,
      "uname_index": 2,
      "select_resource": Locale.tr("Please select a datastore from the list"),
      "you_selected": Locale.tr("You selected the following datastore:"),
      "select_resource_multiple": Locale.tr("Please select one or more datastores from the list"),
      "you_selected_multiple": Locale.tr("You selected the following datastores:")
    }

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
    var element = element_json.DATASTORE;

    return [
        '<input class="check_item" type="checkbox" id="'+RESOURCE.toLowerCase()+'_' +
                             element.ID + '" name="selected_items" value="' +
                             element.ID + '"/>',
        element.ID,
        element.UNAME,
        element.GNAME,
        element.NAME,
        DatastoreCapacityBar.html(element),
        element.CLUSTER.length ? element.CLUSTER : "-",
        element.BASE_PATH,
        element.TM_MAD,
        element.DS_MAD,
        element.TEMPLATE.TYPE.toLowerCase().split('_')[0],
        Locale.tr(OpenNebulaDatastore.stateStr(element.STATE))
    ];
  }
});
