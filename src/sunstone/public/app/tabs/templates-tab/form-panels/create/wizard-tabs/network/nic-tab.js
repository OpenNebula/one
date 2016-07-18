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

  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var VNetsTable = require('tabs/vnets-tab/datatable');
  var SecgroupsTable = require('tabs/secgroups-tab/datatable');
  var WizardFields = require('utils/wizard-fields');
  var UniqueId = require('utils/unique-id');
  var CreateUtils = require('../utils');

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
    this.nicTabId = 'nicTab' + nicTabId + UniqueId.id();

    this.vnetsTable = new VNetsTable(this.nicTabId + 'Table', {'select': true});

    var secgroupSelectOptions = {
      'select': true,
      'selectOptions': {
        "multiple_choice": true
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

  return NicTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'nicTabId': this.nicTabId,
      'vnetsTableSelectHTML': this.vnetsTable.dataTableHTML,
      'secgroupsTableSelectHTML': this.secgroupsTable.dataTableHTML
    });
  }

  function _onShow(context, panelForm) {
    this.vnetsTable.refreshResourceTableSelect();
  }

  /**
   * @param  {Object}  context  jquery selector
   * @param  {Object}  options
   *                   options.hide_pci {bool} true to disable the pci checkbox
   */
  function _setup(context, options) {
    var that = this;

    if (options != undefined && options.hide_pci == true){
      $("input.pci-type-nic", context).attr('disabled', 'disabled');
    }

    that.vnetsTable.initialize({
      'selectOptions': {
        'select_callback': function(aData, options) {
          // If the net is selected by Id, avoid overwriting it with name+uname
          if ($('#NETWORK_ID', context).val() != aData[options.id_index]) {
            $('#NETWORK_ID', context).val("");
            $('#NETWORK', context).val(aData[options.name_index]);
            $('#NETWORK_UNAME', context).val(aData[options.uname_index]);
            $('#NETWORK_UID', context).val("");
          }
        }
      }
    });
    that.vnetsTable.refreshResourceTableSelect();

    that.secgroupsTable.initialize();
    that.secgroupsTable.refreshResourceTableSelect();

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

    WizardFields.fill(context, templateJSON);
  }
});
