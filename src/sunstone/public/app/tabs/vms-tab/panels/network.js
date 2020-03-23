/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
  var Config = require("sunstone-config");
  var Sunstone = require("sunstone");
  var Humanize = require("utils/humanize");
  var Notifier = require("utils/notifier");
  var Graphs = require("utils/graphs");
  require("flot.navigate");
  require("flot.canvas");
  var StateActions = require("../utils/state-actions");
  var OpenNebulaVM = require("opennebula/vm");
  var SecGroupsCommon = require("tabs/secgroups-tab/utils/common");
  var Navigation = require("utils/navigation");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./network/panelId");
  var ATTACH_NIC_DIALOG_ID = require("../dialogs/attach-nic/dialogId");
  var CONFIRM_DIALOG_ID = require("utils/dialogs/generic-confirm/dialogId");
  var RESOURCE = "VM";
  var XML_ROOT = "VM";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.panelId = PANEL_ID;
    this.title = Locale.tr("Network");
    this.icon = "fa-globe";

    this.element = info[XML_ROOT];

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;
  Panel.prototype.onShow = _onShow;
  Panel.prototype.getState = _getState;
  Panel.prototype.setState = _setState;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var that = this;
    var html = "<form id=\"tab_network_form\" vmid=\"" + that.element.ID + "\" >\
        <div class=\"row\">\
        <div class=\"large-12 columns\">\
           <table class=\"nics_table no-hover info_table dataTable\">\
             <thead>\
               <tr>\
                  <th></th>\
                  <th>" + Locale.tr("ID") + "</th>\
                  <th>" + Locale.tr("Network") + "</th>\
                  <th>" + Locale.tr("IP") + "</th>\
                  <th>" + Locale.tr("MAC") + "</th>\
                  <th>" + Locale.tr("PCI address") + "</th>\
                  <th>" + Locale.tr("IPv6 ULA") + "</th>\
                  <th>" + Locale.tr("IPv6 Global") + "</th>\
                  <th colspan=\"\">" + Locale.tr("Actions") + "</th>\
                  <th>"                 ;

    if (Config.isTabActionEnabled("vms-tab", "VM.attachnic")) {
      if (StateActions.enabledStateAction("VM.attachnic",
            that.element.STATE,
            that.element.LCM_STATE) &&
          OpenNebulaVM.isNICAttachSupported(that.element)) {
        html += "\
             <button id=\"attach_nic\" class=\"button small success right radius\" >" + Locale.tr("Attach nic") + "</button>";
      } else {
        html += "\
             <button id=\"attach_nic\" class=\"button small success right radius\" disabled=\"disabled\">" + Locale.tr("Attach nic") + "</button>";
      }
    }

    html += "</th>\
                </tr>\
             </thead>\
             <tbody>\
             </tbody>\
            </table>\
          </div>\
        </div>"      ;

    var externalNetworkAttrs = OpenNebulaVM.retrieveExternalNetworkAttrs(that.element);
    if (!$.isEmptyObject(externalNetworkAttrs)) {
      html += "<div class=\"row\">" +
        "<div class=\"large-12 columns\">" +
         "<table class=\"dataTable\">" +
            "<thead>" +
              "<tr>" +
                 "<th colspan=2>" + Locale.tr("Network Monitoring Attributes") + "</th>" +
              "</tr>" +
            "</thead>" +
            "<tbody>";

      $.each(externalNetworkAttrs, function(key, value) {
        html += "<tr>" +
           "<td>" + key + "</td>" +
           "<td>" + value + "</td>" +
          "</tr>";
      });

      html += "</tbody>" +
            "</table>" +
          "</div>" +
        "</div>";
    }

    // Do not show statistics for not hypervisors that do not gather net data
    if (OpenNebulaVM.isNICGraphsSupported(that.element)) {
      html += "\
          <div class=\"row\">\
              <div class=\"medium-6 columns\">\
                <div class=\"row\">\
                  <span>" + Locale.tr("NET RX") + "</span3>\
                </div>\
                <div class=\"row\">\
                  <div class=\"large-12 columns centered graph\" id=\"vm_net_rx_graph\" style=\"height: 100px;\">\
                    <span  id=\"provision_dashboard_total\" style=\"font-size:80px\">\
                      <i class=\"fas fa-spinner fa-spin\"></i>\
                    </span>\
                  </div>\
                </div>\
                <div class=\"row graph_legend\">\
                  <div class=\"large-12 columns centered\" id=\"vm_net_rx_legend\">\
                  </div>\
                </div>\
              </div>\
              <div class=\"medium-6 columns\">\
                <div class=\"row\">\
                  <span>" + Locale.tr("NET TX") + "</span3>\
                </div>\
                <div class=\"row\">\
                  <div class=\"large-12 columns centered graph\" id=\"vm_net_tx_graph\" style=\"height: 100px;\">\
                    <span  id=\"provision_dashboard_total\" style=\"font-size:80px\">\
                      <i class=\"fas fa-spinner fa-spin\"></i>\
                    </span>\
                  </div>\
                </div>\
                <div class=\"row graph_legend\">\
                  <div class=\"large-12 columns centered\" id=\"vm_net_tx_legend\">\
                  </div>\
                </div>\
              </div>\
              <div class=\"medium-6 columns\">\
                <div class=\"row\">\
                  <span>" + Locale.tr("NET DOWNLOAD SPEED") + "</span3>\
                </div>\
                <div class=\"row\">\
                  <div class=\"large-12 columns centered graph\" id=\"vm_net_rx_speed_graph\" style=\"height: 100px;\">\
                    <span  id=\"provision_dashboard_total\" style=\"font-size:80px\">\
                      <i class=\"fas fa-spinner fa-spin\"></i>\
                    </span>\
                  </div>\
                </div>\
                <div class=\"row graph_legend\">\
                  <div class=\"large-12 columns centered\" id=\"vm_net_rx_speed_legend\">\
                  </div>\
                </div>\
              </div>\
              <div class=\"medium-6 columns\">\
                <div class=\"row\">\
                  <span>" + Locale.tr("NET UPLOAD SPEED") + "</span3>\
                </div>\
                <div class=\"row\">\
                  <div class=\"large-12 columns centered graph\" id=\"vm_net_tx_speed_graph\" style=\"height: 100px;\">\
                    <span  id=\"provision_dashboard_total\" style=\"font-size:80px\">\
                      <i class=\"fas fa-spinner fa-spin\"></i>\
                    </span>\
                  </div>\
                </div>\
                <div class=\"row graph_legend\">\
                  <div class=\"large-12 columns centered\" id=\"vm_net_tx_speed_legend\">\
                  </div>\
                </div>\
              </div>\
          </div>\
        </form>";
    }

    return html;
  }

  function _ipTr(nic, attr){
    var v = "--";
    if(nic && attr){
      if(!Array.isArray(attr)){
        attr = [attr];
      }
      attr.map(function(attr){
        if(nic[attr]){
          v = nic[attr];
          if (nic["VROUTER_"+attr] != undefined){
            v += ("<br/>" + nic["VROUTER_"+attr] + Locale.tr(" (VRouter)"));
          }
        }
      });
    }
    return v;
  }

  function _setup(context) {
    var that = this;

    var nics = [];
    var nics_names = [];
    var alias = [];
    var distinct = function(value, index, self){
      return self.indexOf(value)===index;
    };

    if ($.isArray(that.element.TEMPLATE.NIC)){
      nics = that.element.TEMPLATE.NIC;
    } else if (!$.isEmptyObject(that.element.TEMPLATE.NIC)){
      nics = [that.element.TEMPLATE.NIC];
    }


    if ($.isArray(that.element.TEMPLATE.NIC_ALIAS)){
      alias = that.element.TEMPLATE.NIC_ALIAS;
    } else if (!$.isEmptyObject(that.element.TEMPLATE.NIC_ALIAS)){
      alias = [that.element.TEMPLATE.NIC_ALIAS];
    }

    var pcis = [];

    if ($.isArray(that.element.TEMPLATE.PCI)){
      pcis = that.element.TEMPLATE.PCI;
    } else if (!$.isEmptyObject(that.element.TEMPLATE.PCI)){
      pcis = [that.element.TEMPLATE.PCI];
    }

    $.each(pcis, function(){
      if(this.NIC_ID != undefined){
        nics.push(this);
      }
    });

    var nic_dt_data = [];
    nics = nics.filter(distinct);
    if (nics.length) {
      for (var i = 0; i < nics.length; i++) {
        var nic = nics[i];
        nics_names.push(
          { 
            NAME: nic.NAME, 
            IP: nic.IP, 
            NET: nic.NETWORK, 
            ID: nic.NIC_ID 
          }
        );

        var is_pci = (nic.PCI_ID != undefined);

        var actions = "";
        // Attach / Detach
        if (!is_pci){
          if ( 
            that.element.STATE == OpenNebulaVM.STATES.ACTIVE &&
            that.element.LCM_STATE == OpenNebulaVM.LCM_STATES.HOTPLUG_NIC
          ) {
            actions = Locale.tr("attach/detach in progress");
          } else {
            if ( 
              Config.isTabActionEnabled("vms-tab", "VM.detachnic") &&
              StateActions.enabledStateAction("VM.detachnic", that.element.STATE, that.element.LCM_STATE)
            ) {
              var icon = $("<i/>",{class:"fas fa-times"});
              var anchorAttributes = {class: "detachnic"}
              var anchor = $("<a/>",anchorAttributes).append(icon);
              actions += anchor.get(0).outerHTML; //"<a href=\"VM.detachnic\" class=\"detachnic PEPE\" ><i class=\"fas fa-times\"/></a>";
            }
          }
        }

        var secgroups = [];

        var nic_secgroups = {};
        if (!$.isEmptyObject(nic.SECURITY_GROUPS)) {
          $.each(nic.SECURITY_GROUPS.split(","), function() {
            nic_secgroups[this] = true;
          });
        }

        var rules = that.element.TEMPLATE.SECURITY_GROUP_RULE;

        if (rules != undefined) {
          if (!$.isArray(rules)) {
            rules = [rules];
          }

          $.each(rules, function() {
            if (nic_secgroups[this.SECURITY_GROUP_ID]) {
              secgroups.push(this);
            }
          });
        }

        var pci_address = is_pci ? nic.ADDRESS : "";

        var ipStr = "IP";
        if (nic.IP6 !== undefined){
          ipStr = "IP6";
        }

        var nic_alias = [];
        var alias_ids = [];

        if (nic.ALIAS_IDS) {
            alias_ids = nic.ALIAS_IDS.split(",");
        }

        for(var j = 0; j < alias.length; j++) {
            if (alias_ids.length > 0 && alias_ids.includes(alias[j].NIC_ID)) {
                alias[j].ACTIONS = actions;

                nic_alias.push(alias[j]);
            }
        }
        nic_dt_data.push({
          NIC_ID : nic.NIC_ID,
          NETWORK : Navigation.link(nic.NETWORK, "vnets-tab", nic.NETWORK_ID),
          IP : _ipTr(nic, [ipStr, "IP"]),
          NIC_ALIAS : nic_alias,
          MAC : nic.MAC,
          PCI_ADDRESS: pci_address,
          IP6_ULA : _ipTr(nic, "IP6_ULA"),
          IP6_GLOBAL : _ipTr(nic, "IP6_GLOBAL"),
          ACTIONS : actions,
          SECURITY_GROUP_RULES : secgroups
        });
      }
    }

    var nics_table = $("#tab_network_form .nics_table", context).DataTable({
      "bDeferRender": true,
      "data": nic_dt_data,
      "columns": [
        {
          "class":          "open-control",
          "orderable":      false,
          "data":           null,
          "defaultContent": "<span class=\"fas fa-fw fa-chevron-down\"></span>"
        },
        {"data": "NIC_ID",     "defaultContent": ""},
        {"data": "NETWORK",    "defaultContent": ""},
        {"data": "IP",         "defaultContent": "", "class": "nowrap"},
        {"data": "MAC",        "defaultContent": ""},
        {"data": "PCI_ADDRESS","defaultContent": ""},
        {"data": "IP6_ULA",    "defaultContent": "", "class": "nowrap"},
        {"data": "IP6_GLOBAL", "defaultContent": "", "class": "nowrap"},
        {"data": "ACTIONS",    "defaultContent": "", "orderable": false, "className": "text-center"},
        {"defaultContent": "", "orderable": false}
      ],

      "fnRowCallback": function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {

        if (aData.SECURITY_GROUP_RULES == undefined ||
            aData.SECURITY_GROUP_RULES.length == 0) {

          $("td.open-control", nRow).html("").removeClass("open-control");
        }

        $(nRow).attr("nic_id", aData.NIC_ID);
      }
    });
    
    $("#tab_network_form .nics_table", context).dataTable().fnSort([[1, "asc"]]);

    // Add event listener for opening and closing each NIC row details
    context.off("click", "#tab_network_form .nics_table td.open-control");
    context.on("click", "#tab_network_form .nics_table td.open-control", function () {
      var row = $(this).closest("table").DataTable().row($(this).closest("tr"));
      if (row.child.isShown()) {
        row.child.hide();
        $(this).children("span").addClass("fa-chevron-down");
        $(this).children("span").removeClass("fa-chevron-up");
      } else {
        if(row.data().NIC_ALIAS.length > 0) {
            var html = "";

            $.each(row.data().NIC_ALIAS, function(index, elem) {
              var new_div = "<div id=alias_" + this.NIC_ID + " style=\"margin-left: 40px; margin-bottom: 5px\"><b> - Alias-" + this.ALIAS_ID + ":</b>";

              if(!!this.IP) {
                new_div += "&nbsp;&nbsp;&nbsp;" + this.IP;
              }
              if(!!this.IP6) {
                new_div += "&nbsp;&nbsp;&nbsp;" + this.IP6;
              }
              new_div += "&nbsp;&nbsp;&nbsp;" + this.MAC;
              if(!!this.IP6_ULA) {
                new_div += "&nbsp;&nbsp;&nbsp;<b>ULA:</b>&nbsp;" + this.IP6_ULA;
              }
              if(!!this.IP6_GLOBAL) {
                new_div += "&nbsp;&nbsp;&nbsp;<b>Global:</b>&nbsp;" + this.IP6_GLOBAL;
              }
              new_div += "&nbsp;&nbsp;&nbsp;" + this.ACTIONS + "</div>";

              html += new_div;

              if (Config.isTabActionEnabled("vms-tab", "VM.detachnic")) {
                context.off("click", ".detachnic");
                context.on("click", ".detachnic", {element_id: that.element.ID}, detach_alias);
              }
            });
          } else {
              html = "";
          }

        html += "<div style=\"padding-left: 30px;\">\
              <table class=\"dataTable\">\
                <thead>\
                  <tr>\
                    <th colspan=\"2\">" + Locale.tr("Security Group") + "</th>\
                    <th>" + Locale.tr("Protocol") + "</th>\
                    <th>" + Locale.tr("Type") + "</th>\
                    <th>" + Locale.tr("Range") + "</th>\
                    <th>" + Locale.tr("Network") + "</th>\
                    <th>" + Locale.tr("ICMP Type") + "</th>\
                  </tr>\
                <thead>\
                <tbody>"            ;

        $.each(row.data().SECURITY_GROUP_RULES, function(index, elem) {
          var rule_st = SecGroupsCommon.sgRuleToSt(this);

          var new_tr = "<tr>\
                  <td>" + this.SECURITY_GROUP_ID + "</td>\
                  <td>" + Navigation.link(this.SECURITY_GROUP_NAME, "secgroups-tab", this.SECURITY_GROUP_ID) + "</td>\
                  <td>" + rule_st.PROTOCOL + "</td>\
                  <td>" + rule_st.RULE_TYPE + "</td>\
                  <td>" + rule_st.RANGE + "</td>\
                  <td>" + rule_st.NETWORK + "</td>\
                  <td>" + rule_st.ICMP_TYPE + "</td>\
                </tr>";

          html += new_tr;
        });

        row.child(html).show();
        $(this).children("span").removeClass("fa-chevron-down");
        $(this).children("span").addClass("fa-chevron-up");
        $.each(row.data().NIC_ALIAS, function(index, elem) {
            $("#alias_" + this.NIC_ID).attr("nic_id", this.NIC_ID);
        });
      }
    });

    if (Config.isTabActionEnabled("vms-tab", "VM.attachnic")) {
      context.off("click", "#attach_nic");
      context.on("click", "#attach_nic", function() {
        var dialog = Sunstone.getDialog(ATTACH_NIC_DIALOG_ID);
        dialog.setElement(that.element);
        dialog.setNicsNames(nics_names);
        dialog.show();
        return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.detachnic")) {
      context.off("click", ".detachnic");
      context.on("click", ".detachnic", function() {
        var nic_id = $(this).parents("tr").attr("nic_id");

        Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
          //header :
          headerTabId: TAB_ID,
          body : Locale.tr("This will detach the nic immediately"),
          //question :
          submit : function(){
            Sunstone.runAction("VM.detachnic", that.element.ID, nic_id);
            return false;
          }
        });

        Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
        Sunstone.getDialog(CONFIRM_DIALOG_ID).show();

        return false;
      });
    }
  }

  function detach_alias(event) {
    var nic_id = $(this).parent().attr("nic_id");
    if(!nic_id){
      var nic_id = $(this).parents("tr").attr("nic_id");
    }
    var element_id = event.data.element_id;

    Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
      //header :
      headerTabId: TAB_ID,
      body : Locale.tr("This will detach the alias immediately"),
      //question :
      submit : function(){
        Sunstone.runAction("VM.detachnic", element_id, nic_id);
        return false;
      }
    });

    Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
    Sunstone.getDialog(CONFIRM_DIALOG_ID).show();

    return false;
  }

  function _onShow(context) {
    var that = this;
    if (OpenNebulaVM.isNICGraphsSupported(that.element)) {
      OpenNebulaVM.monitor({
        data: {
          id: that.element.ID,
          monitor: {
            monitor_resources : "NETTX,NETRX"
          }
        },
        success: function(req, response) {
          var vmGraphs = [
            {
              labels : Locale.tr("Network reception"),
              monitor_resources : "NETRX",
              humanize_figures : true,
              convert_from_bytes : true,
              div_graph : $("#vm_net_rx_graph")
            },
            {
              labels : Locale.tr("Network transmission"),
              monitor_resources : "NETTX",
              humanize_figures : true,
              convert_from_bytes : true,
              div_graph : $("#vm_net_tx_graph")
            },
            {
              labels : Locale.tr("Network reception speed"),
              monitor_resources : "NETRX",
              humanize_figures : true,
              convert_from_bytes : true,
              y_sufix : "B/s",
              derivative : true,
              div_graph : $("#vm_net_rx_speed_graph")
            },
            {
              labels : Locale.tr("Network transmission speed"),
              monitor_resources : "NETTX",
              humanize_figures : true,
              convert_from_bytes : true,
              y_sufix : "B/s",
              derivative : true,
              div_graph : $("#vm_net_tx_speed_graph")
            }
          ];

          for (var i = 0; i < vmGraphs.length; i++) {
            Graphs.plot(response, vmGraphs[i]);
            }
          },
        error: Notifier.onError
      });
    }
  }

  function _getState(context) {
    var state = {
      openNicsDetails : []
    };

    $.each($("#tab_network_form .nics_table .fa-chevron-up", context), function(){
      state.openNicsDetails.push($(this).closest("tr").attr("nic_id"));
    });

    return state;
  }
  function _setState(state, context) {
    var that = this;

    $.each(state["openNicsDetails"], function(){
      $("#tab_network_form .nics_table tr[nic_id=\""+this+"\"] td.open-control", context).click();
    });
  }
});
