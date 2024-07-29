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
  var Config = require("sunstone-config");
  var Sunstone = require("sunstone");
  var Notifier = require("utils/notifier");
  var Locale = require("utils/locale");
  var OpenNebulaVM = require("opennebula/vm");
  var CommonActions = require("utils/common-actions");
  var Files = require("utils/files");
  var RemoteActions = require("utils/remote-actions");

  var CREATE_APP_DIALOG_ID = require("tabs/marketplaceapps-tab/form-panels/create/formPanelId");
  var CREATE_DIALOG_ID = require("./form-panels/create/formPanelId");
  var DEPLOY_DIALOG_ID = require("./dialogs/deploy/dialogId");
  var MARKETPLACEAPPS_TAB_ID = require("tabs/marketplaceapps-tab/tabId");
  var MIGRATE_DIALOG_ID = require("./dialogs/migrate/dialogId");
  var SAVE_AS_TEMPLATE_DIALOG_ID = require("./dialogs/saveas-template/dialogId");
  var BACKUP_DIALOG_ID = require('./dialogs/backup/dialogId');
  var TAB_ID = require("./tabId");
  var UPDATECONF_FORM_ID = require("./form-panels/updateconf/formPanelId");

  var XML_ROOT = "VM";
  var RESOURCE = "VM";

  var _commonActions = new CommonActions(OpenNebulaVM, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("VM created"));

  var _actions = {
    "VM.list":    _commonActions.list(),
    "VM.pool_monitor": {
      type: "single",
      call: OpenNebulaVM.pool_monitor,
      error: Notifier.onError
    },
    "VM.show": {
      type: "single",
      call: OpenNebulaVM.show,
      callback: function(request, response) {
        $(".not_firecracker").removeClass("hide");
        if (Config.isTabEnabled("provision-tab")) {
          $(".provision_refresh_info", ".provision_list_vms").click();
        } else {
          Sunstone.getDataTable(TAB_ID).updateElement(request, response);
          if (Sunstone.rightInfoVisible($("#" + TAB_ID))) {
            Sunstone.insertPanels(TAB_ID, response);
          }
        }
        if(response &&
          response.VM &&
          response.VM.USER_TEMPLATE &&
          response.VM.USER_TEMPLATE.HYPERVISOR &&
          response.VM.USER_TEMPLATE.HYPERVISOR === "firecracker"){
            $(".not_firecracker").addClass("hide");
          }
      },
      error: Notifier.onError
    },
    "VM.refresh": _commonActions.refresh(),
    "VM.chown": _commonActions.multipleAction("chown"),
    "VM.chgrp": _commonActions.multipleAction("chgrp"),
    "VM.hold":    _commonActions.multipleAction("hold"),
    "VM.release": _commonActions.multipleAction("release"),
    "VM.suspend": _commonActions.multipleAction("suspend"),
    "VM.resume": _commonActions.multipleAction("resume"),
    "VM.stop": _commonActions.multipleAction("stop"),
    "VM.reboot": _commonActions.multipleAction("reboot"),
    "VM.reboot_hard": _commonActions.multipleAction("reboot_hard"),
    "VM.poweroff": _commonActions.multipleAction("poweroff"),
    "VM.poweroff_hard": _commonActions.multipleAction("poweroff_hard"),
    "VM.undeploy": _commonActions.multipleAction("undeploy"),
    "VM.undeploy_hard": _commonActions.multipleAction("undeploy_hard"),
    "VM.terminate": _commonActions.multipleAction("terminate"),
    "VM.terminate_hard": _commonActions.multipleAction("terminate_hard"),
    "VM.recover": _commonActions.multipleAction("recover"),
    "VM.resched": _commonActions.multipleAction("resched"),
    "VM.unresched": _commonActions.multipleAction("unresched"),
    "VM.lockM": _commonActions.multipleAction("lock", false),
    "VM.lockU": _commonActions.multipleAction("lock", false),
    "VM.lockA": _commonActions.multipleAction("lock", false),
    "VM.unlock": _commonActions.multipleAction("unlock", false),

    "VM.chmod": _commonActions.singleAction("chmod"),
    "VM.rename": _commonActions.singleAction("rename"),
    "VM.update_template": _commonActions.updateTemplate(),
    "VM.append_template": _commonActions.appendTemplate(),
    "VM.deploy_action": _commonActions.singleAction("deploy"),
    "VM.migrate_action": _commonActions.singleAction("migrate"),
    "VM.migrate_poff_action": _commonActions.singleAction("migrate_poff"),
    "VM.migrate_poff_hard_action": _commonActions.singleAction("migrate_poff_hard"),
    "VM.migrate_live_action": _commonActions.singleAction("livemigrate"),
    "VM.attachdisk": _commonActions.singleAction("attachdisk"),
    "VM.detachdisk": _commonActions.singleAction("detachdisk"),
    "VM.attachnic": _commonActions.singleAction("attachnic"),
    "VM.detachnic": _commonActions.singleAction("detachnic"),
    "VM.updatenic": _commonActions.singleAction("updatenic"),
    "VM.resize": _commonActions.singleAction("resize"),
    "VM.disk_resize": _commonActions.singleAction("disk_resize"),
    "VM.snapshot_create": _commonActions.singleAction("snapshot_create"),
    "VM.snapshot_revert": _commonActions.singleAction("snapshot_revert"),
    "VM.snapshot_delete": _commonActions.singleAction("snapshot_delete"),
    "VM.disk_snapshot_create": _commonActions.singleAction("disk_snapshot_create"),
    "VM.disk_snapshot_revert": _commonActions.singleAction("disk_snapshot_revert"),
    "VM.disk_snapshot_rename": _commonActions.singleAction("disk_snapshot_rename"),
    "VM.disk_snapshot_delete": _commonActions.singleAction("disk_snapshot_delete"),
    "VM.disk_saveas" : _commonActions.singleAction("disk_saveas"),
    "VM.sched_action_add" : _commonActions.singleAction("sched_action_add"),
    "VM.sched_action_delete" : _commonActions.singleAction("sched_action_delete"),
    "VM.sched_action_update" : _commonActions.singleAction("sched_action_update"),
    "VM.attachsg" : _commonActions.singleAction("attachsg"),
    "VM.detachsg" : _commonActions.singleAction("detachsg"),

    "VM.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },
    "VM.create" : {
      type: "custom",
      call: function(id, name) {
        Sunstone.runAction("Template.instantiate", [id], name);
      },
      callback: function(request, response) {
        Sunstone.runAction("VM.refresh");
      },
      error: Notifier.onError
    },
    "VM.deploy" : {
      type: "custom",
      call: function() {
        var dialog = Sunstone.getDialog(DEPLOY_DIALOG_ID);
        dialog.reset();
        dialog.show();
      }
    },
    "VM.silent_deploy_action" : {
      type: "single",
      call: OpenNebulaVM.deploy,
      error: Notifier.onError
    },
    "VM.migrate" : {
      type: "custom",
      call: function() {
        var dialog = Sunstone.getDialog(MIGRATE_DIALOG_ID);
        dialog.reset();
        dialog.setLive(false);
        dialog.setType(0);
        dialog.show();
      }
    },
    "VM.migrate_poff" : {
      type: "custom",
      call: function() {
        var dialog = Sunstone.getDialog(MIGRATE_DIALOG_ID);
        dialog.reset();
        dialog.setLive(false);
        dialog.setType(1);
        dialog.show();
      }
    },
    "VM.migrate_poff_hard" : {
      type: "custom",
      call: function() {
        var dialog = Sunstone.getDialog(MIGRATE_DIALOG_ID);
        dialog.reset();
        dialog.setLive(false);
        dialog.setType(2);
        dialog.show();
      }
    },
    "VM.migrate_live" : {
      type: "custom",
      call: function() {
        var dialog = Sunstone.getDialog(MIGRATE_DIALOG_ID);
        dialog.reset();
        dialog.setLive(true);
        dialog.setType(0);
        dialog.show();
      }
    },
    "VM.save_rdp" : {
      type: "custom",
      call: function(args) {
        var vm = Sunstone.getElementRightInfo(TAB_ID);
        var rdpIp = OpenNebulaVM.isConnectionSupported(vm, "rdp");

        if (args && args.ip && args.name) {
          var credentials = {};
          args.username && (credentials["USERNAME"] = args.username);
          args.password && (credentials["PASSWORD"] = args.password);
          Files.downloadRdpFile(args.ip, args.name, credentials);
        }
        else if (vm && vm.NAME && vm.TEMPLATE && rdpIp) {
          var name = vm.NAME;
          var credentials = {};

          if (vm.TEMPLATE.CONTEXT) {
            var context = vm.TEMPLATE.CONTEXT;
            for (var prop in context) {
              var propUpperCase = String(prop).toUpperCase();
              (propUpperCase === "USERNAME" || propUpperCase === "PASSWORD")
                && (credentials[propUpperCase] = context[prop]);
            }
          }

          Files.downloadRdpFile(rdpIp, name, credentials);
        } else {
          Notifier.notifyError(Locale.tr("Data for rdp file isn't correct"));
          return false;
        }
      }
    },
    "VM.save_virt_viewer" : {
      type: "custom",
      call: function() {
        var vm = Sunstone.getElementRightInfo(TAB_ID) || {};
        var wDataFile = OpenNebulaVM.isWFileSupported(vm);
        if (vm && vm.ID && wDataFile) {
          Sunstone.runAction("VM.save_virt_viewer_action", vm.ID, wDataFile);
        } else {
          Notifier.notifyError(Locale.tr("Data for virt-viewer file isn't correct"));
          return false;
        }
      }
    },
    "VM.save_virt_viewer_action" : {
      type: "single",
      call: OpenNebulaVM.vnc,
      callback: function(_, response) {
        _.request && $.each(_.request.data, function(_, vm) {
          var hostname = vm.extra_param.hostname;
          var type = vm.extra_param.type;
          var port = vm.extra_param.port;

          (hostname && type && port)
            ? Files.downloadWFile(response, hostname, type, port)
            : Notifier.notifyError(Locale.tr("Data for virt-viewer file isn't correct"));
        });
      },
      error: function(req, resp) {
        Notifier.onError(req, resp);
      },
    },
    "VM.startvnc" : {
      type: "custom",
      call: function() {
        $.each(Sunstone.getDataTable(TAB_ID).elements(), function(index, elem) {
          Sunstone.runAction("VM.startvnc_action", elem);
        });
      },
      error: function(req, resp) {
        Notifier.onError(req, resp);
      },
      notify: true
    },
    "VM.startvnc_action" : {
      type: "single",
      call: OpenNebulaVM.vnc,
      callback: function(request, response) {
        var link = RemoteActions.getLink(response,{
            port: Config.vncProxyPort,
            protocol: Config.vncWSS === "yes" ? "https:" : "http:",
            connnection_type: "vnc",
            extra_params: [
              "port=" + Config.vncProxyPort,
              "encrypt=" + Config.vncWSS,
              !Config.requestVNCPassword && "password=" + response.password
            ]
        });
        // Open in a new tab the noVNC connection
        window.open(link);
      },
      error: function(req, resp) {
        Notifier.onError(req, resp);
      },
      notify: true
    },
    "VM.startvmrc" : {
      type: "custom",
      call: function() {
        $.each(Sunstone.getDataTable(TAB_ID).elements(), function(index, elem) {
            var vm_name = OpenNebulaVM.getName(elem);
            Sunstone.runAction("VM.startvmrc_action", elem, vm_name);
        });
      },
      error: function(req, resp) {
        Notifier.onError(req, resp);
      },
      notify: true
    },
    "VM.startvmrc_action" : {
      type: "single",
      call: OpenNebulaVM.vmrc,
      callback: function(request, response) {
        response["vm_name"] = request.request.data[0].extra_param;
        var fireedge_endpoint = new URL(Config.publicFireedgeEndpoint);
        var link = RemoteActions.getLink(response,{
          host: fireedge_endpoint.hostname,
          port: fireedge_endpoint.port,
          protocol: fireedge_endpoint.protocol,
          connnection_type: "vmrc",
          extra_path: "/fireedge/vmrc/" + response.data,
        });
        // Open in a new tab the VMRC connection
        window.open(link);
      },
      error: function(req, resp) {
        Notifier.onError(req, resp);
      },
      notify: true
    },
    "VM.startspice" : {
      type: "custom",
      call: function() {
        $.each(Sunstone.getDataTable(TAB_ID).elements(), function(index, elem) {
          Sunstone.runAction("VM.startspice_action", elem);
        });
      },
      error: function(req, resp) {
        Notifier.onError(req, resp);
      },
      notify: true
    },
    "VM.startspice_action" : {
      type: "single",
      call: OpenNebulaVM.vnc,
      callback: function(request, response) {
        var link = RemoteActions.getLink(response, {
          port: Config.vncProxyPort,
          protocol: Config.vncWSS === "yes" ? "https:" : "http:",
          connnection_type: "spice",
          extra_params: [
            "password=" + response.password,
            "encrypt=" + config.user_config.vnc_wss,
          ]
        });
        // Open in a new tab the SPICE connection
        window.open(link);
      },
      error: function(req, resp) {
        Notifier.onError(req, resp);
      },
      notify: true
    },
    "VM.guac_vnc" : {
      type: "custom",
      call: function() {
        $.each(Sunstone.getDataTable(TAB_ID).elements(), function(_, elem) {
          Sunstone.runAction("VM.startguac_action", elem, "vnc");
        });
      },
      error: function(req, resp) {
        Notifier.onError(req, resp);
      },
    },
    "VM.guac_rdp" : {
      type: "custom",
      call: function() {
        $.each(Sunstone.getDataTable(TAB_ID).elements(), function(_, elem) {
          Sunstone.runAction("VM.startguac_action", elem, "rdp");
        });
      },
      error: function(req, resp) {
        Notifier.onError(req, resp);
      },
    },
    "VM.guac_ssh" : {
      type: "custom",
      call: function() {
        $.each(Sunstone.getDataTable(TAB_ID).elements(), function(_, elem) {
          Sunstone.runAction("VM.startguac_action", elem, "ssh");
        });
      },
      error: function(req, resp) {
        Notifier.onError(req, resp);
      },
    },
    "VM.startguac_action" : {
      type: "single",
      call: OpenNebulaVM.guac,
      callback: function(request, response) {
        var protocolConnection = request.request.data[0].extra_param;

        var link = RemoteActions.getLink(response, {
          connnection_type: "guac",
          extra_path: "/fireedge/guacamole",
          extra_params: ["type=" + protocolConnection]
        });
        // Open in a new tab the noVNC connection
        window.open(link);
      },
      error: function(req, resp) {
        Notifier.onError(req, resp);
      },
      notify: true
    },
    "VM.save_as_template" : {
      type: "single",
      call: function() {
        var dialog = Sunstone.getDialog(SAVE_AS_TEMPLATE_DIALOG_ID);
        dialog.show();
       },
      error: function(req, resp) {
        Notifier.onError(req, resp);
      },
      notify: false
    },
    "VM.updateconf": {
      type: "single",
      call: OpenNebulaVM.updateconf,
      callback: function (req) {
        Sunstone.resetFormPanel(TAB_ID, UPDATECONF_FORM_ID);
        Sunstone.hideFormPanel(TAB_ID);

        Sunstone.runAction("VM.refresh");
      },
      elements: function(opts) {
        return Sunstone.getDataTable(TAB_ID).elements(opts);
      },
      error: function(request, response) {
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.onError(request, response);
      },
      notify: false
    },
    "VM.upload_marketplace_dialog" : {
      type: "custom",
      call: function(params) {
        var selectedNodes = Sunstone.getDataTable(TAB_ID).elements();

        if (selectedNodes.length !== 1) {
          Notifier.notifyMessage(Locale.tr("Please select one (and just one) VM to export."));
          return false;
        }

        var resourceId = "" + selectedNodes[0];

        OpenNebulaVM.show({
          data : {
              id: resourceId
          },
          success: function(_, vmTemplate){
            if (
              vmTemplate &&
              vmTemplate.VM &&
              vmTemplate.VM.USER_TEMPLATE &&
              vmTemplate.VM.USER_TEMPLATE.HYPERVISOR !== "vcenter"
            ){
              Sunstone.showTab(MARKETPLACEAPPS_TAB_ID);
              Sunstone.showFormPanel(
                MARKETPLACEAPPS_TAB_ID,
                CREATE_APP_DIALOG_ID,
                "export_vm",
                function(formPanelInstance, context) {
                  formPanelInstance.setVMId(resourceId);
                  $("#marketplaceapps-tab-wizardForms #TYPE").val("vm").change();
                }
              );
            }
            else
              Notifier.notifyError(
                Locale.tr("Import error: Can't import vCenter VMs to a marketplace, only vCenter VM templates.")
                );
          },
          error: function(error){
            Notifier.onError("VM: " +error);
          }
        });
      }
    },
    "VM.backup_dialog": {
      type: "custom",
      call: function(){
        var dialog = Sunstone.getDialog(BACKUP_DIALOG_ID);
        dialog.reset();
        dialog.show();
      }
    },
    "VM.backup": {
      type: "single",
      call: OpenNebulaVM.backup,
      callback: function (req, resp) {
        Sunstone.runAction("VM.refresh");
      },
      error: function(error){
        Notifier.onError("VM: " +error);
      },
      notify: true
    },
  };

  return _actions;
});
