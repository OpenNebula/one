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

  var Config = require('sunstone-config');
  var OpenNebulaNetwork = require('opennebula/network');
  var VNetsTable = require('tabs/vnets-tab/datatable');
  var SecgroupsTable = require('tabs/secgroups-tab/datatable');
  var WizardFields = require('utils/wizard-fields');
  var UniqueId = require('utils/unique-id');
  var CreateUtils = require('../utils');
  var Notifier = require('utils/notifier');
  var TemplateUtils = require('utils/template-utils');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./nic-tab/html');

  /*
    CONSTANTS
   */

  /*
    CONSTRUCTOR
   */

  function NicTab(nicTabId, nics) {
    that = this;
    this.nicId = nicTabId - 1;
    this.nicTabId = 'nicTab' + nicTabId + UniqueId.id();
    this.nics = nics;

    var options = {
      'select': true,
      'selectOptions': {
        'multiple_choice': true
      }
    }
    this.vnetsTableAuto = new VNetsTable(this.nicTabId + 'TableAuto', options);

    this.vnetsTable = new VNetsTable(this.nicTabId + 'Table', {'select': true});

    var secgroupSelectOptions = {
      'select': true,
      'selectOptions': {
        "multiple_choice": true,
        'unselect_callback': function(aData, options){
          if (that.secGroups && that.secGroups.includes(aData[options.id_index])){
            $("div[name='str_nic_tab_id'] table tbody tr td:contains('" + aData[options.name_index] + "')").click();
          }
        }
      }
    }
    this.secgroupsTable = new SecgroupsTable(this.nicTabId + 'SGTable', secgroupSelectOptions);
  }

  NicTab.prototype.constructor = NicTab;
  NicTab.prototype.html = _html;
  NicTab.prototype.setup = _setup;
  NicTab.prototype.onShow = _onShow;
  NicTab.prototype.retrieve = _retrieve;
  NicTab.prototype.fill = _fill;
  NicTab.prototype.generateRequirements = _generateRequirements;
  NicTab.prototype.fill_alias = _fill_alias;

  return NicTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'nicTabId': this.nicTabId,
      'vnetsTableSelectHTML': this.vnetsTable.dataTableHTML,
      'vnetsTableAutoSelectHTML': this.vnetsTableAuto.dataTableHTML,
      'secgroupsTableSelectHTML': this.secgroupsTable.dataTableHTML
    });
  }

  function _onShow(context, panelForm) {
    this.vnetsTable.refreshResourceTableSelect();
    this.vnetsTableAuto.refreshResourceTableSelect();
  }

  /**
   * @param  {Object}  context  jquery selector
   * @param  {Object}  options
   *                   options.hide_pci {bool} true to disable the pci checkbox
   *                   options.hide_auto {bool} true to disable the selection mode auto checkbox
   */
  function _setup(context, options) {
    var that = this;
    that.context = context;

    if (options != undefined && options.hide_pci == true){
      $("input.pci-type-nic", context).attr('disabled', 'disabled');
    }

    if (options != undefined && options.hide_auto == true){
      $(".only_create", context).hide();
    }

    that.vnetsTable.initialize({
      'selectOptions': {
        'select_callback': function(aData, options) {
          // If the net is selected by Id, avoid overwriting it with name+uname
          if ($('#NETWORK_ID', context).val() != aData[options.id_index]) {
            OpenNebulaNetwork.show({
              data : {
                id: aData[options.id_index]
              },
              timeout: true,
              success: function (request, vn){
                that.secGroups = vn["VNET"]["TEMPLATE"]["SECURITY_GROUPS"].split(",");
                that.secgroupsTable.selectResourceTableSelect(
                  { ids : that.secGroups });
              },
              error: Notifier.onError
            });
            $('#NETWORK_ID', context).val("");
            $('#NETWORK', context).val(aData[options.name_index]);
            $('#NETWORK_UNAME', context).val(aData[options.uname_index]);
            $('#NETWORK_UID', context).val("");
          }
        }
      }
    });

    that.secgroupsTable.initialize();
    that.secgroupsTable.refreshResourceTableSelect();
    that.vnetsTable.refreshResourceTableSelect();

    var selectOptions = {
      'selectOptions': {
        'select_callback': function(aData, options) {
          that.generateRequirements(context)
        },
        'unselect_callback': function(aData, options) {
          that.generateRequirements(context)
        }
      }
    }

    that.vnetsTableAuto.initialize(selectOptions);
    that.vnetsTableAuto.refreshResourceTableSelect();

    $("input.pci-type-nic", context).on("change", function(){
      var tbody = $(".pci-row tbody", context);

      if ($(this).prop('checked')){
        $("input[wizard_field=MODEL]", context).prop("disabled", true).prop('wizard_field_disabled', true);
        $(".nic-model-row", context).hide();
        $(".pci-row", context).show();

        tbody.html( CreateUtils.pciRowHTML() );

        CreateUtils.fillPCIRow({tr: $('tr', tbody), remove: false});
      } else {
        $("input[wizard_field=MODEL]", context).removeAttr('disabled').prop('wizard_field_disabled', false);
        $(".nic-model-row", context).show();
        $(".pci-row", context).hide();

        tbody.html("");
      }
    });

    CreateUtils.setupPCIRows($(".pci-row", context));

    $("input.pci-type-nic", context).change();

    if (!Config.isAdvancedEnabled("show_attach_nic_advanced")){
      $("#nic_values", context).hide();
    }

    $("input#"+this.nicTabId+"_network_mode", context).on("change", function(){
      var network_mode_on = $(this).prop("checked");

      if(network_mode_on){
        $(".no_auto", context).hide();
        $(".auto", context).show();
        $("#" + that.nicTabId + "interface_type", context).hide();
      } else {
        $(".auto", context).hide();
        $(".no_auto", context).show();
        $("#" + that.nicTabId + "interface_type", context).show();
      }
    });

    $(".auto", context).hide();

    $("input#" + this.nicTabId + "_interface_type", context).on("change", function(){
        var alias_on = $(this).prop("checked");
        var alias;
        var found = false;

        $.each(that.nics, function(index, value) {
            if (value.ALIAS === ("NIC" + that.nicId)) {
                alias = value.ALIAS;
            }
        });

        $("#" + that.nicTabId + "_alias_parent", context).empty();
        $("#" + that.nicTabId + "_alias_parent", context).append(new Option("Choose NIC", "INVALID"));
        $("#" + that.nicTabId + "_alias_parent", context).val("INVALID");
        $("#" + that.nicTabId + "_no_alias", context).html("Nic has alias");

        if (that.nics.length == 1 && alias_on) {
            $("#" + that.nicTabId + "_alias_parent", context).hide();
            $(".network_selection", context).hide();
            $("#" + that.nicTabId + "_no_alias", context).html("No NIC available");
            $("#" + that.nicTabId + "_no_alias").show();
        } else {
            if(alias_on && !alias) {
                $("#" + that.nicTabId + "_alias_parent", context).show();
                $("#" + that.nicTabId + "_alias_parent", context).click();
                $(".network_selection", context).hide();
                $("#" + that.nicTabId + "_no_alias").hide();
            } else if (alias_on && alias) {
                $("#" + that.nicTabId + "_alias_parent", context).hide();
                $(".network_selection", context).hide();
                $("#" + that.nicTabId + "_no_alias").show();
            } else {
                $.each(that.nics, function(index, value) {
                    if (value.NAME == ("NIC" + that.nicId)) {
                        alias = value.ALIAS;
                        value.ALIAS = false;
                    }
                });

                _hide_remove(that.nics);

                $("#" + that.nicTabId + "_alias_parent", context).hide();
                $(".network_selection", context).show();
                $("#" + that.nicTabId + "_no_alias").hide();
            }
        }
    });

    $("#" + this.nicTabId + "_no_alias").hide();

    $("#" + this.nicTabId + "_alias_parent", context).append(new Option("Choose NIC", "INVALID"));
    $("#" + this.nicTabId + "_alias_parent", context).val("INVALID");

    $("#" + this.nicTabId + "_alias_parent", context).on("click", function(){
        var selected_nic = $("#" + that.nicTabId + "_alias_parent", context).val();
        var add = false;
        var found = false;

        $("#" + that.nicTabId + "_alias_parent").empty();

        that.nics.forEach(function(element) {
            if(element.NAME != ("NIC" + that.nicId) && !element.ALIAS &&
                    (that.nicId > element.NAME[element.NAME.length - 1])) {
                $("#" + that.nicTabId + "_alias_parent").append(new Option(element.NAME, element.NAME));
                add = true;
            }
        });

        if (!add) {
            $("#" + that.nicTabId + "_alias_parent", context).append(new Option("No NIC available", "INVALID"));
            $("#" + that.nicTabId + "_alias_parent", context).val("INVALID");
        }

        $.each(that.nics, function(index, value) {
            if (value.NAME == ("NIC" + that.nicId) && selected_nic && selected_nic != "INVALID") {
                value.ALIAS = selected_nic;
            }
        });

        if (selected_nic && selected_nic != "INVALID") {
            _hide_remove(that.nics);

            $("#" + that.nicTabId + "_alias_parent", context).val(selected_nic);
        }
    });

    $("#" + this.nicTabId + "_alias_parent", context).hide();

    context.on("change", "input[name='" + that.nicTabId + "_req_select']", function() {
      if ($("input[name='" + that.nicTabId + "_req_select']:checked").val() == "vnet_select") {
        $("#"+ that.nicTabId +"_vnetTable",context).show();
      } else {
        $("#"+ that.nicTabId +"_vnetTable",context).hide();
      }
    });

    context.on("change", "input[name='" + that.nicTabId + "_rank_select']", function() {
      $("input#"+that.nicTabId+"_SCHED_RANK", context).val(this.value);
    });

    context.on("change", "#" + that.nicTabId + "_rdp", function() {
      const isRDPActivated = $(this).prop('checked');
      _hide_rdp(that.nicTabId, isRDPActivated, context);
    });
  }

  function _retrieve(context) {
    var nicJSON = WizardFields.retrieve(context);

    var tcp = $("input.tcp_type:checked", context).val();
    if (tcp) {
      nicJSON[tcp] = WizardFields.retrieveInput($("#TCP_PORTS", context));
    }

    var udp = $("input.udp_type:checked", context).val();
    if (udp) {
      nicJSON[udp] = WizardFields.retrieveInput($("#UDP_PORTS", context));
    }

    if ($("#icmp_type", context).is(":checked")) {
      nicJSON["ICMP"] = "drop"
    }

    var secgroups = this.secgroupsTable.retrieveResourceTableSelect();
    if (secgroups != undefined && secgroups.length != 0) {
      nicJSON["SECURITY_GROUPS"] = secgroups.join(",");
    }

    if ($("input.pci-type-nic", context).prop("checked")){
      nicJSON["NIC_PCI"] = true;
    }

    if( $("input#"+this.nicTabId+"_network_mode", context).prop("checked") ){
      nicJSON["NETWORK_MODE"] = "auto";
      var req = $("input#"+this.nicTabId+"_SCHED_REQUIREMENTS", context).val();
      var rank = $("input#"+this.nicTabId+"_SCHED_RANK", context).val();

      if ( req !== "" ){
        nicJSON["SCHED_REQUIREMENTS"] = req;
      }

      if ( rank !== "" ){
        nicJSON["SCHED_RANK"] = rank;
      }
    }

    if(!$("input#" + this.nicTabId + "_interface_type", context).prop("checked") ||
            $("#" + this.nicTabId + "_alias_parent", context).val() == "INVALID") {
        delete nicJSON["PARENT"];
    } else {
      nicJSON["PARENT"] = $("#" + this.nicTabId + "_alias_parent", context).val();
    }

    if($("input#" + this.nicTabId + "_rdp", context).prop("checked")) {
        nicJSON["RDP"] = "YES";
    }

    return nicJSON;
  }

  function _fill(context, templateJSON) {
    if (templateJSON.NETWORK_ID != undefined) {
      var selectedResources = {
          ids : templateJSON.NETWORK_ID
        }

      this.vnetsTable.selectResourceTableSelect(selectedResources);
    } else if (templateJSON.NETWORK != undefined && templateJSON.NETWORK_UNAME != undefined) {
      var selectedResources = {
          names : {
            name: templateJSON.NETWORK,
            uname: templateJSON.NETWORK_UNAME
          }
        }

      this.vnetsTable.selectResourceTableSelect(selectedResources);
    }

    if (templateJSON["WHITE_PORTS_TCP"]) {
      var field = $("input.tcp_type[value='WHITE_PORTS_TCP']", context);
      field.click();

      WizardFields.fillInput($("#TCP_PORTS", context), templateJSON["WHITE_PORTS_TCP"]);
    } else if (templateJSON["BLACK_PORTS_TCP"]) {
      var field = $("input.tcp_type[value='BLACK_PORTS_TCP']", context);
      field.click();

      WizardFields.fillInput($("#TCP_PORTS", context), templateJSON["BLACK_PORTS_TCP"]);
    }

    if (templateJSON["WHITE_PORTS_UDP"]) {
      var field = $("input.udp_type[value='WHITE_PORTS_UDP']", context);
      field.click();

      WizardFields.fillInput($("#UDP_PORTS", context), templateJSON["WHITE_PORTS_UDP"]);
    } else if (templateJSON["BLACK_PORTS_UDP"]) {
      var field = $("input.udp_type[value='BLACK_PORTS_UDP']", context);
      field.click();

      WizardFields.fillInput($("#UDP_PORTS", context), templateJSON["BLACK_PORTS_UDP"]);
    }

    if (templateJSON["ICMP"]) {
      var field = $("#icmp_type", context);
      $("#icmp_type", context).attr('checked', 'checked');
    }

    if (templateJSON["SECURITY_GROUPS"] != undefined &&
        templateJSON["SECURITY_GROUPS"].length != 0) {

      var selectedResources = {ids: templateJSON["SECURITY_GROUPS"].split(",")};
      this.secgroupsTable.selectResourceTableSelect(selectedResources);
    } else {
      this.secgroupsTable.refreshResourceTableSelect();
    }

    if (templateJSON["TYPE"] == "NIC"){
      $("input.pci-type-nic", context).click();
    }

    if ( templateJSON["NETWORK_MODE"] && templateJSON["NETWORK_MODE"] === "auto" ) {
      $("input#"+this.nicTabId+"_network_mode", context).prop("checked", true);
      $(".no_auto", context).hide();
      $(".auto", context).show();

      if ( templateJSON["SCHED_REQUIREMENTS"] ) {
        $("input#"+this.nicTabId+"_SCHED_REQUIREMENTS", context).val(templateJSON["SCHED_REQUIREMENTS"].split('"').join("\\\""));
      }

      if ( templateJSON["SCHED_RANK"] ) {
        $("input#"+this.nicTabId+"_SCHED_RANK", context).val(templateJSON["SCHED_RANK"]);
      }

      var reqJSON = templateJSON['SCHED_REQUIREMENTS'];
      if (reqJSON) {
        var req = TemplateUtils.escapeDoubleQuotes(reqJSON);

        var net_id_regexp = /(\s|\||\b)ID=\\"([0-9]+)\\"/g;

        var nets = [];
        while (match = net_id_regexp.exec(req)) {
            nets.push(match[2])
        }

        var selectedResources = {
            ids : nets
          }

        this.vnetsTableAuto.selectResourceTableSelect(selectedResources);
      }

      var rankJSON = templateJSON["SCHED_RANK"];
      if (rankJSON) {
          var striping_regexp = /^-USED_LEASES$/;
          var packing_regexp = /^USED_LEASES$/;

          if (striping_regexp.test(rankJSON)) {
              $("input[name='" + this.nicTabId + "_rank_select']#stripingRadio", context).click();
          }
          else if (packing_regexp.test(rankJSON)) {
              $("input[name='" + this.nicTabId + "_rank_select']#packingRadio", context).click();
          }
      }
    }

    const isRDPActivated = (
      templateJSON["RDP"] &&
      templateJSON["RDP"] === "YES" &&
      $("fieldset#rdp_connection input:not(#" + that.nicTabId + "_rdp):checked", context).length === 0
    ) ? true : false;

    $("input#" + this.nicTabId + "_rdp", context).prop("checked", isRDPActivated);

    WizardFields.fill(context, templateJSON);
  }

  function _generateRequirements(context) {
    var req_string=[];
    var selected_vnets = this.vnetsTableAuto.retrieveResourceTableSelect();

    $.each(selected_vnets, function(index, netID) {
      req_string.push('ID=\\"'+netID+'\\"');
    });

    $("input#"+this.nicTabId+"_SCHED_REQUIREMENTS", context).val(req_string.join(" | "));
  };

  function _fill_alias(nicname) {
    $.each(this.nics, function(index, value) {
        if (value.NAME == ("NIC" + that.nicId)) {
            value.ALIAS = nicname;
        }
    });

    $("#" + this.nicTabId + "interface_type", this.context).show();
    $("#" + this.nicTabId + "_alias_parent", this.context).show();
    $("#" + this.nicTabId + "_alias_parent", this.context).click();
    $("#" + this.nicTabId + "_interface_type", this.context).click();
    $("#" + this.nicTabId + "_alias_parent", this.context).val(nicname);
  }

  function _hide_remove(nics) {
    $.each(nics, function(index, value) {
        if (that.nics.find(nic => nic.ALIAS === value.NAME)) {
            $("#update_remove_nic_" + value.ID).hide();
        } else {
            $("#update_remove_nic_" + value.ID).show();
        }
    });
  }

  function _hide_rdp(nicTabId, isRDPActivated, context) {
    $("#template_create_network_tabs_content > div:not(#" + nicTabId + ") fieldset#rdp_connection", context).each(function() {
      if (isRDPActivated) {
        $(this).hide();
      } else {
        $(this).show();
      }
    });
  }
});
