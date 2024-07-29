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
  var Locale = require("utils/locale"),
    Sunstone = require("sunstone"),
    Config = require("sunstone-config"),
    OpenNebulaVM = require("opennebula/vm"),
    FireedgeValidator = require("utils/fireedge-validator"),
    Notifier = require("utils/notifier");

  function _callSpice(data) {
    if (data.hasOwnProperty("id")) Sunstone.runAction("VM.startspice_action", String(data.id));
  }

  function _callVNC(data) {
    if (data.hasOwnProperty("id")) Sunstone.runAction("VM.startvnc_action", String(data.id));
  }

  function _callSaveRDP(data) {
    (data.hasOwnProperty("ip") && data.hasOwnProperty("name"))
      ? Sunstone.runAction("VM.save_rdp", data)
      : Notifier.notifyError(Locale.tr("This VM needs a nic with rdp active"));
  }

  function _callSaveWFile(data) {
    (
      data.hasOwnProperty("id") &&
      data.hasOwnProperty("hostname") &&
      data.hasOwnProperty("type") &&
      data.hasOwnProperty("port")
    )
      ? Sunstone.runAction(
        "VM.save_virt_viewer_action",
        String(data.id),
        { hostname: data.hostname, type: data.type, port: data.port }
      )
      : Notifier.notifyError(Locale.tr("Data for virt-viewer file isn't correct"));
  }

  /**
   * VMRC action
   */

  function _callVMRC(data) {
    (data.hasOwnProperty("id"))
      ? Sunstone.runAction("VM.startvmrc_action", String(data.id))
      : Notifier.notifyError(Locale.tr("VNC - Invalid action"));
  }

  /**
   * Guacamole actions
   */

  function _callGuacVNC(data) {
    (data.hasOwnProperty("id"))
      ? Sunstone.runAction("VM.startguac_action", String(data.id), "vnc")
      : Notifier.notifyError(Locale.tr("VNC - Invalid action"));
  }

  function _callGuacRDP(data) {
    (data.hasOwnProperty("id"))
      ? Sunstone.runAction("VM.startguac_action", String(data.id), "rdp")
      : Notifier.notifyError(Locale.tr("RDP - Invalid action"));
  }

  function _callGuacSSH(data) {
    (data.hasOwnProperty("id"))
      ? Sunstone.runAction("VM.startguac_action", String(data.id), "ssh")
      : Notifier.notifyError(Locale.tr("SSH - Invalid action"));
  }

  /**
   * Render actions
   */

  function buttonVnc(id = "") {
    var icon = $("<i>", { class: "fas fa-desktop" });

    var button = $("<button>", {
      title: "vnc",
      class: "vnc remote-vm",
      "data-id": id
    });

    return $("<div>").append(button.append(icon)).html();
  }

  function buttonWFile(id = "", wfile = {}) {
    var icon = $("<i>", { class: "fas fa-file-code" });

    var button = $("<button>", {
      title: "w-file",
      class: "w-file remote-vm",
      "data-id": id,
      "data-hostname": wfile.hostname,
      "data-type": wfile.type,
      "data-port": wfile.port
    });

    return $("<div>").append(button.append(icon)).html();
  }

  function buttonSSH(id = "") {
    var icon = $("<i>", { class: "fas fa-terminal" });

    var button = $("<button>", {
      title: "ssh",
      class: "ssh remote-vm",
      "data-id": id
    });

    return $("<div>").append(button.append(icon)).html();
  }

  function buttonSpice(id = "") {
    var icon = $("<i>", { class: "fas fa-desktop" });

    var button = $("<button>", {
      title: "spice",
      class: "spice remote-vm",
      "data-id": id
    });

    return $("<div>").append(button.append(icon)).html();
  }

  function dropdownRDP(id = "", ip = "", vm = {}) {
    var icon = $("<i>", { class: "fab fa-windows" });
    var dropdownButton = $("<button>", { title:"RDP menu", class: "remote-vm" });

    var dropdownMenu = $("<ul>", {
      class: "dropdown-menu-css"
    });

    var buttonsEnabled = [];

    Config.isTabActionEnabled("vms-tab", "VM.rdp") &&
      buttonsEnabled.push($("<li>").append(buttonRDP(id)));

    Config.isTabActionEnabled("vms-tab", "VM.save_rdp") &&
      buttonsEnabled.push($("<li>").append(buttonSaveRDP(ip, vm)));

    if (buttonsEnabled.length === 0) return "";

    var menu = $("<ul>", { class: "menu" }).append(buttonsEnabled);

    return $("<div>").append(
      dropdownMenu.append(
        [
          $("<li>").append(dropdownButton.append(icon)),
          $("<li>", {class:"menu-hide"}).append(menu)
        ]
      )
    ).html();
  }

  function buttonRDP(id = "") {
    var icon = $("<i>", { class: "fas fa-desktop" })
      .css({ width: "2em", "text-align": "center" });

    var text = $("<span>", { text: Locale.tr("HTML") });
    var button = $("<a>", { class: "rdp", "data-id": id });

    return $("<div>").append(button.append([icon, text])).html();
  }

  function buttonSaveRDP(ip = "", vm = {}) {
    var icon = $("<i>", { class: "fas fa-file" })
      .css({ width: "2em", "text-align": "center" });

    var text = $("<span>", { text: Locale.tr("Client") });
    var button = $("<a>", { class: "save-rdp", "data-name": vm.NAME, "data-ip": ip });

    var username, password;

    if (vm.TEMPLATE && vm.TEMPLATE.CONTEXT) {
      var context = vm.TEMPLATE.CONTEXT;
      for (var prop in context) {
        var propUpperCase = String(prop).toUpperCase();
        (propUpperCase === "USERNAME") && (username = context[prop]);
        (propUpperCase === "PASSWORD") && (password = context[prop]);
      }
    }

    username && button.attr("data-username", username);
    password && button.attr("data-password", password);

    return $("<div>").append(button.append([icon, text])).html();
  }

  function _renderActionsHtml(vm) {
    var actions = "";

    if (OpenNebulaVM.isVNCSupported(vm)) {
      actions += buttonVnc(vm.ID);
    }
    else if (OpenNebulaVM.isSPICESupported(vm)) {
      actions += buttonSpice(vm.ID);
    }

    var wFile = OpenNebulaVM.isWFileSupported(vm);
    actions +=  wFile ? buttonWFile(vm.ID, wFile) : "";

    var rdpIp = OpenNebulaVM.isConnectionSupported(vm, "rdp");
    actions += rdpIp ? dropdownRDP(vm.ID, rdpIp, vm) : "";

    var ssh = OpenNebulaVM.isConnectionSupported(vm, "ssh");
    actions += ssh && Config.isTabActionEnabled("vms-tab", "VM.rdp") ? buttonSSH(vm.ID) : "";

    if(config &&
      config["system_config"] &&
      config["system_config"]["allow_vnc_federation"] &&
      config["system_config"]["allow_vnc_federation"] === "no" &&
      config["id_own_federation"] &&
      config["zone_id"] &&
      config["id_own_federation"] !== config["zone_id"])
    {
      actions = "";
    }

    return "<div style='display: flex; align-items: end; gap:5px'>"+actions+"</div>";
  }

  function _bindActionsToContext(context) {
    $(context)
      .off("click", ".w-file")
      .on("click", ".w-file", function(evt) {
        evt.preventDefault();
        _callSaveWFile($(this).data());
        evt.stopPropagation();
      })
      .off("click", ".save-rdp")
      .on("click", ".save-rdp", function(evt) {
        evt.preventDefault();
        _callSaveRDP($(this).data());
        evt.stopPropagation();
      })
      .off("click", ".rdp")
      .on("click", ".rdp", function(evt) {
      evt.preventDefault();
      _callGuacRDP($(this).data());
        evt.stopPropagation();
      })
      .off("click", ".ssh")
      .on("click", ".ssh", function(evt) {
        evt.preventDefault();
        _callGuacSSH($(this).data());
        evt.stopPropagation();
      })
      .off("click", ".spice")
      .on("click", ".spice", function(evt) {
        evt.preventDefault();
        _callSpice($(this).data());
        evt.stopPropagation();
      })
      .off("click", ".vnc")
      .on("click", ".vnc", function(evt) {
        evt.preventDefault();
        var data = $(this).data();

        // Get VM show info to get USER_TEMPLATE.HYPERVISOR
        OpenNebulaVM.promiseGetVm({
          id: data.id,
          success: function(response) {
            FireedgeValidator.validateFireedgeToken(
              function() {
                  OpenNebulaVM.isVMRCSupported(response) ? _callVMRC(data) : _callGuacVNC(data);
              },
              function() {
                _callVNC(data);
              }
            );
          }
        });

        evt.stopPropagation();
      });
  }

  /**
   *
   * @param {Object} response Callback response with the token and info
   * @param {Object} options
   * @returns
   */
   function _getLink(response, options){
    options = $.extend({
      host: undefined,
      port: undefined,
      protocol: "http:",
      connnection_type: "",
      extra_path: "",
      extra_params: []
    }, options);

    var paramInfo = config && config.system_config && !config.system_config.disable_guacamole_info_header && response.info && "info=" + response.info;

    var params = options.extra_params.concat([
      response.token && "token=" + response.token,
      paramInfo
    ]).filter(Boolean);

    var params_query = params.length? "?" + params.join("&") : ""

    var endpoint = new URL(window.location.href);
    var websocketProtocol = options.protocol === "https:" ? "wss:" : "ws:";

    var websocket = websocketProtocol + "//";

    if (options.host && options.port)
      websocket += options.host + ":" + options.port;
    else if (options.port)
      websocket += endpoint.hostname + ":" + options.port;
    else if (options.host)
      websocket += options.host;
    else 
      websocket += endpoint.host;

    websocket += options.extra_path + params_query;

    var encoded_socket = btoa(websocket);

    var link = endpoint.origin + "/" + options.connnection_type + "?socket=" + encoded_socket;

    return link;
  }

  return {
    "callSpice": _callSpice,
    "callVNC": _callVNC,
    "callSaveRDP": _callSaveRDP,
    "callSaveWFile": _callSaveWFile,
    "callVMRC": _callVMRC,
    "callGuacVNC": _callGuacVNC,
    "callGuacSSH": _callGuacSSH,
    "callGuacRDP": _callGuacRDP,
    "callGuacVNC": _callGuacVNC,
    "renderActionsHtml": _renderActionsHtml,
    "bindActionsToContext": _bindActionsToContext,
    "getLink": _getLink
  };
});
