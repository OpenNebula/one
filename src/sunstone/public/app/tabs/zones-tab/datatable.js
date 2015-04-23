define(function(require) {
  require('foundation-datatables');

  var SunstoneConfig = require('sunstone-config');
  var TabDataTable = require('utils/tab-datatable');

  var _dataTableZones;
  var DATATABLE_ID = "dataTableZones";
  var DATATABLE_SEARCH_ID = "zonesSearch";
  var TAB_NAME = require('./tabId');

  function _initialize() {
    _dataTableZones = $('#'+DATATABLE_ID).dataTable({
      "bSortClasses": false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check"]},
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']}
      ]
    });
 
    $('#'+DATATABLE_SEARCH_ID).keyup(function() {
      _dataTableZones.fnFilter($(this).val());
    })

    _dataTableZones.on('draw', function() {
      TabDataTable.recountCheckboxes(_dataTableZones);
    })

    TabDataTable.initCheckAllBoxes(_dataTableZones);
    TabDataTable.tableCheckboxesListener(_dataTableZones);
    TabDataTable.infoListener(_dataTableZones, "Zone.show");
    _dataTableZones.fnSort([[1, SunstoneConfig.tableOrder]]);
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
    return TabDataTable.getSelectedNodes(_dataTableZones);
  }

  var _elementArray = function(element_json) {
    var element = element_json.ZONE;

    return [
        '<input class="check_item" type="checkbox" id="zone_' + element.ID + '" name="selected_items" value="' + element.ID + '"/>',
        element.ID,
        element.NAME,
        element.TEMPLATE.ENDPOINT
    ];
  }

  //callback for an action affecting a zone element
  var _updateElement = function(request, element_json) {
    var id = element_json.ZONE.ID;
    var element = _elementArray(element_json);
    TabDataTable.updateSingleElement(element, _dataTableZones, '#zone_' + id);
  }

  //callback for actions deleting a zone element
  var _deleteElement = function(req) {
    TabDataTable.deleteElement(_dataTableZones, '#zone_' + req.request.data);
    $('div#zone_tab_' + req.request.data, main_tabs_context).remove();
  }

  //call back for actions creating a zone element
  var _addElement = function(request, element_json) {
    var element = _elementArray(element_json);
    TabDataTable.addElement(element, _dataTableZones);
  }

  //callback to update the list of zones.
  var _updateView =function(request, list) {
    var list_array = [];

    $.each(list, function() {
      list_array.push(_elementArray(this));
    });

    TabDataTable.updateView(list_array, _dataTableZones);
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
    'updateZonesView': _updateView,
    'waitingNodes': TabDataTable.waitingNodes
  }
});
