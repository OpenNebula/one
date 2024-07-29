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

  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var OpenNebulaMarketPlace = require('opennebula/marketplace');
  var OpenNebulaZone = require('opennebula/zone');
  var DatastoreCapacityBar = require('../datastores-tab/utils/datastore-capacity-bar');
  var LabelsUtils = require('utils/labels/utils');
  var SearchDropdown = require('hbs!./datatable/search');
  var Status = require('utils/status');

  /*
    CONSTANTS
   */

  var RESOURCE = "MarketPlace";
  var XML_ROOT = "MARKETPLACE";
  var TAB_NAME = require('./tabId');
  var LABELS_COLUMN = 9;
  var SEARCH_COLUMN = 10;
  var TEMPLATE_ATTR = 'TEMPLATE';

  /*
    CONSTRUCTOR
   */

  /*
    @dataTableId
    @param {String} dataTableId unique identifier
    @param {Object} conf
      conf = {
        'info': true,     enable on click row will show the element
        'action': true,   enable actions on row elements
        'select': true,   enable selecting elements from the table
        'selectOptions': {
          'filter_fn': function(ds) { return ds.TYPE == 0; }
        }
      }
    @returns {Table} A new table object
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
          {"sWidth": "250px", "aTargets": [5]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']},
          {"sType": "num", "aTargets": [1, 6, 8]}
      ]
    }

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Name"),
      Locale.tr("Owner"),
      Locale.tr("Group"),
      Locale.tr("Capacity"),
      Locale.tr("Apps"),
      Locale.tr("Driver"),
      Locale.tr("Zone"),
      Locale.tr("Labels"),
      "search_data"
    ]

    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "uname_index": 3,
      "select_resource": Locale.tr("Please select a marketplace from the list"),
      "you_selected": Locale.tr("You selected the following marketplace:"),
      "select_resource_multiple": Locale.tr("Please select one or more marketplaces from the list"),
      "you_selected_multiple": Locale.tr("You selected the following marketplaces:")
    }

    this.conf.searchDropdownHTML = SearchDropdown({tableId: this.dataTableId});
    this.searchColumn = SEARCH_COLUMN;

    this.totalMarkets = 0;

    TabDataTable.call(this);
  };

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
    var element = element_json[XML_ROOT];
    this.totalMarkets++;

    var zone = OpenNebulaZone.getName(element.ZONE_ID);

    var search = {
      NAME:       element.NAME,
      UNAME:      element.UNAME,
      GNAME:      element.GNAME,
      MARKET_MAD: element.MARKET_MAD,
      ZONE:       zone
    }

    var color_html = Status.state_lock_to_color("MARKETPLACE",false, element_json[XML_ROOT]["LOCK"]);

    return [
      '<input class="check_item" type="checkbox" '+
                          'style="vertical-align: inherit;" id="'+this.resource.toLowerCase()+'_' +
                           element.ID + '" name="selected_items" value="' +
                           element.ID + '"/>'+color_html,
        element.ID,
        element.NAME,
        element.UNAME,
        element.GNAME,
        DatastoreCapacityBar.html(element),
        _lengthOf(element.MARKETPLACEAPPS.ID),
        element.MARKET_MAD,
        zone,
        (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||''),
        btoa(unescape(encodeURIComponent(JSON.stringify(search))))
    ];
  }

  function _lengthOf(ids){
    var l = 0;
    if (Array.isArray(ids))
      l = ids.length;
    else if (!$.isEmptyObject(ids))
      l = 1;

    return l;
  }

  function _preUpdateView() {
    this.totalMarkets = 0;
  }

  function _postUpdateView() {
    $(".total_markets").text(this.totalMarkets);
  }
});
