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

  var DomDataTable = require("utils/dom-datatable");
  var Locale = require("utils/locale");
  var OpenNebulaRole = require("opennebula/role");
  var OpenNebulaVM = require("opennebula/vm");
  var RolesButtons = require("./roles/roles-buttons");
  var RolesVmButtons = require("./roles/roles-vm-buttons");
  var StateRolesButtons = require("./roles/state-roles-buttons");
  var StateRolesVmButtons = require("./roles/state-roles-vm-buttons");
  var Sunstone = require("sunstone");
  var Tips = require("utils/tips");
  var VMRemoteActions = require("utils/remote-actions");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./roles/html");
  var TemplateRoleInfo = require("hbs!./roles/roleInfo");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./roles/panelId");
  var XML_ROOT = "DOCUMENT";

  var lastRoleIndexSelected = undefined;

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Roles");
    this.icon = "fa-wrench";

    this.element = info[XML_ROOT];

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
            "name": this.name,
            "state": OpenNebulaRole.state(this.state),
            "cardinality": this.cardinality,
            "vm_template": this.vm_template,
            "parents": this.parents ? this.parents.join(", ") : "-"
          });
      });
    }

    return TemplateHTML({
      "element": this.element,
      "panelId": this.panelId,
      "servicePanel": this.servicePanel,
      "roleList": roleList
    });
  }

  function _getState() {
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

  function _setState(state, _) {
    var that = this;

    if (that.servicerolesDataTable && state["selectedRole"]){
      $(".check_item[id=\""+state["selectedRole"]+"\"]", that.servicerolesDataTable.dataTable).closest("tr").click();
    }

    if (that.serviceroleVMsDataTable && state["selectedVMs"]){
      $.each(state["selectedVMs"], function(){
        $(".check_item[id=\""+this+"\"]", that.serviceroleVMsDataTable.dataTable).closest("tr").click();
      });
    }
  }

  function _setup(context) {
    var that = this;
    var roles = this.roles = that.element.TEMPLATE.BODY.roles;

    Tips.setup(context);

    $("#addRoleBtn").on("click", function(event){
      event.preventDefault();
      Sunstone.runAction("Role.add_dialog");
    });

    if (roles && roles.length) {
      that.servicerolesDataTable = new DomDataTable(
        "datatable_roles_"+this.panelId,
        {
          actions: true,
          info: false,
          oneSelection: true,
          customTabContext: $("#role_actions", context),
          customTrListener: function(tableObj, tr){
            var rowData = tableObj.dataTable.fnGetData(tr);
            var roleName = $(rowData[0]).data().name;

            var roleIndexSelected = roles.findIndex(function(role) {
              return role.name === String(roleName);
            });

            var roleSelected = roles[roleIndexSelected];
            var isEqualLastIndex = lastRoleIndexSelected === roleIndexSelected;

            StateRolesButtons.enableStateActions(roleSelected.state);

            if (!isEqualLastIndex) {
              lastRoleIndexSelected = roleIndexSelected;
            }

            $("#roles_extended_info, context")
              .fadeOut(isEqualLastIndex ? 0 : "slow", function() {
                $(this).html(that.roleHTML(context, roleSelected));
                that.roleSetup($(this), roleSelected);
              })
              .fadeIn(isEqualLastIndex ? 0 : "slow");

            // The info listener is triggered instead of
            // the row selection. So we click the check input to select
            // the row also
            var check = $(".check_item", tr);
            if (!check.is(":checked")) {
              check.trigger("click");
            }
          }
        });

      this.servicerolesDataTable.initialize();

      Sunstone.insertButtonsInTab(TAB_ID, "service_roles_tab", RolesButtons, $("#role_actions", context));
    }
  }


  function _roleHTML(context, role, callback) {
    var that = this;
    var ready_status_gate = that.element.TEMPLATE.BODY.ready_status_gate;
    var promises = [];
    var roleVms = [];

    if (role.nodes) {
      $.each(role.nodes, function(index, node){
        var vm_info = node.vm_info;

        var id = vm_info ? vm_info.VM.ID : node.deploy_id;
        var name = vm_info ? vm_info.VM.NAME : "";
        var uname = vm_info ? vm_info.VM.UNAME : "";
        var gname = vm_info ? vm_info.VM.GNAME : "";
        var ips = "", actions = "";

        function successCallback (data) {
          if (data && data.ID === id) {
            var ready = "";
            var check = "<span class=\"has-tip\" title=\""+Locale.tr("The VM is ready")+"\"><i class=\"fas fa-check\"/></span>";
            if (ready_status_gate && data.USER_TEMPLATE && data.USER_TEMPLATE.READY){
                ready = (data.USER_TEMPLATE.READY.trim().toUpperCase() === "YES")
                ? check
                : "<span class=\"has-tip\" title=\""+
                  Locale.tr("Waiting for the VM to be ready")+"\"><i class=\"fas fa-clock\"/></span>";
            }else if(data.VM && data.VM.LCM_STATE && data.VM.LCM_STATE === "3"){
              ready = check;
            }
            ips = OpenNebulaVM.ipsDropdown(data);

            actions = VMRemoteActions.renderActionsHtml(data);
          }

          roleVms[index] = rowInfoRoleVm(ready, id, name, uname, gname, ips, actions, data.STATE, data.LCM_STATE);
        }

        promises.push(OpenNebulaVM.promiseGetVm({ id, success: successCallback }));
      });
    }

    $.when.apply($, promises).then(function() {
        if (that.serviceroleVMsDataTable) {
          that.serviceroleVMsDataTable.updateView(null, roleVms, true);
          VMRemoteActions.bindActionsToContext(context);
        }

        if (callback && typeof callback === "function") {
          callback();
        }

        Tips.setup(context);
      });


    return TemplateRoleInfo({
      "role": role,
      "servicePanel": that.servicePanel,
      "panelId": that.panelId,
      "vmsTableColumns": [
        Locale.tr("ID"),
        Locale.tr("Name"),
        Locale.tr("Owner"),
        Locale.tr("Group"),
        Locale.tr("IPs"),
        "" // Remote actions
      ],
      "vms": roleVms
    });
  }

  function rowInfoRoleVm(ready, id, name = "", uname = "", gname = "", ips = "", actions = "", state, lcm_state) {
    return [
      ready,
      "<input class=\"check_item\" " +
        "style=\"vertical-align: inherit;\" " +
        "type=\"checkbox\" " +
        "id=\"vm_" + id + "\" " +
        "name=\"selected_items\" " +
        "value=\"" + id + "\" " +
        "state=\"" + state + "\" " +
        "lcm_state=\"" + lcm_state + "\" />",
      "<a href=\"/#vms-tab/" + id + "\">"+ id +"</a>",
      name,
      uname,
      gname,
      ips,
      actions
    ];
  }

  function _roleSetup(context, role) {
    var that = this;

    if(that.servicePanel) {
      that.serviceroleVMsDataTable = new DomDataTable(
        "datatable_vms_" + that.panelId + "_" + role.name,
        {
          actions: true,
          info: false,
          customTabContext: $("#role_vms_actions", context),
          dataTableOptions: {
            "bAutoWidth": false,
            "bSortClasses" : false,
            "bDeferRender": true,
            "aoColumnDefs": [
              {"bSortable": false, "aTargets": ["check", 5, 6]}
            ]
          }
        }
      );

      that.serviceroleVMsDataTable.initialize();

      Sunstone.insertButtonsInTab(
        TAB_ID,
        "service_roles_tab",
        RolesVmButtons,
        $("div#role_vms_actions", context)
      );

      $("#role_vms_actionsrefresh_buttons", context).on("click", function(event) {
        event.preventDefault();

        var prevRowsSelected = $(".check_item:checked", that.serviceroleVMsDataTable.dataTable);
        var prevIdsSelected = $.map(prevRowsSelected, function(row) {
          return $(row).attr("id");
        });

        var roleSelected = that.roles[lastRoleIndexSelected];

        that.roleHTML(context, roleSelected, function() {
          // for each previous selected vms
          $.each(prevIdsSelected, function(_, id) {
            // if exists yet, check it
            var currentRow = $("input#" + id, that.serviceroleVMsDataTable.dataTable);
            currentRow.length && currentRow.trigger("click");
          });
        });

        event.stopPropagation();
      });

      $("#" + that.serviceroleVMsDataTable.dataTableId)
        .on("change", "tbody input.check_item", function() {
          StateRolesVmButtons.disableAllStateActions();

          // Enable actions available to any of the selected VMs
          var nodes = $("tr", that.serviceroleVMsDataTable.dataTable); //visible nodes only
          $.each($("input.check_item:checked", nodes), function() {
            StateRolesVmButtons.enableStateActions($(this).attr("state"), $(this).attr("lcm_state"));
          });

          return true;
        });
    }
  }
});
