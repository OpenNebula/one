/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

  function NicTab(nicTabId) {
    that = this;
    this.nicTabId = 'nicTab' + nicTabId + UniqueId.id();

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
      } else {
        $(".auto", context).hide();
        $(".no_auto", context).show();
      }
    });

    $(".auto", context).hide();

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
});
