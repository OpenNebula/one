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

  require("flot.navigate");
  require("flot.canvas");
  var Config = require("sunstone-config");
  var Graphs = require("utils/graphs");
  var Locale = require("utils/locale");
  var Navigation = require("utils/navigation");  
  var Notifier = require("utils/notifier");
  var OpenNebulaVM = require("opennebula/vm");
  var SecGroupsCommon = require("tabs/secgroups-tab/utils/common");
  var StateActions = require("../utils/state-actions");
  var Sunstone = require("sunstone");
  var Tips = require('utils/tips');

  /*
    TEMPLATES
  */
  var TemplateSGDatatable = require("hbs!./network/network_sg_datatable");
  var TemplateSGRow = require("hbs!./network/network_sg_row");
  var TemplateSG = require("hbs!./network/network_sg");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./network/panelId");
  var ATTACH_NIC_DIALOG_ID = require("../dialogs/attach-nic/dialogId");
  var UPDATE_NIC_DIALOG_ID = require("../dialogs/update-nic/dialogId");
  var ATTACH_SG_DIALOG_ID = require("../dialogs/attach-sg/dialogId");
  var CONFIRM_DIALOG_ID = require("utils/dialogs/generic-confirm/dialogId");
  var XML_ROOT = "VM";

  var isFirecracker = function(context) {
    return context && 
    context.element && 
    context.element.USER_TEMPLATE && 
    context.element.USER_TEMPLATE.HYPERVISOR && 
    String(context.element.USER_TEMPLATE.HYPERVISOR).toLowerCase() === "firecracker"
  }

  var validateAction = function(context, action) {
    return (action && context && context.element && context.element.STATE && context.element.LCM_STATE)
      ? StateActions.enabledStateAction(action, context.element.STATE, context.element.LCM_STATE) : false;
  }

  var isPowerOff = function(context) {
    return (context && context.element && context.element.STATE == OpenNebulaVM.STATES.POWEROFF) ? true : false
  }

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
           <table id=\"vm" + that.element.ID + "_networktab_datatable\" class=\"nics_table no-hover info_table dataTable\">\
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
                  <th>";

    if (Config.isTabActionEnabled("vms-tab", "VM.attachnic")) {
      var attachButton = function(enable){
        var isDisabled = enable ?  "" : "disabled='disabled'";
        return "<button id='attach_nic' class='button small success right radius' "+isDisabled+">" + Locale.tr("Attach nic") + "</button>";
      };

      if (validateAction(that, "VM.attachnic") && OpenNebulaVM.isNICAttachSupported(that.element)) {
        html += (isFirecracker(that)) ? attachButton(isPowerOff(that)) : attachButton(true);
      } else {
        html += attachButton(false);
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

  function _ipTr(nic, attributes) {
    var ips = [];
    var defaultValue = '--'

    if (!nic || !attributes) return defaultValue
    
    if (!Array.isArray(attributes)) {
      attributes = [attributes];
    }

    attributes.map(function(attribute) {
      if (nic[attribute]) {
        // filter attributes with dual value: YES or <IP>
        if (String(nic[attribute]).toLowerCase() !== 'yes') {
          ips.push(nic[attribute])
        }

        if (nic["VROUTER_" + attribute] !== undefined) {
          ips.push(nic["VROUTER_" + attribute] + Locale.tr(" (VRouter)"));
        }
      }
    });

    return ips.length === 0 ? defaultValue : ips.join('<br/>');
  }

  function getNicActions(context, is_alias = false, is_pci = false){
    var actions = "";
    if ( 
      context.element.STATE == OpenNebulaVM.STATES.ACTIVE && (
        context.element.LCM_STATE == OpenNebulaVM.LCM_STATES.HOTPLUG_NIC ||
        context.element.LCM_STATE == OpenNebulaVM.LCM_STATES.HOTPLUG_NIC_POWEROFF
      )
    ) {
      actions = Locale.tr("attach/detach in progress");
    } else {

      if(Config.isTabActionEnabled("vms-tab", "VM.detachnic")){
        var icon = $("<i/>",{class:"fas fa-times"});
        var anchorAttributes = {class: "detachnic", href: "VM.detachnic"};
        var anchor = $("<a/>",anchorAttributes).append(icon);
        actions +=  (validateAction(context,"VM.detachnic"))
          ? (isFirecracker(context)
            ? (isPowerOff(context) ? anchor.get(0).outerHTML : "")
            : anchor.get(0).outerHTML
            )
          : "";
      }

      if (!is_pci && !is_alias){
        if (Config.isTabActionEnabled("vms-tab", "VM.updatenic")){
          var icon = $("<i/>",{class:"fas fa-edit"});
          var anchorAttributes = {class: "updatenic", style: "padding-left: 1em"};
          var anchor = $("<a/>",anchorAttributes).append(icon); 
          actions +=  (validateAction(context,"VM.updatenic"))
            ? (isFirecracker(context)
              ? (isPowerOff(context) ? anchor.get(0).outerHTML : "")
              : anchor.get(0).outerHTML
              )
            : "";
        }
      
        if(Config.isTabActionEnabled("vms-tab", "VM.attachsg")){
          var icon = $("<i/>",{class:"fas fa-shield-alt"});
          var anchorAttributes = {class: "attachsg", style: "padding-left: 1em"};
          var tip = "<span class=\"tip\">" + Locale.tr("Attach security group") + "</span>"
          var anchor = $("<a/>",anchorAttributes).append(icon);
          actions +=  (validateAction(context,"VM.attachsg"))
            ? (isFirecracker(context)
              ? (isPowerOff(context) ? anchor.get(0).outerHTML : "")
              : anchor.get(0).outerHTML
              )
            : "";
        }
      }
    }
    return actions
  }


  function _setup(context) {
    var that = this;

    var nics = [];
    var nics_names = [];
    var alias = [];
    var distinct = function(value, index, self){
      return self.indexOf(value)===index;
    };

    if (Array.isArray(that.element.TEMPLATE.NIC)){
      nics = that.element.TEMPLATE.NIC;
    } else if (!$.isEmptyObject(that.element.TEMPLATE.NIC)){
      nics = [that.element.TEMPLATE.NIC];
    }


    if (Array.isArray(that.element.TEMPLATE.NIC_ALIAS)){
      alias = that.element.TEMPLATE.NIC_ALIAS;
    } else if (!$.isEmptyObject(that.element.TEMPLATE.NIC_ALIAS)){
      alias = [that.element.TEMPLATE.NIC_ALIAS];
    }

    var pcis = [];

    if (Array.isArray(that.element.TEMPLATE.PCI)){
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

        var secgroups = [];

        var nic_secgroups = {};
        if (!$.isEmptyObject(nic.SECURITY_GROUPS)) {
          $.each(nic.SECURITY_GROUPS.split(","), function() {
            nic_secgroups[this] = true;
          });
        }

        var rules = that.element.TEMPLATE.SECURITY_GROUP_RULE;

        if (rules != undefined) {
          if (!Array.isArray(rules)) {
            rules = [rules];
          }

          $.each(rules, function() {
            if (nic_secgroups[this.SECURITY_GROUP_ID]) {
              secgroups.push(this);
            }
          });
        }

        var pci_address = is_pci ? nic.ADDRESS : "";

        var ipAttribute = "IP";
        if (nic.IP6 !== undefined){
          ipAttribute = "IP6";
        }

        var nic_alias = [];
        var alias_ids = [];

        if (nic.ALIAS_IDS) {
            alias_ids = nic.ALIAS_IDS.split(",");
        }

        for(var j = 0; j < alias.length; j++) {
            if (alias_ids.length > 0 && alias_ids.includes(alias[j].NIC_ID)) {
                alias[j].ACTIONS = getNicActions(that, true, is_pci);

                nic_alias.push(alias[j]);
            }
        }
        nic_dt_data.push({
          NIC_ID : nic.NIC_ID,
          NETWORK : Navigation.link(nic.NETWORK, "vnets-tab", nic.NETWORK_ID),
          IP : _ipTr(nic, [ipAttribute, 'EXTERNAL_IP']),
          NIC_ALIAS : nic_alias,
          MAC : nic.MAC,
          PCI_ADDRESS: pci_address,
          IP6_ULA : _ipTr(nic, "IP6_ULA"),
          IP6_GLOBAL : _ipTr(nic, "IP6_GLOBAL"),
          ACTIONS : getNicActions(that, false, is_pci),
          SECURITY_GROUP_RULES : secgroups
        });
      }
    }

    $("#tab_network_form .nics_table", context).DataTable({
      "stateSave": true,
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

          $.each(row.data().NIC_ALIAS, function() {
              var new_div = "<div id=alias_" + this.NIC_ID + " style=\"margin-left: 40px; margin-bottom: 5px\">" +
                            "<b>" + "- Alias-" + this.ALIAS_ID + ":" + "</b>";

              if (this.IP !== undefined) {
                new_div += "&nbsp;&nbsp;&nbsp;" + this.IP;
              }

              if (
                this.EXTERNAL_IP !== undefined &&
                !['yes', 'no'].includes(String(this.EXTERNAL_IP).toLowerCase())
              ) {
                new_div += "&nbsp;&nbsp;&nbsp;" + this.EXTERNAL_IP;
              }

              if (this.IP6 !== undefined) {
                new_div += "&nbsp;&nbsp;&nbsp;" + this.IP6;
              }

              new_div += "&nbsp;&nbsp;&nbsp;" + this.MAC;

              if (this.IP6_ULA !== undefined) {
                new_div += "&nbsp;&nbsp;&nbsp;<b>ULA</b>&nbsp;" + this.IP6_ULA;
              }

              if (this.IP6_GLOBAL !== undefined) {
                new_div += "&nbsp;&nbsp;&nbsp;<b>Global</b>&nbsp;" + this.IP6_GLOBAL;
              }

              new_div += "&nbsp;&nbsp;&nbsp;" + this.ACTIONS + "</div>";

              html += new_div;

              if (Config.isTabActionEnabled("vms-tab", "VM.detachnic")) {
                context.off("click", ".detachnic");
                context.on("click", ".detachnic", {element_id: that.element.ID}, detach_alias);
              }

              if (Config.isTabActionEnabled("vms-tab", "VM.attachsg")) {
                context.off("click", ".attachsg");
                context.on("click", ".attachsg", {element_id: that.element.ID}, attach_sg);
              }
          });
        } else {
            html = "";
        }

        var securityGroupHTML = "";

        var sg_rules_array = row.data().SECURITY_GROUP_RULES;

        // Group array by security group id
        var security_groups = sg_rules_array.reduce(
          function(rules, current_rule) {
            (rules[current_rule["SECURITY_GROUP_ID"]] = rules[current_rule["SECURITY_GROUP_ID"]] || []).push(current_rule);
            return rules;
          },
          {}
        );
        
        for (var sg_id in security_groups){
          var sg_rules = "";
          
          $.each(security_groups[sg_id], function(_, _) {
            var rule_st = SecGroupsCommon.sgRuleToSt(this);

            var values = {
              'rule_protocol': rule_st.PROTOCOL,
              'rule_type': rule_st.RULE_TYPE,
              'rule_range': rule_st.RANGE,
              'rule_network': rule_st.NETWORK,
              'rule_icmp_type': rule_st.ICMP_TYPE
            }

            sg_rules += TemplateSGRow(values);

          });

          securityGroupHTML += TemplateSGDatatable({
            'sg_id': sg_id,
            'sg_name': Navigation.link(security_groups[sg_id][0].SECURITY_GROUP_NAME, 'secgroups-tab', sg_id),
            'secGroupHTML': sg_rules
          });
        };

        html += TemplateSG({
          'nic_id': $(this).parent().attr('nic_id'),
          'securityGroupHTML': securityGroupHTML
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
        dialog.reset();
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

    if (Config.isTabActionEnabled("vms-tab", "VM.updatenic")) {
      context.off("click", ".updatenic");
      context.on("click", ".updatenic", function() {
        var nic_id = $(this).parents("tr").attr("nic_id");
        var dialog = Sunstone.getDialog(UPDATE_NIC_DIALOG_ID);
        dialog.reset();
        dialog.setElement(that.element);
        dialog.setNicId(nic_id);
        dialog.show();
        return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.attachsg")){
      context.off("click", ".attachsg");
      context.on("click", ".attachsg", function() {
        var nic_id = $(this).parents("tr").attr("nic_id");
        var dialog = Sunstone.getDialog(ATTACH_SG_DIALOG_ID);
        dialog.reset();
        dialog.setElement(that.element, nic_id);
        dialog.show();
        return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.detachsg")){
      context.off("click", ".detachsg");
      context.on("click", ".detachsg", function() {
        var nic_id = $(this).parents("div").attr("nic_id");
        var sg_id = $(this).attr("sg_id");

        Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
          //header :
          headerTabId: TAB_ID,
          body : Locale.tr("This will detach the security group immediately"),
          //question :
          submit : function(){
            Sunstone.runAction("VM.detachsg", that.element.ID, {'nic_id': parseInt(nic_id), 'sg_id': parseInt(sg_id)});
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

  function attach_sg(event) {
    var nic_id = $(this).parent().attr("nic_id");
    if(!nic_id){
      var nic_id = $(this).parents("tr").attr("nic_id");
    }
    var element_id = event.data.element_id;

    Sunstone.runAction("VM.attachsg", element_id, nic_id);

    Sunstone.getDialog(ATTACH_SG_DIALOG_ID).reset();
    Sunstone.getDialog(ATTACH_SG_DIALOG_ID).show();

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
    $.each(state["openNicsDetails"], function() {
      $("#tab_network_form .nics_table tr[nic_id=\""+this+"\"] td.open-control", context).click();
    });
  }
});
