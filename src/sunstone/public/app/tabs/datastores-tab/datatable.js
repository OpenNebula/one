define(function(require) {
  require('foundation-datatables');

  var SunstoneConfig = require('sunstone-config');
  var TabDataTable = require('utils/tab-datatable');
  var Locale = require('utils/locale');
  var OpenNebulaDatastore = require('opennebula/datastore');
  var DatastoreCapacityBar = require('./utils/datastore-capacity-bar');

  var _dataTable;
  var DATATABLE_ID = "dataTableDatastores";
  var DATATABLE_SEARCH_ID = "datastoresSearch";
  var TAB_NAME = require('./tabId');

  function _initialize() {
    _dataTable = $('#' + DATATABLE_ID).dataTable({
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
    });

    $('#' + DATATABLE_SEARCH_ID).keyup(function() {
      _dataTable.fnFilter($(this).val());
    })

    _dataTable.on('draw', function() {
      TabDataTable.recountCheckboxes(_dataTable);
    })

    TabDataTable.initCheckAllBoxes(_dataTable);
    TabDataTable.tableCheckboxesListener(_dataTable);
    TabDataTable.infoListener(_dataTable, "Datastore.show");
    _dataTable.fnSort([[1, SunstoneConfig.tableOrder]]);
  }

  var _dataTableHTML = function() {
    var TemplateDataTableHTML = require('hbs!./datatable/table');
    return TemplateDataTableHTML({'dataTableId': DATATABLE_ID});
  }

  var _searchInputHTML = function() {
    var TemplateSearchInputHTML = require('hbs!./datatable/search-input');
    return TemplateSearchInputHTML({'dataTableSearchId': DATATABLE_SEARCH_ID});
  }

  var _elements = function() {
    return TabDataTable.getSelectedNodes(_dataTable);
  }

  var _elementArray = function(element_json) {
    var element = element_json.DATASTORE;

    return [
        '<input class="check_item" type="checkbox" id="datastore_' +
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

  //callback for an action affecting a zone element
  var _updateElement = function(request, element_json) {
    var id = element_json.DATASTORE.ID;
    var element = _elementArray(element_json);
    TabDataTable.updateSingleElement(element, _dataTable, '#datastore_' + id);
  }

  //callback for actions deleting a zone element
  var _deleteElement = function(req) {
    TabDataTable.deleteElement(_dataTable, '#datastore_' + req.request.data);
  }

  //call back for actions creating a zone element
  var _addElement = function(request, element_json) {
    var element = _elementArray(element_json);
    TabDataTable.addElement(element, _dataTable);
  }

  //callback to update the list of zones.
  var _updateView = function(request, list) {
    var list_array = [];

    $.each(list, function() {
      list_array.push(_elementArray(this));
    });

    TabDataTable.updateView(list_array, _dataTable);
  };

  return {
    'initialize': _initialize,
    'dataTableHTML': _dataTableHTML,
    'searchInputHTML': _searchInputHTML,
    'elements': _elements,
    'elementArray': _elementArray,
    'updateElement': _updateElement,
    'deleteElement': _deleteElement,
    'addElement': _addElement,
    'updateView': _updateView,
    'waitingNodes': TabDataTable.waitingNodes
  }
});
