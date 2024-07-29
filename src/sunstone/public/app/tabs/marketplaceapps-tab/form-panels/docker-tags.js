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

  var Sunstone = require('sunstone');
  var OpenNebula = require('opennebula');
  var TabDataTable = require('utils/tab-datatable');
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');

  /*
    CONSTANTS
   */

  var RESOURCE = "MarketPlaceApp";
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = TAB_ID;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    this.appId = conf.appId;

    this.dataTableOptions = {
      bAutoWidth: false,
      bSortClasses : false,
      bDeferRender: true,
      aoColumnDefs: [
        { sType: "string", aTargets: [0, 1], aDataSort: [0, 1] },
        { sType: "date", aTargets: [2], aDataSort: [2] },
      ],
      aLengthMenu: [ [5, 10, 20, -1], [5, 10, 20, "All"] ],
      iDisplayLength: 5,
    };

    this.columns = [
      Locale.tr("Name"),
      Locale.tr("Last updated")
    ];

    this.selectOptions = {
      "id_index": 0,
      "name_index": 0,
      "select_resource": Locale.tr("Please select a dockerhub tag from the list (default latest)"),
      "you_selected": Locale.tr("You selected the following dockerhub tags:")
    }

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

  function _elementArray(element) {
    var lastUpdated = "";
    if (element.last_updated) {
      var date = new Date(element.last_updated);
      lastUpdated = date.toLocaleDateString();
    }

    return [ element.name, element.name, lastUpdated ];
  }

  function _updateFn() {
    var that = this;
    $("#refresh_button_exportMarketPlaceAppFormdocketagsTable").addClass("fa-spin");

    var success_func = function (_, resource_list) {
      var list_array = [];
      $.each(resource_list, function() {
        list_array.push(that.elementArray(this));
      });

      that.updateView(null, list_array, true);
      Sunstone.enableFormPanelSubmit(TAB_ID);
      $("#refresh_button_exportMarketPlaceAppFormdocketagsTable").removeClass("fa-spin");
    }

    OpenNebula[this.resource].tags({
        data: { id: this.appId },
        success: success_func,
        error: function(request, error_json, container) {
          success_func(request, []);
          Notifier.onError(request, error_json, container);
        }
      });
    
  }
});
