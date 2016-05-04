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
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var Notifier = require('utils/notifier');
  var OpenNebula = require('opennebula');
  var OpenNebulaTemplate = require('opennebula/template');
  var TemplateSection = require('hbs!./nics-section/html');
  var TemplateDD = require('hbs!./nics-section/dd');
  var SecurityGroupsTable = require('tabs/secgroups-tab/datatable');
  var VNetsTable = require('tabs/vnets-tab/datatable');

  var provision_nic_accordion_dd_id = 0;

  return {
    'insert': _insert,
    'retrieve': _retrieve
  }

  /**
   * Inserts the section into the context container
   * @param  {Object} template_json VM Template
   * @param  {object} context       JQuery selector
   * @param  {object} options       Options
   *                                - hide_add_button {bool}
   *                                - click_add_button {bool}
   *                                - floatingIP {bool}: true to show the
   *                                floating IP checkbox
   *                                - forceIPv4 {bool}: true to show the
   *                                input to select the IPv4
   *                                - management {bool}: true to show the
   *                                management checkbox
   *                                - securityGroups {bool}: true to select SGs
   */
  function _insert(template_json, context, options) {
    if (options == undefined){
      options = {};
    }

    try {
      if (OpenNebulaTemplate.isNetworkChangeEnabled(template_json)) {
        var template_nic = template_json.VMTEMPLATE.TEMPLATE.NIC
        var nics = []
        if ($.isArray(template_nic))
            nics = template_nic
        else if (!$.isEmptyObject(template_nic))
            nics = [template_nic]

        _generate_provision_network_accordion(
          $(".provision_network_selector", context), options);

        $.each(nics, function(index, nic) {
          var opt = $.extend({}, options);
          opt.nic = nic;

          _generate_provision_network_table(
            $(".provision_nic_accordion", context),
            opt);
        })
      }
    } catch(err) {
      _generate_provision_network_accordion(
        $(".provision_network_selector", context), options);
    }
  }

  function _retrieve(context) {
    var nics = [];
    var nic;
    $(".nic-section-entry", context).each(function() {
      // template_nic is the original NIC definition in an instantiate action.
      // We try to use it replacing only the settings offered in this
      // module, to preserve any other potential settings (such as IP6_GLOBAL)

      if ($(this).data("template_nic") != undefined) {
        nic = $(this).data("template_nic");
      } else {
        nic = {};
      }

      var val = $(this).data("vnetsTable").retrieveResourceTableSelect();

      if (val == undefined || val == ""){
        if (nic["NETWORK"] == undefined && nic["NETWORK_ID"] == undefined ){
          // No network name or id in original NIC, and no selection done
          return true; //continue
        } else {
          return nic;
        }
      }

      delete nic["NETWORK"];
      delete nic["NETWORK_ID"];
      delete nic["NETWORK_UNAME"];
      delete nic["NETWORK_UID"];
    
      nic["NETWORK_ID"] = val;

      delete nic["FLOATING_IP"];
      if ($("input.floating_ip", $(this)).prop("checked")){
        nic["FLOATING_IP"] = "YES";
      }

      delete nic["IP"];
      var ip4 = $("input.manual_ip4", $(this)).val();

      if (ip4 != undefined && ip4 != ""){
        nic["IP"] = ip4;
      }

      delete nic["VROUTER_MANAGEMENT"];

      if ($("input.management", $(this)).prop("checked")){
        nic["VROUTER_MANAGEMENT"] = "YES";
      }

      var sgTable = $(this).data("sgTable");

      if (sgTable){
        delete nic["SECURITY_GROUPS"];

        var secgroups = sgTable.retrieveResourceTableSelect();
        if (secgroups != undefined && secgroups.length != 0) {
          nic["SECURITY_GROUPS"] = secgroups.join(",");
        }
      }

      nics.push(nic);
    });

    return nics
  }

  /**
   * @param  {object} context       JQuery selector
   * @param  {object} options       Options
   *                                - nic {object}
   *                                - floatingIP {bool}: true to show the
   *                                floating IP checkbox
   *                                - forceIPv4 {bool}: true to show the
   *                                input to select the IPv4
   *                                - management {bool}: true to show the
   *                                management checkbox
   *                                - securityGroups {bool}: true to select SGs
   */
  function _generate_provision_network_table(context, options) {
    context.off();
    var nic_span;

    if (options == undefined){
      options = {};
    }

    var vnetsTable = new VNetsTable(
      'vnet_nics_section_'+provision_nic_accordion_dd_id,
      { 'select': true });

    var sgTable;
    var sgHtml = "";

    if (options.securityGroups == true){
      sgTable = new SecurityGroupsTable(
          'sg_nics_section_'+provision_nic_accordion_dd_id,
          { 'select': true,
            'selectOptions': { 'multiple_choice': true }
          });

      sgHtml = sgTable.dataTableHTML;
    }

    var dd_context = $(TemplateDD({
      vnetsTableHTML: vnetsTable.dataTableHTML,
      securityGroupsTableHTML: sgHtml,
      provision_nic_accordion_dd_id: provision_nic_accordion_dd_id,
      options: options
    })).appendTo(context);

    $(".nic-section-entry", dd_context).data("template_nic", options.nic);
    $(".nic-section-entry", dd_context).data("vnetsTable", vnetsTable);
    $(".nic-section-entry", dd_context).data("sgTable", sgTable);

    Tips.setup(dd_context);
    Foundation.reInit(context);

    provision_nic_accordion_dd_id += 1;

    vnetsTable.initialize();
    vnetsTable.refreshResourceTableSelect();

    if (options.securityGroups == true){
      sgTable.initialize();
      sgTable.refreshResourceTableSelect();
    }

    if (options.nic != undefined){
      var selectedResources;

      if (options.nic.NETWORK_ID != undefined) {
        selectedResources = {
            ids : options.nic.NETWORK_ID
          }
      } else if (options.nic.NETWORK != undefined && options.nic.NETWORK_UNAME != undefined) {
        selectedResources = {
            names : {
              name: options.nic.NETWORK,
              uname: options.nic.NETWORK_UNAME
            }
          }
      }

      if (selectedResources != undefined){
        vnetsTable.selectResourceTableSelect(selectedResources);
      }

      if (options.securityGroups == true && options.nic.SECURITY_GROUPS != undefined){
        sgTable.selectResourceTableSelect({ids: options.nic.SECURITY_GROUPS.split(',')});
      }
    }

    vnetsTable.idInput().on("change", function(){
      $(".selected_network", dd_context).text(OpenNebula.Network.getName($(this).val()));
    });

    dd_context.on("click", ".provision_remove_nic" , function() {
      dd_context.remove();
      return false;
    });

    if (!options.nic) {
      $('a', dd_context).trigger("click");
    }
  }

  /**
   * @param  {object} context       JQuery selector
   * @param  {object} options       Options
   *                                - hide_add_button {bool}
   *                                - click_add_button {bool}
   *                                - floatingIP {bool}: true to show the
   *                                floating IP checkbox
   *                                - forceIPv4 {bool}: true to show the
   *                                input to select the IPv4
   *                                - management {bool}: true to show the
   *                                management checkbox
   *                                - securityGroups {bool}: true to select SGs
   */
  function _generate_provision_network_accordion(context, options) {
    context.off();
    context.html(TemplateSection());

    if (options.hide_add_button == true){
      $(".provision_add_network_interface", context).hide();
    }

    Foundation.reflow(context, 'accordion');

    $(".provision_add_network_interface", context).on("click", function() {
      _generate_provision_network_table($(".accordion", context), options);
    });

    if (options.click_add_button == true){
      $(".provision_add_network_interface", context).click();
    }
  }

  function update_provision_networks_datatable(datatable) {
    datatable.html('<div class="text-center">' +
      '<span class="fa-stack fa-5x">' +
        '<i class="fa fa-cloud fa-stack-2x"></i>' +
        '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>' +
      '</span>' +
      '<br>' +
      '<br>' +
      '<span>' +
      '</span>' +
      '</div>');

    OpenNebula.Network.list({
      timeout: true,
      success: function (request, item_list) {
        datatable.fnClearTable(true);
        if (item_list.length == 0) {
          datatable.html('<div class="text-center">' +
            '<span class="fa-stack fa-5x">' +
              '<i class="fa fa-cloud fa-stack-2x"></i>' +
              '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>' +
            '</span>' +
            '<br>' +
            '<br>' +
            '<span>' +
              Locale.tr("There are no networks available.") +
            '</span>' +
            '</div>');
        } else {
          datatable.fnAddData(item_list);
        }
      },
      error: Notifier.onError
    });
  }
})
