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

  var TabDataTable = require("utils/tab-datatable");
  var VMsTableUtils = require("./utils/datatable-common");
  var OpenNebulaVM = require("opennebula/vm");
  var SunstoneConfig = require("sunstone-config");
  var Locale = require("utils/locale");
  var StateActions = require("./utils/state-actions");
  var Sunstone = require("sunstone");
  var DashboardUtils = require("utils/dashboard");
  var SearchDropdown = require("hbs!./datatable/search");
  var FireedgeValidator = require("utils/fireedge-validator");
  var Websocket = require("utils/websocket");
  var VMRemoteActions = require("utils/remote-actions");

  /*
    CONSTANTS
   */

  var RESOURCE = "VM";
  var XML_ROOT = "VM";
  var TAB_NAME = require("./tabId");
  var LABELS_COLUMN = 11;
  var SEARCH_COLUMN = 12;


  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf, selectOptions) {
    this.conf = conf || {};
    this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    this.xmlRoot = XML_ROOT;
    this.labelsColumn = LABELS_COLUMN;
    var optionsForSelect = selectOptions || {}

    this.dataTableOptions = {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
        {"sType": "ip-address", "aTargets": [0]},
        {"sType": "num", "aTargets": [1]},
        {"sType": "date-euro", "aTargets": [ 10 ]},
        {"bSortable": false, "aTargets": ["check", 11]},
        {"sWidth": "35px", "aTargets": [0]},
        {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
        {"bVisible": false, "aTargets": ["_all"]},
        {"sClass": "middle", "aTargets": ["_all"]}
      ]
    };

    this.columns = VMsTableUtils.columns;

    var defaultSelectOptions = {
      "id_index": 1,
      "name_index": 4,
      "select_resource": Locale.tr("Please select a VM from the list"),
      "you_selected": Locale.tr("You selected the following VM:"),
      "select_resource_multiple": Locale.tr("Please select one or more VMs from the list"),
      "you_selected_multiple": Locale.tr("You selected the following VMs:")
    }

    this.selectOptions = Object.assign(defaultSelectOptions, optionsForSelect);

    this.totalVms = 0;
    this.activeVms = 0;
    this.pendingVms = 0;
    this.failedVms = 0;
    this.offVms = 0;

    this.conf.searchDropdownHTML = SearchDropdown({tableId: this.dataTableId});
    this.searchColumn = SEARCH_COLUMN;

    TabDataTable.call(this);
  };

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.initialize = _initialize;
  Table.prototype.preUpdateView = _preUpdateView;
  Table.prototype.postUpdateView = _postUpdateView;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    var element = element_json[XML_ROOT];
    var state = parseInt(element.STATE);

    this.totalVms++;
    switch (state) {
      case OpenNebulaVM.STATES.INIT:
      case OpenNebulaVM.STATES.PENDING:
      case OpenNebulaVM.STATES.HOLD:
        this.pendingVms++;
        break;
      case OpenNebulaVM.STATES.ACTIVE:
        if (OpenNebulaVM.isFailureState(element.LCM_STATE)) {
          this.failedVms++;
        } else {
          this.activeVms++;
        }
        break;
      case OpenNebulaVM.STATES.STOPPED:
      case OpenNebulaVM.STATES.SUSPENDED:
      case OpenNebulaVM.STATES.POWEROFF:
        this.offVms++;
        break;
      default:
        break;
    }

    return VMsTableUtils.elementArray(element_json);
  }

  function _preUpdateView() {
    var tab = $("#" + TAB_NAME);
    if (!Sunstone.rightInfoVisible(tab)){
      StateActions.disableAllStateActions();
    }

    Sunstone.runAction("VM.pool_monitor");

    this.totalVms = 0;
    this.activeVms = 0;
    this.pendingVms = 0;
    this.failedVms = 0;
    this.offVms = 0;
  }

  function _postUpdateView() {
    $(".total_vms").removeClass("fadeinout");
    DashboardUtils.counterAnimation(".total_vms", this.totalVms);

    $(".active_vms").removeClass("fadeinout");
    DashboardUtils.counterAnimation(".active_vms", this.activeVms);

    $(".pending_vms").removeClass("fadeinout");
    DashboardUtils.counterAnimation(".pending_vms", this.pendingVms);

    $(".failed_vms").removeClass("fadeinout");
    DashboardUtils.counterAnimation(".failed_vms", this.failedVms);

    $(".off_vms").text(this.offVms);

    VMsTableUtils.tooltipCharters();

    FireedgeValidator.validateFireedgeToken(function(token) {
      if (Websocket.disconnected()) {
        Websocket.start(token);
      }
    });
  }

  function _initialize(opts) {
    var that = this;

    TabDataTable.prototype.initialize.call(this, opts);

    VMRemoteActions.bindActionsToContext("#" + this.dataTableId);

    $("#" + this.dataTableId).on("click", "ul.dropdown-menu-css > .menu-hide", function(event) {
      event.stopPropagation();
    });

    $("#" + this.dataTableId).on("change", "tbody input.check_item", function() {
      if ($(this).is(":checked")){
        StateActions.enableStateActions($(this).attr("state"), $(this).attr("lcm_state"));
      } else {
        // First disable all actions
        StateActions.disableAllStateActions();

        // Enable actions available to any of the selected VMs
        var nodes = $("tr", that.dataTable); //visible nodes only
        $.each($("input.check_item:checked", nodes), function() {
          StateActions.enableStateActions($(this).attr("state"), $(this).attr("lcm_state"));
        });
      }

      return true;
    });
  }
});
