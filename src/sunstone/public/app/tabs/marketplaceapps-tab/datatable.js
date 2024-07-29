/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

define(function(require) {
  /*
    DEPENDENCIES
   */

  var Humanize = require('utils/humanize');
  var LabelsUtils = require('utils/labels/utils');
  var Locale = require('utils/locale');
  var OpenNebulaMarketPlaceApp = require('opennebula/marketplaceapp');
  var OpenNebulaZone = require('opennebula/zone');
  var StateActions = require('./utils/state-actions');
  var Status = require('utils/status');
  var Sunstone = require('sunstone');
  var SunstoneConfig = require('sunstone-config');
  var TabDataTable = require('utils/tab-datatable');

  /*
    TEMPLATES
   */
  var SearchDropdown = require('hbs!./datatable/search');

  /*
    CONSTANTS
   */

  var RESOURCE = "MarketPlaceApp";
  var XML_ROOT = "MARKETPLACEAPP";
  var TAB_NAME = require('./tabId');
  var LABELS_COLUMN = 12;
  var SEARCH_COLUMN = 13;
  var TEMPLATE_ATTR = 'TEMPLATE';

  /*
    CONSTRUCTOR
   */

  /**
   * @dataTableId
   * @param {String} dataTableId unique identifier
   * @param {Object} conf
   *   conf = {
   *     'info': true,     enable on click row will show the element
   *     'action': true,   enable actions on row elements
   *     'select': true,   enable selecting elements from the table
   *     'selectOptions': {
   *       'filter_fn': function(ds) { return ds.TYPE == 0; }
   *     }
   *   }
   * @returns {Table} A new table object
   */
  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    this.xmlRoot = XML_ROOT;
    this.labelsColumn = LABELS_COLUMN;

    this.dataTableOptions = {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check"]},
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']},
          {"sType": "file-size", "aTargets": [ 6 ]},
          {"sType": "date-euro", "aTargets": [ 9 ]},
          {"sType": "num", "aTargets": [1, 11]}
      ]
    }

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Name"),
      Locale.tr("Owner"),
      Locale.tr("Group"),
      Locale.tr("Version"),
      Locale.tr("Size"),
      Locale.tr("State"),
      Locale.tr("Type"),
      Locale.tr("Registration Time"),
      Locale.tr("Marketplace"),
      Locale.tr("Zone"),
      Locale.tr("Labels"),
      "search_data"
    ]

    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "uname_index": 3,
      "select_resource": Locale.tr("Please select an appliance from the list"),
      "you_selected": Locale.tr("You selected the following appliance:"),
      "select_resource_multiple": Locale.tr("Please select one or more appliances from the list"),
      "you_selected_multiple": Locale.tr("You selected the following appliances:")
    }

    this.totalApps = 0;

    this.conf.searchDropdownHTML = SearchDropdown({tableId: this.dataTableId});
    this.conf.searchByType = true;
    this.searchColumn = SEARCH_COLUMN;

    TabDataTable.call(this);
  };

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.initialize = _initialize;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.preUpdateView = _preUpdateView;
  Table.prototype.postUpdateView = _postUpdateView;
  Table.prototype.updateStateActions = _updateStateActions;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _initialize(opts) {
    TabDataTable.prototype.initialize.call(this, opts);
    _updateStateActions();
  }

  function _elementArray(element_json) {
    var element = element_json[XML_ROOT];

    var state = OpenNebulaMarketPlaceApp.stateStr(element.STATE);
    var zone = OpenNebulaZone.getName(element.ZONE_ID);

    this.totalApps++;

    this.type = OpenNebulaMarketPlaceApp.typeStr(element.TYPE);

    var elementType = OpenNebulaMarketPlaceApp.typeStr(element.TYPE);

    var search = {
      NAME:           element.NAME,
      UNAME:          element.UNAME,
      GNAME:          element.GNAME,
      STATE:          state,
      TYPE:           elementType,
      MARKETPLACE:    element.MARKETPLACE,
      ZONE:           zone,
      REGTIME_AFTER:  element.REGTIME,
      REGTIME_BEFORE: element.REGTIME
    }

    var color_html = Status.state_lock_to_color("MARKETPLACEAPP",state, element_json[XML_ROOT]["LOCK"]);

    var appType = elementType;
    switch (elementType){
      case 'VMTEMPLATE':
        appType = 'VM';
        break;
      case 'SERVICE_TEMPLATE':
        appType = 'SERVICE';
        break;
      default:
        break;
    }

    return [
      '<input class="check_item"' +
        'type="checkbox" style="vertical-align: inherit;"' +
        'id="'+this.resource.toLowerCase()+'_' + element.ID + '"' +
        'name="selected_items"' +
        'state="'+element.STATE+'"' +
        'value="' + element.ID + '"/>'+color_html,
      element.ID,
      element.NAME,
      element.UNAME,
      element.GNAME,
      element.VERSION,
      Humanize.sizeFromMB(element.SIZE),
      state,
      appType,
      Humanize.prettyTimeDatatable(element.REGTIME),
      element.MARKETPLACE,
      zone,
      (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||''),
      btoa(unescape(encodeURIComponent(JSON.stringify(search))))
    ];
  }

  function _preUpdateView() {
    this.totalApps = 0;
  }

  function _postUpdateView() {
    $(".total_apps").text(this.totalApps);
  }

  function _updateStateActions(response) {
    if (response) {
      var app = response.MARKETPLACEAPP;
      
      app && app.STATE && OpenNebulaMarketPlaceApp.BUTTON_DEPENDENT_STATES[app.STATE]
        ? StateActions.enableAllStateActions()
        : StateActions.disableAllStateActions(); 
    }
    else {
      $('#' + this.dataTableId).on("change", 'tbody input.check_item', function() {
        var dataTable = Sunstone.getDataTable(TAB_NAME);
        
        // make sure if all checked inputs are available
        $(dataTable.elements()).filter(function() {
          var appState = $("input.check_item[value='"+this+"']", dataTable.dataTable).attr("state");
          return OpenNebulaMarketPlaceApp.BUTTON_DEPENDENT_STATES[appState];
        }).length === dataTable.elements().length && dataTable.elements().length > 0
          ? StateActions.enableAllStateActions()
          : StateActions.disableAllStateActions();
      });
    }
  }
});
