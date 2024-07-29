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

  var TemplateLeases = require('hbs!./leases/html');
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Sunstone = require('sunstone');
  var Utils = require('../utils/common');
  var OpenNebulaVM = require('opennebula/vm');
  var DomDataTable = require('utils/dom-datatable');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./leases/panelId');
  var RESOURCE = "Network";
  var XML_ROOT = "VNET";

  var LEASES_STATES = {
    HOLD: Locale.tr("HOLD"),
    UPDATED: Locale.tr("UPDATED"),
    OUTDATED: Locale.tr("OUTDATED"),
    UPDATING: Locale.tr("UPDATING"),
    ERROR: Locale.tr("ERROR"),
    UNKNOWN: Locale.tr("UNKNOWN"),
    RESERVED: Locale.tr("RESERVED"),
    EMPTY: "--",
  }

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Leases");
    this.icon = "fa-list-ul";

    this.element = info[XML_ROOT];

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function flatStateIDs(vnet, stateName = ''){
    var stateVMs = vnet[stateName].ID

    return stateVMs ? (Array.isArray(stateVMs) ? stateVMs : [stateVMs]) : []
  }

  function _html() {
    var that = this;
    var arList = Utils.getARList(this.element);
    var processedLeases = [];

    var leasesStates = {
      "-1" : LEASES_STATES.HOLD, // State for leases on hold
    }

    var updatedVMs = flatStateIDs(that.element, "UPDATED_VMS")
    var outdatedVMs = flatStateIDs(that.element, "OUTDATED_VMS") 
    var updatingVMs = flatStateIDs(that.element, "UPDATING_VMS")
    var errorVMs = flatStateIDs(that.element, "ERROR_VMS")

    function addToLeasesStates(vmsIds, stateName = ''){
      vmsIds.forEach(function(id){
        leasesStates[id] = stateName
      })
    }

    addToLeasesStates(updatedVMs, LEASES_STATES.UPDATED)
    addToLeasesStates(outdatedVMs, LEASES_STATES.OUTDATED)
    addToLeasesStates(updatingVMs, LEASES_STATES.UPDATING)
    addToLeasesStates(errorVMs, LEASES_STATES.ERROR)

    // Get Leases
    for (var i=0; i<arList.length; i++){
      var ar = arList[i];
      var id = ar.AR_ID;

      var leases = ar.LEASES.LEASE;

      if (!leases) { //empty
        continue;
      } else if (leases.constructor != Array) { //>1 lease
        leases = [leases];
      }

      for (var j=0; j<leases.length; j++){
        var lease = leases[j];
        var leaseState = LEASES_STATES.UNKNOWN

        var col0HTML = "";
        var col1HTML = "";

        if (lease.VM === "-1") { //hold
          col0HTML = '<i class="alert-color fas fa-square"/>';
          leaseState = leasesStates[lease.VM]

          if (Config.isTabActionEnabled("vnets-tab", "Network.release_lease")) {
            var ip = lease.IP ? lease.IP : "";
            var mac = lease.MAC ? lease.MAC : "";
            col1HTML = '<a class="release_lease button small" href="#" data-ip="'+ ip + '" data-mac="'+ mac + '" ><i class="fas fa-play"/></a>';
          }
        } else if (lease.VM != undefined) { //used by a VM
          leaseState = leasesStates[lease.VM]
          col0HTML = '<i class="primary-color fas fa-square"/>';
          col1HTML = Navigation.link(Locale.tr("VM:") + lease.VM, "vms-tab", lease.VM) ;
        } else if (lease.VNET != undefined) { //used by a VNET
          leaseState = LEASES_STATES.RESERVED
          col0HTML = '<i class="warning-color fas fa-square"/>';
          col1HTML = Navigation.link(Locale.tr("NET:") + lease.VNET, "vnets-tab", lease.VNET);
        } else if (lease.VROUTER != undefined) { //used by a VR
          leaseState = LEASES_STATES.EMPTY
          col0HTML = '<i class="success-color fas fa-square"/>';
          col1HTML = Navigation.link(Locale.tr("VR:") + lease.VROUTER, "vrouters-tab", lease.VROUTER);
        } else {
          col0HTML = '<i class="primary-color fas fa-square"/>';
          col1HTML = '--';
        }

        processedLeases.push([
          col0HTML,
          col1HTML,
          leaseState,
          lease.IP ? lease.IP : "--",
          lease.IP6 ? lease.IP6 : "--",
          lease.MAC ? lease.MAC : "--",
          lease.IP6_LINK ? lease.IP6_LINK : "--",
          lease.IP6_ULA ? lease.IP6_ULA : "--",
          lease.IP6_GLOBAL ? lease.IP6_GLOBAL : "--",
          id ? id : "--"
        ]);
      }

      // Update Table View
      if (that.leases_dataTable){
        that.leases_dataTable.updateView(request, processedLeases, true);
      }
    }

    return TemplateLeases({
      'element': that.element,
      'leases' : processedLeases
    });
  }

  function _setup(context) {
    var that = this;
    
    this.leases_dataTable = new DomDataTable(
      "leases_datatable",
      {
        actions: false,
        info: false,
        dataTableOptions: {
          "bSortClasses" : false,
          "bDeferRender": true,
          "aoColumnDefs": [
            { "bSortable": false, "aTargets": [0,1] },
          ]
        }
      }
    );
    
    this.leases_dataTable.initialize();

    if (Config.isTabActionEnabled("vnets-tab", "Network.hold_lease")) {
      context.off("click", 'button#panel_hold_lease_button');
      context.on("click", 'button#panel_hold_lease_button', function(){
        // TODO: context for selector
        var lease = $('input#panel_hold_lease').val();

        if (lease.length){
            var obj = {ip: lease};
            Sunstone.runAction('Network.hold',that.element.ID,obj);
        }

        return false;
      });
    }

    if (Config.isTabActionEnabled("vnets-tab", "Network.release_lease")) {
      context.off("click", 'a.release_lease');
      context.on("click", 'a.release_lease', function(){
        var lease = $(this).data('ip');
        if (lease == ""){
          lease = $(this).data('mac');
        }

        var obj = { ip: lease};
        Sunstone.runAction('Network.release',that.element.ID,obj);
        //Set spinner
        $(this).parents('tr').html('<td class="key_td"><i class="fas fa-spinner fa-spin"></i></td><td class="value_td"></td>');
        return false;
      });
    }

    return false;
  }
});
