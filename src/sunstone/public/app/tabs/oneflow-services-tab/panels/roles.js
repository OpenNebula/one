/* -------------------------------------------------------------------------- */
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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

  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var OpenNebulaRole = require("opennebula/role");
  var roles_buttons = require("./roles/roles-buttons");
  var roles_vm_buttons = require("./roles/roles-vm-buttons");
  var Sunstone = require("sunstone");
  var DomDataTable = require("utils/dom-datatable");
  var Vnc = require("utils/vnc");
  var Spice = require("utils/spice");
  var Notifier = require("utils/notifier");
  var OpenNebulaVM = require("opennebula/vm");

  var VMS_TAB_ID = require("tabs/vms-tab/tabId");

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
  Panel.prototype.remoteButtonSetup = _remoteButtonSetup;

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
      $(".check_item[id=\""+state["selectedRole"]+"\"]", this.servicerolesDataTable.dataTable).closest("tr").click();
    }

    if (this.serviceroleVMsDataTable && state["selectedVMs"]){
      $.each(state["selectedVMs"], function(){
        $(".check_item[id=\""+this+"\"]", that.serviceroleVMsDataTable.dataTable).closest("tr").click();
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
        "datatable_roles_"+this.panelId,
        {
          actions: true,
          info: false,
          oneSelection: true,
          customTabContext: $("#role_actions", context),
          customTrListener: function(tableObj, tr){
            var aData = tableObj.dataTable.fnGetData(tr);
            var role_name = $(aData[0]).val();

            var role_index = tableObj.dataTable.fnGetPosition(tr);

            $("#roles_extended_info", context).fadeOut("slow", function() {
              $(this).html(that.roleHTML(context, role_index));
              that.roleSetup($(this), role_index);
            }).fadeIn("slow");

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

      Sunstone.insertButtonsInTab(TAB_ID, "service_roles_tab", roles_buttons, $("#role_actions", context));
    }
  }


  function _roleHTML(context, role_index) {
    var that = this;
    var role = this.element.TEMPLATE.BODY.roles[role_index];
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
          if (data.VM && data.VM.ID === id) {
            var ready = "";
            var check = "<span class=\"has-tip\" title=\""+Locale.tr("The VM is ready")+"\"><i class=\"fas fa-check\"/></span>";
            if (ready_status_gate && data.VM.USER_TEMPLATE && data.VM.USER_TEMPLATE.READY){
                ready = (data.VM.USER_TEMPLATE.READY.trim().toUpperCase() === "YES")
                ? check
                : "<span class=\"has-tip\" title=\""+
                  Locale.tr("Waiting for the VM to be ready")+"\"><i class=\"fas fa-clock\"/></span>";
            }else if(data.VM && data.VM.LCM_STATE && data.VM.LCM_STATE === "3"){
              ready = check;
            }

            ips = OpenNebulaVM.ipsStr(data.VM, { forceGroup: true });

            if (OpenNebulaVM.isVNCSupported(data.VM)) {
              actions += OpenNebulaVM.buttonVnc(id);
            }
            else if (OpenNebulaVM.isSPICESupported(data.VM)) {
              actions += OpenNebulaVM.buttonSpice(id);
            }

            var wFile = OpenNebulaVM.isWFileSupported(data.VM);
            actions += wFile ? OpenNebulaVM.buttonWFile(id, wFile) : "";

            var rdp = OpenNebulaVM.isRDPSupported(data.VM);
            actions += rdp ? OpenNebulaVM.buttonRDP(rdp.IP, data.VM) : "";
          }

          roleVms[index] = rowInfoRoleVm(ready, id, name, uname, gname, ips, actions);
        }

        promises.push(promiseVmInfo(id, successCallback));
      });
    }

    $.when.apply($, promises).then(function() {
      if (that.serviceroleVMsDataTable) {
        that.serviceroleVMsDataTable.updateView(null, roleVms, true);
      }

      that.remoteButtonSetup(context);
      Tips.setup(context);
    });


    return TemplateRoleInfo({
      "role": role,
      "servicePanel": this.servicePanel,
      "panelId": this.panelId,
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

  function rowInfoRoleVm(ready, id, name = "", uname = "", gname = "", ips = "", actions = "") {
    return [
      ready,
      "<input class=\"check_item\" style=\"vertical-align: inherit;\" type=\"checkbox\" "+
        "id=\"vm_" + id + "\" name=\"selected_items\" value=\"" + id + "\"/>",
      "<a href=\"/#vms-tab/" + id + "\">"+ id +"</a>",
      name,
      uname,
      gname,
      ips,
      actions
    ];
  }

  function promiseVmInfo(id, success) {
    return $.ajax({
      url: "vm/" + id,
      type: "GET",
      dataType: "json",
      success: success
    });
  }

  function _roleSetup(context, role_index) {
    if(this.servicePanel) {
      var role = this.element.TEMPLATE.BODY.roles[role_index];

      this.serviceroleVMsDataTable = new DomDataTable(
        "datatable_vms_"+this.panelId+"_"+role.name,
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
        });

      this.serviceroleVMsDataTable.initialize();
      Sunstone.insertButtonsInTab(
        TAB_ID,
        "service_roles_tab",
        roles_vm_buttons,
        $("div#role_vms_actions", context)
      );
    }
  }

  function _remoteButtonSetup(context) {
    $(".spice", context).off("click");
    $(".spice", context).on("click", function() {
      var data = $(this).data();

      if (!Spice.lockStatus() && data.hasOwnProperty("id")) {
        Spice.lock();
        Sunstone.runAction("VM.startspice_action", String(data.id));
      } else {
        Notifier.notifyError(Locale.tr("SPICE Connection in progress"));
      }

      return false;
    });

    $(".w_file", context).off("click");
    $(".w_file", context).on("click", function() {
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

    $(".vnc", context).off("click");
    $(".vnc", context).on("click", function() {
      var data = $(this).data();

      if (!Vnc.lockStatus() && data.hasOwnProperty("id")) {
        Vnc.lock();
        Sunstone.runAction("VM.startvnc_action", String(data.id));
      } else {
        Notifier.notifyError(Locale.tr("VNC Connection in progress"));
      }

      return false;
    });

    $(".rdp", context).off("click");
    $(".rdp", context).on("click", function() {
      var data = $(this).data();

      (data.hasOwnProperty("ip") && data.hasOwnProperty("name"))
        ? Sunstone.runAction("VM.save_rdp", data)
        : Notifier.notifyError(Locale.tr("This VM needs a nic with rdp active"));

        return false;
    });

    Tips.setup(context);
  }
});
