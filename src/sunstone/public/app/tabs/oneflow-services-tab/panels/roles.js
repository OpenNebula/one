/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var OpenNebulaRole = require('opennebula/role');
  var roles_buttons = require('./roles/roles-buttons');
  var roles_vm_buttons = require('./roles/roles-vm-buttons');
  var Sunstone = require('sunstone');
  var DomDataTable = require('utils/dom-datatable');
  var VMsTableUtils = require('tabs/vms-tab/utils/datatable-common');
  var SunstoneConfig = require('sunstone-config');
  var Vnc = require('utils/vnc');
  var Spice = require('utils/spice');
  var Notifier = require('utils/notifier');

  var VMS_TAB_ID = require('tabs/vms-tab/tabId');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./roles/html');
  var TemplateRoleInfo = require('hbs!./roles/roleInfo');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./roles/panelId');
  var XML_ROOT = "DOCUMENT";
  var RESOURCE = "Service";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Roles");
    this.icon = "fa-wrench";

    this.element = info[XML_ROOT];

    this.selected_row_role_id = undefined;

    // Controls visibility of buttons only available to OneFlow services. This
    // panel is also used by the OneFlow templates
    this.servicePanel = true;

    this.panelId = PANEL_ID;

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;
  Panel.prototype.getState = _getState;
  Panel.prototype.setState = _setState;
  Panel.prototype.roleHTML = _roleHTML;
  Panel.prototype.roleSetup = _roleSetup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var roleList = [];

    var roles = this.element.TEMPLATE.BODY.roles;
    if (roles && roles.length) {
      $.each(roles, function(){
        roleList.push(
          {
            'name': this.name,
            'state': OpenNebulaRole.state(this.state),
            'cardinality': this.cardinality,
            'vm_template': this.vm_template,
            'parents': this.parents ? this.parents.join(', ') : '-'
          });
      });
    }

    return TemplateHTML({
      'element': this.element,
      'panelId': this.panelId,
      'servicePanel': this.servicePanel,
      'roleList': roleList
    });
  }

  function _getState(context) {
    var state = {};

    if (this.servicerolesDataTable){
      var selectedCheck = $(".check_item:checked", this.servicerolesDataTable.dataTable);

      if (selectedCheck.length > 0){
        state["selectedRole"] = selectedCheck.attr("id");

        if(this.serviceroleVMsDataTable){
          var selectedVMs = [];

          $.each($(".check_item:checked", this.serviceroleVMsDataTable.dataTable), function(){
            selectedVMs.push($(this).attr("id"));
          });

          if (selectedVMs.length > 0){
            state["selectedVMs"] = selectedVMs;
          }
        }
      }
    }

    return state;
  }

  function _setState(state, context) {
    var that = this;

    if (this.servicerolesDataTable && state["selectedRole"]){
      $('.check_item[id="'+state["selectedRole"]+'"]', this.servicerolesDataTable.dataTable).closest('tr').click();
    }

    if (this.serviceroleVMsDataTable && state["selectedVMs"]){
      $.each(state["selectedVMs"], function(){
        $('.check_item[id="'+this+'"]', that.serviceroleVMsDataTable.dataTable).closest('tr').click();
      });
    }
  }

  function _setup(context) {
    var that = this;

    Tips.setup(context);

    that.last_selected_row_role = undefined;

    var roles = this.element.TEMPLATE.BODY.roles;
    if (roles && roles.length) {
      this.servicerolesDataTable = new DomDataTable(
        'datatable_roles_'+this.panelId,
        {
          actions: true,
          info: false,
          oneSelection: true,
          customTabContext: $('#role_actions', context),
          customTrListener: function(tableObj, tr){
            var aData = tableObj.dataTable.fnGetData(tr);
            var role_name = $(aData[0]).val();

            var role_index = tableObj.dataTable.fnGetPosition(tr);

            $("#roles_extended_info", context).html(that.roleHTML(role_index));
            that.roleSetup($("#roles_extended_info", context), role_index);

            // The info listener is triggered instead of
            // the row selection. So we click the check input to select
            // the row also
            var check = $('.check_item', tr);
            if (!check.is(":checked")) {
              check.trigger('click');
            }
          }
        });

      this.servicerolesDataTable.initialize();

      Sunstone.insertButtonsInTab(TAB_ID, "service_roles_tab", roles_buttons, $('#role_actions', context));
    }
  }


  function _roleHTML(role_index) {
    var that = this;

    var role = this.element.TEMPLATE.BODY.roles[role_index];

    var vms = [];

    if (role.nodes) {
      $.each(role.nodes, function(){
        var vm_info = this.vm_info;

        var info = [];
        if (this.scale_up) {
          info.push("<i class='fa fa-arrow-up'/>");
        } else if (this.disposed) {
          info.push("<i class='fa fa-arrow-down'/>");
        } else {
          info.push("");
        }

        if (that.element.TEMPLATE.BODY.ready_status_gate) {
          if (vm_info.VM.USER_TEMPLATE.READY == "YES") {
            info.push('<span class="has-tip" title="'+Locale.tr("The VM is ready")+'"><i class="fa fa-check"/></span>');

          } else {
            info.push('<span class="has-tip" title="'+Locale.tr("Waiting for the VM to be ready")+'"><i class="fa fa-clock-o"/></span>');
          }
        } else {
          info.push("");
        }

        if (vm_info) {
          vms.push(info.concat(VMsTableUtils.elementArray(vm_info)));
        } else {
          vms.push(info.concat(VMsTableUtils.emptyElementArray(this.deploy_id)));
        }
      });
    }

    return TemplateRoleInfo({
      'role': role,
      'servicePanel': this.servicePanel,
      'panelId': this.panelId,
      'vmsTableColumns': VMsTableUtils.columns,
      'vms': vms
    });
  }

  function _roleSetup(context, role_index) {
    if(this.servicePanel) {
      var role = this.element.TEMPLATE.BODY.roles[role_index];

      $(".vnc", context).off("click");
      $(".vnc", context).on("click", function() {
        var vmId = $(this).attr('vm_id');

        if (!Vnc.lockStatus()) {
          Vnc.lock();
          Sunstone.runAction("VM.startvnc_action", vmId);
        } else {
          Notifier.notifyError(Locale.tr("VNC Connection in progress"));
        }

        return false;
      });

      $(".spice", context).off("click");
      $(".spice", context).on("click", function() {
        var vmId = $(this).attr('vm_id');

        if (!Spice.lockStatus()) {
          Spice.lock();
          Sunstone.runAction("VM.startspice_action", vmId);
        } else {
          Notifier.notifyError(Locale.tr("SPICE Connection in progress"));
        }

        return false;
      });

      // This table has 2 more columns to the left compared to the normal VM table
      // The visibility index array needs to be adjusted
      var visibleColumns = [0,1].concat(
        SunstoneConfig.tabTableColumns(VMS_TAB_ID).map(function(n){
          return n+2;
        }));

      this.serviceroleVMsDataTable = new DomDataTable(
        'datatable_vms_'+this.panelId+'_'+role.name,
        {
          actions: true,
          info: false,
          customTabContext: $('#role_vms_actions', context),
          dataTableOptions: {
            "bAutoWidth": false,
            "bSortClasses" : false,
            "bDeferRender": true,
            "aoColumnDefs": [
              {"bSortable": false, "aTargets": [0,1,"check"]},
              {"bVisible": true, "aTargets": visibleColumns},
              {"bVisible": false, "aTargets": ['_all']}
            ]
          }
        });

      this.serviceroleVMsDataTable.initialize();
      Sunstone.insertButtonsInTab(
        TAB_ID,
        "service_roles_tab",
        roles_vm_buttons,
        $('div#role_vms_actions', context));
    }

    Tips.setup(context);
  }
});
