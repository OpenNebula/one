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
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var Notifier = require("utils/notifier");
  var OpenNebula = require("opennebula");
  var OpenNebulaTemplate = require("opennebula/template");
  var TemplateSection = require("hbs!./nics-section/html");
  var TemplateDD = require("hbs!./nics-section/dd");
  var SecurityGroupsTable = require("tabs/secgroups-tab/datatable");
  var VNetsTable = require("tabs/vnets-tab/datatable");
  var TemplateUtils = require("utils/template-utils");

  var provision_nic_accordion_dd_id = 0;
  var nicId = 0;
  var _nics = [];

  return {
    "insert": _insert,
    "retrieve": _retrieve
  };

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
    this.context = context;

    nicId = 0;
    _nics = [];

    if (options == undefined){
      options = {};
    }

    try {
      if (OpenNebulaTemplate.isNetworkChangeEnabled(template_json)) {
        var template_nic = template_json.VMTEMPLATE.TEMPLATE.NIC;

        var nics = [];

        if (Array.isArray(template_nic)){
          nics = template_nic;
        } else if (!$.isEmptyObject(template_nic)){
          nics = [template_nic];
        }

        nics.map(function(nic){
          nic.FROM = 'TEMPLATE';
        });

        var pcis = [];

        if (Array.isArray(template_json.VMTEMPLATE.TEMPLATE.PCI)){
          pcis = template_json.VMTEMPLATE.TEMPLATE.PCI;
        } else if (!$.isEmptyObject(template_json.VMTEMPLATE.TEMPLATE.PCI)){
          pcis = [template_json.VMTEMPLATE.TEMPLATE.PCI];
        }

        $.each(pcis, function(){
          if(this.TYPE == "NIC"){
            nics.push(this);
          }
        });

        var template_alias = template_json.VMTEMPLATE.TEMPLATE.NIC_ALIAS;
        var alias = [];

        if (Array.isArray(template_alias)){
          alias = template_alias;
        } else if (!$.isEmptyObject(template_alias)){
          alias = [template_alias];
        }

        $.each(alias, function(){
            nics.push(this);
        });

        _generate_provision_network_accordion(
          $(".provision_network_selector", context),
          options,
          template_json
        );

        $.each(nics, function(index, nic) {
          var opt = $.extend({}, options);
          opt.nic = nic;

          opt.pci = (nic.TYPE == "NIC");

          if (!_nics.find(function(nic) { return nic.NAME === ("NIC" + nicId) })) {
              _nics.push({"NAME": "NIC" + nicId, "ALIAS": false, "DD_ID": provision_nic_accordion_dd_id});
          }

          _generate_provision_network_table(
            $(".provision_nic_accordion", context),
            opt,
            template_json
          );

           nicId ++;
        });

        _hide_remove();
      }
    } catch(err) {
      _generate_provision_network_accordion(
        $(".provision_network_selector", context),
        options,
        template_json
      );
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
      var that = this;
      if( $("input#"+that.id+"_network_mode", $(this)).prop("checked") ){
        nic["NETWORK_MODE"] = "auto";
        var req = $("input#"+that.id+"_SCHED_REQUIREMENTS", $(this)).val();
        var rank = $("input#"+that.id+"_SCHED_RANK", $(this)).val();
        if ( req && req !== "" ){
          nic["SCHED_REQUIREMENTS"] = req;
        }
        if ( rank && rank !== "" ){
          nic["SCHED_RANK"] = rank;
        }
      } else {
        delete nic["NETWORK_MODE"];
        delete nic["SCHED_REQUIREMENTS"];
        delete nic["SCHED_RANK"];
      }

      if($("input#" + that.id + "_interface_type", context).prop("checked")) {
          if ($("#" + that.id + "_alias_parent", context).val() != "INVALID") {
            nic["PARENT"] = $("#" + that.id + "_alias_parent", context).val();

            if ($("#" + that.id + "_alias_external", context).is(':checked')) {
              nic["EXTERNAL"] =  'YES';
            }
          } else {
            delete nic["PARENT"];
            delete nic["EXTERNAL"];
          }
        } else {
          delete nic["PARENT"];
          delete nic["EXTERNAL"];
      }

      (Boolean($("input#" + that.id + "_rdp", context).prop("checked")))
        ? nic["RDP"] = "YES"
        : delete nic["RDP"];

      (Boolean($("input#" + that.id + "_ssh", context).prop("checked")))
        ? nic["SSH"] = "YES"
        : delete nic["SSH"];

      if ( !nic["NETWORK_MODE"] || ( nic["NETWORK_MODE"] && nic["NETWORK_MODE"] !== "auto" ) )
      {
        var ip4 = $("input.manual_ip4", $(this)).val();
        if (ip4 != undefined){
          delete nic["IP"];
          if (ip4 != ""){
            nic["IP"] = ip4;
          }
        }
        var ip6 = $("input.manual_ip6", $(this)).val();
        if (ip6 != undefined){
          delete nic["IP6"];
          if (ip6 != ""){
            nic["IP6"] = ip6;
          }
        }
        var val = $(this).data("vnetsTable").retrieveResourceTableSelect();
        var tempNetwork = nic["NETWORK"];
        var preserveNetwork = false;
        if (val == undefined || val == ""){
          if (nic["NETWORK"] == undefined && nic["NETWORK_ID"] == undefined ){
            // No network name or id in original NIC, and no selection done
            delete nic['FROM'];
            return; //continue
          }
          preserveNetwork = true;
        }else{
          if (
            nic && nic.FROM && nic.FROM === 'TEMPLATE' &&
            nic["NETWORK_ID"] === val
          ) {
            delete nic['FROM'];
            nics.push(nic);
            return; //continue
          }
        }
        delete nic["NETWORK"];
        delete nic["NETWORK_ID"];
        delete nic["NETWORK_UNAME"];
        delete nic["NETWORK_UID"];
        delete nic["FROM"];
        if(preserveNetwork){
          nic["NETWORK"] = tempNetwork;
          preserveNetwork = false;
        }
        if(val && val.length){
          nic["NETWORK_ID"] = val;
        }
        delete nic["FLOATING_IP"];
        if ($("input.floating_ip", $(this)).prop("checked")){
          nic["FLOATING_IP"] = "YES";
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
      }
      nics.push(nic);
    });
    return nics;
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
   *                                - pci {bool}: true if this is a PCI interface
   */
  function _generate_provision_network_table(context, options, template_json) {
    context.off();

    if (options == undefined){
      options = {};
    }

    var vnetsTableAuto = new VNetsTable("vnet_nics_section_auto_"+provision_nic_accordion_dd_id,
    {
      "select": true,
      "selectOptions": {
        "multiple_choice": true
      }
    });

    var vnetsTable = new VNetsTable(
      "vnet_nics_section_"+provision_nic_accordion_dd_id,
      { "select": true });

    var sgTable;
    var sgHtml = "";

    if (options.securityGroups == true){
      sgTable = new SecurityGroupsTable(
          "sg_nics_section_"+provision_nic_accordion_dd_id,
          { "select": true,
            "selectOptions": { "multiple_choice": true }
          });

      sgHtml = sgTable.dataTableHTML;
    }
    var displayType = true;
    var displaySelection = true;
    var displayRDP = true;
    var displaySSH = true;
    if(
      template_json && 
      template_json.VMTEMPLATE && 
      template_json.VMTEMPLATE.TEMPLATE &&  
      template_json.VMTEMPLATE.TEMPLATE.SUNSTONE
    ){
      var templateType = template_json.VMTEMPLATE.TEMPLATE.SUNSTONE.NETWORK_ALIAS;
      var templateSelection = template_json.VMTEMPLATE.TEMPLATE.SUNSTONE.NETWORK_AUTO;
      var templateRDP = template_json.VMTEMPLATE.TEMPLATE.SUNSTONE.NETWORK_RDP;
      var templateSSH = template_json.VMTEMPLATE.TEMPLATE.SUNSTONE.NETWORK_SSH;
      displayType = templateType && templateType.toUpperCase()==='NO'? false : true;
      displaySelection = templateSelection && templateSelection.toUpperCase()==='NO'? false : true;
      displayRDP = templateRDP && templateRDP.toUpperCase()==='NO'? false : true;
      displaySSH = templateSSH && templateSSH.toUpperCase()==='NO'? false : true;
    }
    var dd_context = $(TemplateDD({
      vnetsTableHTML: vnetsTable.dataTableHTML,
      vnetsTableAutoHTML: vnetsTableAuto.dataTableHTML,
      securityGroupsTableHTML: sgHtml,
      provision_nic_accordion_dd_id: provision_nic_accordion_dd_id,
      options: options,
      displayType: displayType,
      displaySelection: displaySelection,
      displayRDP: displayRDP,
      displaySSH: displaySSH,
    })).appendTo(context);

    dd_context["nic_id"] = nicId;
    dd_context["dd_id"] = provision_nic_accordion_dd_id;

    var selectOptions = {
      "selectOptions": {
        filter_fn: function(vnet) {
          if (!options.hostsTable) return true;

          var clusters = vnet.CLUSTERS.ID;
          var ensuredClusters = Array.isArray(clusters) ? clusters : [clusters];
          var hostClusterIndex = options.hostsTable.columnsIndex.CLUSTER
          var hostClustersIds = options.hostsTable.getColumnDataInSelectedRows(hostClusterIndex)

          return hostClustersIds.length === 0 ||
            hostClustersIds.some(function(id) {
              return ensuredClusters.includes(id)
            })
        },
        "select_callback": function(aData, options) {
            var req_string=[];
            var selected_vnets = vnetsTableAuto.retrieveResourceTableSelect();

            $.each(selected_vnets, function(index, netID) {
              req_string.push("ID=\\\""+netID+"\\\"");
            });
            $(".SCHED_REQUIREMENTS", dd_context).val(req_string.join(" | "));
        },
        "unselect_callback": function(aData, options) {
          var req_string=[];
          var selected_vnets = vnetsTableAuto.retrieveResourceTableSelect();

          $.each(selected_vnets, function(index, netID) {
            req_string.push("ID=\\\""+netID+"\\\"");
          });
          $(".SCHED_REQUIREMENTS", dd_context).val(req_string.join(" | "));
        }
      }
    };

    vnetsTableAuto.initialize(selectOptions);
    vnetsTableAuto.refreshResourceTableSelect();

    $(".nic-section-entry", dd_context).data("template_nic", options.nic);
    $(".nic-section-entry", dd_context).data("vnetsTable", vnetsTable);
    $(".nic-section-entry", dd_context).data("sgTable", sgTable);
    $(".auto", dd_context).hide();
    $(".no_auto", dd_context).show();

    $("input#provision_accordion_dd_"+provision_nic_accordion_dd_id+"_network_mode", dd_context).on("change", function(){
      var network_mode_on = $(this).prop("checked");

      if(network_mode_on){
        $(".no_auto", dd_context).hide();
        $(".auto", dd_context).show();
      } else {
        $(".auto", dd_context).hide();
        $(".no_auto", dd_context).show();
      }
    });

    $("#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_no_alias").hide();

    $("input#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_interface_type", dd_context).on("change", function(){
        var alias_on = $(this).prop("checked");
        var alias;

        $.each(_nics, function(index, value) {
            if (value.ALIAS == ("NIC" + dd_context["nic_id"])) {
                alias = value.ALIAS;
            }
        });

        $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_parent", dd_context).empty();
        $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_parent", dd_context).append(new Option("Choose NIC", "INVALID"));
        $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_parent", dd_context).val("INVALID");
        $("#provision_accordion_dd_" + dd_context["dd_id"] + "_no_alias", dd_context).html("Nic has alias");

        if (_nics.length == 1 && alias_on) {
            $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_parent", dd_context).hide();
            $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_external_wrapper", dd_context).hide();
            $(".network_selection", context, dd_context).hide();
            $("#provision_accordion_dd_" + dd_context["dd_id"] + "_no_alias", dd_context).html("No NIC available");
            $("#provision_accordion_dd_" + dd_context["dd_id"] + "_no_alias"), dd_context.show();
        } else {
            if(alias_on && !alias) {
                $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_parent", dd_context).show();
                $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_external_wrapper", dd_context).show();
                $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_parent", dd_context).click();
                $(".network_selection", dd_context).hide();
                $("#provision_accordion_dd_" + dd_context["dd_id"] + "_no_alias", dd_context).hide();
            } else if (alias_on && alias) {
                $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_parent", dd_context).hide();
                $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_external_wrapper", dd_context).hide();
                $(".network_selection", dd_context).hide();
                $("#provision_accordion_dd_" + dd_context["dd_id"] + "_no_alias", dd_context).show();
            } else {
                $.each(_nics, function(index, value) {
                    if (value.NAME == ("NIC" + dd_context["nic_id"])) {
                        value.ALIAS = false;
                    }
                });

                _hide_remove();

                $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_parent", dd_context).hide();
                $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_external_wrapper", dd_context).hide();
                $(".network_selection", dd_context).show();
                $("#provision_accordion_dd_" + dd_context["dd_id"] + "_no_alias", dd_context).hide();
            }
        }
    });

    $("#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_alias_parent", dd_context).append(new Option("Choose NIC", "INVALID"));
    $("#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_alias_parent", dd_context).val("INVALID");

    $("#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_alias_parent", dd_context).on("click", function(){
        var selected_nic = $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_parent", dd_context).val();
        var add = false;

        $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_parent", dd_context).empty();

        _nics.forEach(function(element) {
            if(element.NAME != ("NIC" + dd_context["nic_id"]) && !element.ALIAS &&
                    (dd_context["nic_id"] > element.NAME[element.NAME.length - 1])) {
                $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_parent").append(new Option(element.NAME, element.NAME));
                add = true;
            }
        });

        if (!add) {
            $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_parent", dd_context).append(new Option("No NIC available", "INVALID"));
            $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_parent", dd_context).val("INVALID");
        }

        $.each(_nics, function(index, value) {
            if (value.NAME == ("NIC" + dd_context["nic_id"]) && selected_nic && selected_nic != "INVALID") {
                value.ALIAS = selected_nic;
            }
        });

        if (selected_nic && selected_nic != "INVALID") {
            _hide_remove();

            $("#provision_accordion_dd_" + dd_context["dd_id"] + "_alias_parent", dd_context).val(selected_nic);
        }
    });

    $("#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_alias_parent", dd_context).hide();
    $("#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_alias_external_wrapper", dd_context).hide();

    $("input[name='provision_accordion_dd_"+provision_nic_accordion_dd_id+"_req_select']", dd_context).on("change", function() {
      if (this.value == "vnet_select") {
        $(".net_select",dd_context).show();
      } else {
        $(".net_select",dd_context).hide();
      }
    });

    $("input[name='provision_accordion_dd_"+provision_nic_accordion_dd_id+"_rank_select']", dd_context).on("change", function() {
      $(".SCHED_RANK", dd_context).val(this.value);
    });

    $("input#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_rdp", dd_context).on("change", function() {
      const isRDPActivated = $(this).prop('checked');
      const idAccordion = "#provision_accordion_dd_" + dd_context["dd_id"];
      _hide_connection(idAccordion, isRDPActivated, context, 'rdp');
    });

    $("input#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_ssh", dd_context).on("change", function() {
      const isSSHActivated = $(this).prop('checked');
      const idAccordion = "#provision_accordion_dd_" + dd_context["dd_id"];
      _hide_connection(idAccordion, isSSHActivated, context, 'ssh');
    });

    if ( options.nic && options.nic["NETWORK_MODE"] && options.nic["NETWORK_MODE"] === "auto" ) {

      $("input#provision_accordion_dd_"+provision_nic_accordion_dd_id+"_network_mode", dd_context).prop("checked", true);
      $(".no_auto", dd_context).hide();
      $(".auto", dd_context).show();

      if ( options.nic["SCHED_REQUIREMENTS"] ) {
        $("input#provision_accordion_dd_"+provision_nic_accordion_dd_id+"_SCHED_REQUIREMENTS", dd_context).val(options.nic["SCHED_REQUIREMENTS"].split("\"").join("\\\""));
      }

      if ( options.nic["SCHED_RANK"] ) {
        $("input#provision_accordion_dd_"+provision_nic_accordion_dd_id+"_SCHED_RANK", dd_context).val(options.nic["SCHED_RANK"]);
      }

      var reqJSON = options.nic["SCHED_REQUIREMENTS"];
      if (reqJSON) {
        var req = TemplateUtils.escapeDoubleQuotes(reqJSON);

        var net_id_regexp = /(\s|\||\b)ID=\\"([0-9]+)\\"/g;

        var nets = [];
        while (match = net_id_regexp.exec(req)) {
            nets.push(match[2]);
        }

        var selectedResourcesAuto = {
            ids : nets
          };

        vnetsTableAuto.selectResourceTableSelect(selectedResourcesAuto);
      }

      var rankJSON = options.nic["SCHED_RANK"];
      if (rankJSON) {
          var striping_regexp = /^-USED_LEASES$/;
          var packing_regexp = /^USED_LEASES$/;

          if (striping_regexp.test(rankJSON)) {
              $("input[name='provision_accordion_dd_"+provision_nic_accordion_dd_id+"_rank_select']#stripingRadio", context).click();
          }
          else if (packing_regexp.test(rankJSON)) {
              $("input[name='provision_accordion_dd_"+provision_nic_accordion_dd_id+"_rank_select']#packingRadio", context).click();
          }
      }
    }

    Tips.setup(dd_context);
    Foundation.reInit(context);

    if(options.nic && options.nic.PARENT) {
        _fill_alias(options.nic.PARENT, options.nic.EXTERNAL);
    }

    // fill rdp connection
    const isRDPActivated = (
      options.nic &&
      options.nic["RDP"] &&
      options.nic["RDP"] === "YES" &&
      $("fieldset#rdp_connection input:not(#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_rdp):checked", context).length === 0
    ) ? true : false;
    
    $("input#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_rdp", context).prop("checked", isRDPActivated);
    _enableRDP("#provision_accordion_dd_" + provision_nic_accordion_dd_id, context);

    // fill ssh connection
    const isSSHActivated = (
      options.nic &&
      options.nic["SSH"] &&
      options.nic["SSH"] === "YES" &&
      $("fieldset#ssh_connection input:not(#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_ssh):checked", context).length === 0
    ) ? true : false;
    
    $("input#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_ssh", context).prop("checked", isSSHActivated);
    _enableSSH("#provision_accordion_dd_" + provision_nic_accordion_dd_id, context);

    provision_nic_accordion_dd_id += 1;

    vnetsTable.initialize({
      selectOptions: {
        filter_fn: function(vnet) {
          if (!options.hostsTable) return true;

          var clusters = vnet.CLUSTERS.ID;
          var ensuredClusters = Array.isArray(clusters) ? clusters : [clusters];
          var hostClusterIndex = options.hostsTable.columnsIndex.CLUSTER
          var hostClustersIds = options.hostsTable.getColumnDataInSelectedRows(hostClusterIndex)

          return hostClustersIds.length === 0 ||
            hostClustersIds.some(function(id) {
              return ensuredClusters.includes(id)
            })
        },
      }
    });
    vnetsTable.refreshResourceTableSelect();

    if (options.hostsTable) {
      // Filters the vnet tables by cluster
      options.hostsTable.dataTable.children('tbody').on('click', 'tr', function() {
        vnetsTable.updateFn();
        vnetsTableAuto.updateFn();

        if ($("td.markrowchecked", this).length > 0) {
          vnetsTable.deselectHiddenResources();
          vnetsTableAuto.deselectHiddenResources();
        }
      })
    }

    if (options.securityGroups == true){
      sgTable.initialize();
      sgTable.refreshResourceTableSelect();
    }

    if (options.nic != undefined){
      var selectedResources;

      if (options.nic.NETWORK_ID != undefined) {
        selectedResources = {
            ids : options.nic.NETWORK_ID
          };
      } else if (options.nic.NETWORK != undefined && options.nic.NETWORK_UNAME != undefined) {
        selectedResources = {
            names : {
              name: options.nic.NETWORK,
              uname: options.nic.NETWORK_UNAME
            }
          };
      }

      if (selectedResources != undefined){
        vnetsTable.selectResourceTableSelect(selectedResources);
      }

      if (options.securityGroups == true && options.nic.SECURITY_GROUPS != undefined){
        sgTable.selectResourceTableSelect({ids: options.nic.SECURITY_GROUPS.split(",")});
      }
    }

    vnetsTable.idInput().on("change", function(){
      $(".selected_network", dd_context).text(OpenNebula.Network.getName($(this).val()));
    });

    dd_context.on("click", ".provision_remove_nic" , function() {
      dd_context.remove();

      var index = _nics.findIndex(function(nic) {
        return nic.NAME === ("NIC" + dd_context["nic_id"])
      });
      
      _nics.splice(index, 1);
      
      nicId --;

      _enableRDP("#provision_accordion_dd_"+dd_context["nic_id"], context)
      _enableSSH("#provision_accordion_dd_"+dd_context["nic_id"], context)

      return false;
    });

    if (!options.nic) {
      $("a", dd_context).trigger("click");
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
  function _generate_provision_network_accordion(context, options, template_json) {
    context.off();
    var name = "Network";
    if (options.name){
      name = options.name;
    }
    var fieldset = true;
    if (options.fieldset !== undefined){
      fieldset = options.fieldset;
    }
    context.html(TemplateSection({
      "name": Locale.tr(name),
      "fieldset": fieldset
    }));

    if (options.hide_add_button == true){
      $(".provision_add_network_interface", context).hide();
    }

    Foundation.reflow(context, "accordion");

    $(".provision_add_network_interface", context).on("click", function() {
      if (!_nics.find(function(nic) { return nic.NAME === ("NIC" + nicId) })) {
          _nics.push({"NAME": "NIC" + nicId, "ALIAS": false, "DD_ID": provision_nic_accordion_dd_id});
      }

      _generate_provision_network_table($(".accordion", context), options, template_json);

      nicId ++;

      _enableRDP("#provision_accordion_dd_" + provision_nic_accordion_dd_id, context);
      _enableSSH("#provision_accordion_dd_" + provision_nic_accordion_dd_id, context);
    });

    if (options.click_add_button == true){
      $(".provision_add_network_interface", context).click();
    }
  }

  function _fill_alias(nicParentName, isExternal) {
    $.each(_nics, function(_, value) {
        if (value.NAME === ("NIC" + nicId)) {
            value.ALIAS = nicParentName;
        }
    });

    $("#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_interface_type_section", this.context).show();
    $("#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_alias_parent", this.context).show();
    $("#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_alias_parent", this.context).click();
    $("#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_interface_type", this.context).click();
    $("#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_alias_parent", this.context).val(nicParentName);

    if (isExternal && String(isExternal).toLowerCase() === 'yes') {
      $("#provision_accordion_dd_" + provision_nic_accordion_dd_id + "_alias_external", this.context).prop('checked', 'checked');
    }
  }

  function _hide_remove() {
    $.each(_nics, function(_, value) {
        if (_nics.find(function(nic) { return nic.ALIAS === value.NAME })) {
            $("#remove_nic_" + value.DD_ID).hide();
        } else {
            $("#remove_nic_" + value.DD_ID).show();
        }
    });
  }

  function _hide_connection(idAccordion, isActivated, context, typeConnection) {
    fieldsetSelector = "fieldset#" + typeConnection + "_connection";
    
    $(".accordion-item > div:not(" + idAccordion + ") " + fieldsetSelector, context).each(function() {
      if (isActivated) {
        $(this).hide();
      } else {
        $(this).show();
      }
    });
  }

  function _enableRDP(idAccordion, context) {
    const canRDP = $("fieldset#rdp_connection input[type='checkbox']:not(" + idAccordion + "_rdp):checked", context).length === 0;

    if (canRDP) $("fieldset#rdp_connection", context).has("input:not(:checked)").show();
    else $("fieldset#rdp_connection", context).has("input:not(:checked)").hide();
  }

  function _enableSSH(idAccordion, context) {
    const canSSH = $("fieldset#ssh_connection input[type='checkbox']:not(" + idAccordion + "_ssh):checked", context).length === 0;

    if (canSSH) $("fieldset#ssh_connection", context).has("input:not(:checked)").show();
    else $("fieldset#ssh_connection", context).has("input:not(:checked)").hide();
  }
});
