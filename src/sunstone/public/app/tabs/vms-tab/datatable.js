/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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
  var VMsTableUtils = require('./utils/datatable-common');
  var OpenNebulaVM = require('opennebula/vm');
  var OpenNebulaAction = require("opennebula/action");
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var StateActions = require('./utils/state-actions');
  var Sunstone = require('sunstone');
  var Vnc = require('utils/vnc');
  var Spice = require('utils/spice');
  var Notifier = require('utils/notifier');
  var DashboardUtils = require('utils/dashboard');
  var SearchDropdown = require('hbs!./datatable/search');
  var TemplateUtils = require('utils/template-utils');

  /*
    CONSTANTS
   */

  var RESOURCE = "VM";
  var XML_ROOT = "VM";
  var TAB_NAME = require('./tabId');
  var LABELS_COLUMN = 13;
  var SEARCH_COLUMN = 14;


  /*
    CONSTRUCTOR
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
          {"sType": "ip-address", "aTargets": [0]},
          {"sType": "num", "aTargets": [1]},
          {"sType": "date-euro", "aTargets": [ 10 ]},
          {"bSortable": false, "aTargets": ["check", 11]},
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']}
      ]
    };

    this.columns = VMsTableUtils.columns;

    this.selectOptions = {
      "id_index": 1,
      "name_index": 4,
      "select_resource": Locale.tr("Please select a VM from the list"),
      "you_selected": Locale.tr("You selected the following VM:"),
      "select_resource_multiple": Locale.tr("Please select one or more VMs from the list"),
      "you_selected_multiple": Locale.tr("You selected the following VMs:")
    };

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
    var tab = $('#' + TAB_NAME);
    if (!Sunstone.rightInfoVisible(tab)){
      StateActions.disableAllStateActions();
    }

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

    VMsTableUtils.tooltipCharters()

    $("#rdp-buttons").foundation();
  }

  function _initialize(opts) {
    var that = this;

    TabDataTable.prototype.initialize.call(this, opts);
    
    //download virt-viewer file 
    $('#' + this.dataTableId).on("click", '.w-file', function(){
      var data = $(this).data();

      (data.hasOwnProperty("id") && data.hasOwnProperty("hostname") && data.hasOwnProperty("type") && data.hasOwnProperty("port"))
        ? Sunstone.runAction(
          "VM.save_virt_viewer_action",
          String(data.id),
          { hostname: data.hostname, type: data.type, port: data.port }
        )
        : Notifier.notifyError(Locale.tr("Data for virt-viewer file isn't correct"));

        return false;
    });

    //download RDP file
    $('#' + this.dataTableId).on("click", '.save-rdp', function() {
      var data = $(this).data();

      (data.hasOwnProperty("ip") && data.hasOwnProperty("name"))
        ? Sunstone.runAction("VM.save_rdp", data)
        : Notifier.notifyError(Locale.tr("This VM needs a nic with rdp active"));

      return false;
    });

    $('#' + this.dataTableId).on("click", ".rdp", function() {
      var data = $(this).data();

      (data.hasOwnProperty("id"))
        ? Sunstone.runAction("VM.startguac_action", String(data.id), 'rdp')
        : Notifier.notifyError(Locale.tr("RDP - Invalid action"));

      return false;
    });

    $('#' + this.dataTableId).on("click", ".ssh", function() {
      var data = $(this).data();

      (data.hasOwnProperty("id"))
        ? Sunstone.runAction("VM.startguac_action", String(data.id), 'ssh')
        : Notifier.notifyError(Locale.tr("SSH - Invalid action"));

      return false;
    });

    $('#' + this.dataTableId).on("click", ".guac-vnc", function() {
      var data = $(this).data();

      (data.hasOwnProperty("id"))
        ? Sunstone.runAction("VM.startguac_action", String(data.id), 'vnc')
        : Notifier.notifyError(Locale.tr("VNC - Invalid action"));

      return false;
    });

    $('#' + this.dataTableId).on("click", '.vnc', function() {
      var data = $(this).data();

      if (!Vnc.lockStatus() && data.hasOwnProperty("id")) {
        Vnc.lock();
        Sunstone.runAction("VM.startvnc_action", String(data.id));
      } else {
        Notifier.notifyError(Locale.tr("VNC Connection in progress"));
      }

      return false;
    });

    $('#' + this.dataTableId).on("click", '.spice', function() {
      var data = $(this).data();

      if (!Spice.lockStatus() && data.hasOwnProperty("id")) {
        Spice.lock();
        Sunstone.runAction("VM.startspice_action", String(data.id));
      } else {
        Notifier.notifyError(Locale.tr("SPICE Connection in progress"))
      }

      return false;
    });

    $('#' + this.dataTableId).on("change", 'tbody input.check_item', function() {
      if ($(this).is(":checked")){
        StateActions.enableStateActions($(this).attr("state"), $(this).attr("lcm_state"));
      } else {
        // First disable all actions
        StateActions.disableAllStateActions();

        // Enable actions available to any of the selected VMs
        var nodes = $('tr', that.dataTable); //visible nodes only
        $.each($('input.check_item:checked', nodes), function(){
          StateActions.enableStateActions($(this).attr("state"), $(this).attr("lcm_state"));
        });

      }

      return true;
    });

  }


});
