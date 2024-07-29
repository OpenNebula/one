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

//  require('foundation.tab');
  var BaseFormPanel = require("utils/form-panels/form-panel");
  var Sunstone = require("sunstone");
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var CustomTagsTable = require("utils/custom-tags-table");
  var ArTab = require("tabs/vnets-tab/utils/ar-tab");
  var SecurityGroupsTable = require("tabs/secgroups-tab/datatable");
  var TemplateUtils = require("utils/template-utils");
  var WizardFields = require("utils/wizard-fields");
  var ResourceSelect = require("utils/resource-select");
  var OpenNebulaAction = require('opennebula/action');

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require("hbs!./create/wizard");
  var TemplateAdvancedHTML = require("hbs!./create/advanced");

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require("./create/formPanelId");
  var TAB_ID = require("../tabId");
  var actionHost = "Host";
  var idsElements = {
    name: "#nsx-name",
    description: "#nsx-description",
    transport: "#nsx-transport"
  }

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      "create": {
        "title": Locale.tr("Create Virtual Network"),
        "buttonText": Locale.tr("Create"),
        "resetButton": true
      },
      "update": {
        "title": Locale.tr("Update Virtual Network"),
        "buttonText": Locale.tr("Update"),
        "resetButton": false
      }
    };

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.htmlAdvanced = _htmlAdvanced;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.submitAdvanced = _submitAdvanced;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.fill = _fill;
  FormPanel.prototype.setup = _setup;
  FormPanel.prototype.addARTab = _add_ar_tab;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    var opts = {
      info: false,
      select: true,
      selectOptions: {"multiple_choice": true}
    };

    this.securityGroupsTable = new SecurityGroupsTable("vnet_create", opts);

    return TemplateWizardHTML({
      "formPanelId": this.formPanelId,
      "customTagsHTML": CustomTagsTable.html(),
      "securityGroupsTableHTML": this.securityGroupsTable.dataTableHTML,
      "createGeneralTab": "vnetCreateGeneralTab",
      "createBridgeTab": "vnetCreateBridgeTab",
      "createARTab": "vnetCreateARTab",
      "createSecurityTab": "vnetCreateSecurityTab",
      "createQoSTab": "vnetCreateQoSTab",
      "createContextTab": "vnetCreateContextTab"
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({formPanelId: this.formPanelId});
  }

  function _setup(context) {
    this.arTabObjects = {};
    var that = this;

    var number_of_ar = 0;

    // add new ar tabs
    $("#vnet_wizard_ar_btn", context).bind("click", function() {
      that.addARTab(number_of_ar, context);
      number_of_ar++;
      var mode = $("#network_mode", context).val();
      if (mode == "vcenter"){
        $(".sec_groups_datatable", context).hide();
      }
      return false;
    });

    $("#vnetCreateARTab #vnetCreateARTabUpdate", context).hide();

    $("#network_mode", context).change(function() {
      $("div.mode_param", context).hide();
      $("div.mode_param [wizard_field]", context).prop("wizard_field_disabled", true);
      $("input#vn_mad", context).removeAttr("required").removeAttr("value");
      $("#vcenter_switch_name", context).removeAttr("required");
      $("#vcenter_cluster_id select", context).removeAttr("required");
      $("#phydev", context).removeAttr("required");
      $(".sec_groups_datatable", context).show();
      $("#vnetCreateSecurityTab-label").show();
      $("#automatic_vlan_id option[value='NO']", context).show();
      $("input[wizard_field=\"VLAN_ID\"]", context).removeAttr("required");
      //NSX
      $("select#nsx-transport", context).removeAttr("required").removeAttr("value");
      $("select#nsx-instance-id", context).removeAttr("required").removeAttr("value");
      $("select#nsx-host-id", context).removeAttr("required").removeAttr("value");

      // vCenter
      $("div.mode_param.vcenter", context).hide();
      $("div.mode_param.vcenter [wizard_field]", context).prop("wizard_field_disabled", true);
      $("input#bridge", context).removeAttr("value");

      switch ($(this).find("option:selected").attr("data-form")) {
      case "bridge":
        $("div.mode_param.bridge", context).show();
        $("div.mode_param.bridge [wizard_field]", context).prop("wizard_field_disabled", false);

        $("input#bridge", context).removeAttr("required");
        break;
      case "fw":
        $("div.mode_param.fw", context).show();
        $("div.mode_param.fw [wizard_field]", context).prop("wizard_field_disabled", false);

        $("input#bridge", context).removeAttr("required");
        break;
      case "802.1Q":
        $("div.mode_param.8021Q", context).show();
        $("div.mode_param.8021Q [wizard_field]", context).prop("wizard_field_disabled", false);

        $("input#bridge", context).removeAttr("required");
        $("#phydev", context).attr("required", "");
        $("#automatic_vlan_id option[value='NO']", context).hide();
        break;
      case "vxlan":
        $("div.mode_param.vxlan", context).show();
        $("div.mode_param.vxlan [wizard_field]", context).prop("wizard_field_disabled", false);

        $("input#bridge", context).removeAttr("required");
        $("#automatic_vlan_id option[value='NO']", context).hide();
        $("#phydev", context).attr("required", "");
        break;
      case "ovswitch":
        $("div.mode_param.ovswitch", context).show();
        $("#vnetCreateSecurityTab-label").hide();
        $("div.mode_param.ovswitch [wizard_field]", context).prop("wizard_field_disabled", false);

        $("input#bridge", context).removeAttr("required");
        break;
      case "ovswitch_vxlan":
        $("div.mode_param.ovswitch_vxlan", context).show();
        $("#vnetCreateSecurityTab-label").hide();
        $("div.mode_param.ovswitch_vxlan [wizard_field]", context).prop("wizard_field_disabled", false);

        $("input#bridge", context).removeAttr("required");
        $("#phydev", context).attr("required", "");
        break;
      case "vcenter":
        $("div.mode_param.vcenter", context).show();
        $(".sec_groups_datatable", context).hide();
        $("div.mode_param.vcenter [wizard_field]", context).prop("wizard_field_disabled", false);
        $("input#bridge", context).attr("value", $("#name", context).val());
        $("#vcenter_switch_name", context).attr("required", "");
        $("#vnetCreateSecurityTab-label").hide();
        ResourceSelect.insert({
          context: $("#vcenter_cluster_id", context),
          resourceName: "Host",
          emptyValue: true,
          nameValues: false,
          filterKey: "VM_MAD",
          filterValue: "vcenter",
          required: true,
          callback: function(element){
            element.attr("wizard_field", "VCENTER_ONE_HOST_ID");
          }
        });

        $("input#vn_mad", context).attr("required", "");
        $("input#vn_mad", context).attr("value", "vcenter");

        $("#div_vn_mad", context).hide();
        break;
      case "nsx":
        $("div.network_mode_description").hide();
        $("div.mode_param.nsx", context).show();
        $("select#nsx-type", context).attr("required", "");
        $("select#nsx-instance-id", context).attr({required: "", value: ""});
        $("select#nsx-host-id", context).attr({required: "", value: ""});
        $("select#nsx-transport", context).attr("required", "");
        $("div.mode_param.nsx [wizard_field]", context).prop("wizard_field_disabled", false);
        break;
      case "custom":
        $("div.mode_param.custom", context).show();
        $("div.mode_param.custom [wizard_field]", context).prop("wizard_field_disabled", false);

        $("input#bridge", context).removeAttr("required");
        $("input#vn_mad", context).attr("required", "");
        break;
      }

      $("div.network_mode_description").hide();
      $("div.network_mode_description[value=\"" + $(this).val() + "\"]").show();

      if ($("input[wizard_field=\"VLAN_ID\"]", context).is(":visible")){
        $("input[wizard_field=\"VLAN_ID\"]", context).attr("required", "");
      } else {
        $("input[wizard_field=\"VLAN_ID\"]", context).removeAttr("required");
      }

      if ($("input[wizard_field=\"OUTER_VLAN_ID\"]", context).is(":visible")){
        $("input[wizard_field=\"OUTER_VLAN_ID\"]", context).attr("required", "");
      } else {
        $("input[wizard_field=\"OUTER_VLAN_ID\"]", context).removeAttr("required");
      }
    });

    $("select[wizard_field=AUTOMATIC_VLAN_ID]", context).change(function(){
      if($(this).val() != "") {
        $("input[wizard_field=\"VLAN_ID\"]", context).hide().prop("wizard_field_disabled", true).removeAttr("required");
      } else {
        $("input[wizard_field=\"VLAN_ID\"]", context).show().prop("wizard_field_disabled", false).attr("required", "");
      }
    });

    $("select[wizard_field=AUTOMATIC_OUTER_VLAN_ID]", context).change(function(){
      if($(this).val() != "") {
        $("input[wizard_field=\"OUTER_VLAN_ID\"]", context).hide().prop("wizard_field_disabled", true).removeAttr("required");
      } else {
        $("input[wizard_field=\"OUTER_VLAN_ID\"]", context).show().prop("wizard_field_disabled", false).attr("required", "");
      }
    });

    //Initialize shown options
    $("#network_mode", context).trigger("change");
    $("select[wizard_field=AUTOMATIC_VLAN_ID]", context).trigger("change");
    $("select[wizard_field=AUTOMATIC_OUTER_VLAN_ID]", context).trigger("change");

    this.securityGroupsTable.initialize();

    CustomTagsTable.setup($("#vnetCreateContextTab", context));

    Foundation.reflow(context, "tabs");

    // Add first AR
    $("#vnet_wizard_ar_btn", context).trigger("click");

    Tips.setup();

    if (config["mode"] === "kvm"){
      $("#network_mode option[value=\"vcenter\"]", context).hide();
    } else if (config["mode"] === "vcenter"){
      $("#network_mode option[value=\"bridge\"]", context).hide();
      $("#network_mode option[value=\"fw\"]", context).hide();
      $("#network_mode option[value=\"802.1Q\"]", context).hide();
      $("#network_mode option[value=\"vxlan\"]", context).hide();
      $("#network_mode option[value=\"ovswitch\"]", context).hide();
      $("#network_mode option[value=\"ovswitch_vxlan\"]", context).hide();
    }
    return false;
  }

  function _add_ar_tab(ar_id, context) {
    var that = this;
    var str_ar_tab_id  = "ar" + ar_id;

    var ar_tab = new ArTab();
    this.arTabObjects[ar_id] = ar_tab;

    var html_tab_content =
      "<div id=\"" + str_ar_tab_id + "Tab\" class=\"ar_tab tabs-panel\" ar_id=\"" + ar_id + "\">" +
        ar_tab.html(str_ar_tab_id) +
      "</div>";

    // Append the new div containing the tab and add the tab to the list
    var a = $("<li class='tabs-title'>" +
        "<a id='ar_tab" + str_ar_tab_id + "' href='#" + str_ar_tab_id + "Tab'>" +
        Locale.tr("AR") + " <i class='fas fa-times-circle remove-tab'></i></a></li>"
      ).appendTo($("ul#vnet_wizard_ar_tabs", context));

    $(html_tab_content).appendTo($("#vnet_wizard_ar_tabs_content", context));

    Foundation.reInit($("ul#vnet_wizard_ar_tabs", context));
    $("a", a).trigger("click");

    var ar_section = $("#" + str_ar_tab_id + "Tab", context);
    ar_tab.setup(ar_section, str_ar_tab_id);
    ar_tab.onShow();


    // close icon: removing the tab on click
    a.on("click", "i.remove-tab", function() {
      var target = $(this).parent().attr("href");
      var li = $(this).closest("li");
      var ul = $(this).closest("ul");
      var content = $(target);

      var ar_id = content.attr("ar_id");

      li.remove();
      content.remove();

      if (li.hasClass("is-active")) {
        $("a", ul.children("li").last()).click();
      }

      delete that.arTabObjects[ar_id];

      return false;
    });
  }

  function _submitWizard(context) {
    var that = this;

    //Fetch values
    var network_json = {};

    $.extend(network_json, WizardFields.retrieve($("#vnetCreateGeneralTab", context)));
    $.extend(network_json, WizardFields.retrieve($("#vnetCreateBridgeTab", context)));
    $.extend(network_json, WizardFields.retrieve($("#vnetCreateQoSTab", context)));
    $.extend(network_json, WizardFields.retrieve($("#vnetCreateContextTab", context)));

    var secgroups = this.securityGroupsTable.retrieveResourceTableSelect();
    if (secgroups != undefined && secgroups.length != 0) {
      network_json["SECURITY_GROUPS"] = secgroups.join(",");
    }

    var cluster_id = $(".resource_list_select", $("#vnet_cluster_id", context)).val();

    $.extend(network_json, CustomTagsTable.retrieve($("#vnetCreateContextTab", context)));

    $(".ar_tab", context).each(function() {
      var ar_id = $(this).attr("ar_id");
      var hash = that.arTabObjects[ar_id].retrieve();

      if (!$.isEmptyObject(hash)) {
        if (!network_json["AR"])
            network_json["AR"] = [];

        network_json["AR"].push(hash);
      }
    });

    if (this.action == "create") {
      network_json = {
        "vnet" : network_json,
        "cluster_id": cluster_id
      };
      Sunstone.runAction("Network.create", network_json);
      return false;
    } else if (this.action == "update") {
      Sunstone.runAction("Network.update", this.resourceId, TemplateUtils.templateToString(network_json));
      return false;
    }
  }

  function _submitAdvanced(context) {
    if (this.action == "create") {
      var template = $("textarea#template", context).val();
      var vnet_json = {vnet: {vnet_raw: template}};
      Sunstone.runAction("Network.create", vnet_json);
      return false;

    } else if (this.action == "update") {
      var template_raw = $("textarea#template", context).val();
      Sunstone.runAction("Network.update", this.resourceId, template_raw);
      return false;
    }
  }

  function _onShow(context) {
    var that = this;
    var hostActions = {
      success: function(req,params,response){
        if(response && response.HOST_POOL && response.HOST_POOL.HOST){
          var hosts = response.HOST_POOL.HOST;
          var nsx_type = $("select#nsx-type", context);
          var nsx_transport = $("select#nsx-transport", context);
          var nsx_fields = $("#nsx-fields", context);
          var nsx_host_id = $("#nsx-host-id", context);
          var nsx_instance_id = $("#nsx-instance-id",context);
          var full = $("<div/>",{'class': 'small-12 columns'});
          var label = $("<label/>");
          var input = $("<input/>");
          var element = $("<option/>");
          var type_nsxt = "Opaque Network";

          nsx_type.empty().append(element.clone().text("--"));
          if (!(hosts instanceof Array)) {
            hosts = [hosts];
          }
          if(hosts && nsx_type){
            hosts.map(function(host){
              var name = (host && host.NAME) || "";
              var type_nsx = host && host.TEMPLATE && host.TEMPLATE.NSX_TYPE || "";
              var instanciate_id = host && host.TEMPLATE && host.TEMPLATE.VCENTER_INSTANCE_ID || "";
              var id = (host && host.ID) || 0;
              if(type_nsx && instanciate_id){
                type_nsx = type_nsx.toLowerCase() === "nsx-t"? type_nsxt : type_nsx;
                var option = element.clone();
                option.val(type_nsx);
                option.attr({"data-id":id, "data-instance": instanciate_id});
                option.text(name);
                nsx_type.append(option);
              }
            });
            nsx_type.off().on('change', function(){
              $("div.network_mode_description").hide();
              var optionSelected = $(this).find("option:selected");
              var selectId = optionSelected.attr("data-id");
              var instanceId = optionSelected.attr("data-instance");
              nsx_host_id.val(selectId);
              nsx_instance_id.val(instanceId);
              var type = $(this).val();
              nsx_transport.empty().append(element.clone().text("--"));
              nsx_fields.empty();
              if(selectId){
                var template = hosts.find(function(host) {
                  if(host && host.ID && host.ID == selectId && host.TEMPLATE && host.TEMPLATE.NSX_TRANSPORT_ZONES){
                    return true;
                  }
                });
                if(template && template.TEMPLATE && template.TEMPLATE.NSX_TRANSPORT_ZONES){
                  var zones = template.TEMPLATE.NSX_TRANSPORT_ZONES;
                  var keys = Object.keys(template.TEMPLATE.NSX_TRANSPORT_ZONES);
                  keys.map(function(key){
                    var option = element.clone();
                    nsx_transport.append(option.val(zones[key]).text(key));
                  });
                  var idInputs = {
                    replication: 'nsx-replication',
                    universalsync: 'nsx-universalsync',
                    ipdiscovery: 'nsx-ipdiscovery',
                    maclearning: 'nsx-maclearning',
                    adminstatus: 'nsx-adminstatus'
                  };
                  switch (type.toLowerCase()) {
                    case 'nsx-v':
                      //NSX-V
                      var mode = {
                        unicast: 'UNICAST_MODE',
                        hybrid: 'HYBRID_MODE',
                        multicast: 'MULTICAST_MODE'
                      };
                      var inputReplication = input.clone().attr({type:'radio', name: idInputs.replication, wizard_field: "NSX_REP_MODE", id: idInputs.replication});
                      var replication =  full.clone().append(
                        label.clone().text(Locale.tr("Replication Mode")).add(
                          inputReplication.clone().val(mode.unicast).attr({id: mode.unicast, checked: ""})
                        ).add(
                          label.clone().text(mode.unicast).attr({for: mode.unicast})
                        ).add(
                          inputReplication.clone().val(mode.hybrid).attr({id: mode.hybrid})
                        ).add(
                          label.clone().text(mode.hybrid).attr({for: mode.hybrid})
                        ).add(
                          inputReplication.clone().val(mode.multicast).attr({id: mode.multicast})
                        ).add(
                          label.clone().text(mode.multicast).attr({for: mode.multicast})
                        )
                      );
                      var universalSync = full.clone().append(
                        input.clone().attr({type: 'checkbox', 'class': 'checkboxChangeValue', for: idInputs.universalsync}).add(
                          input.clone().attr({type: 'checkbox', 'class': 'hide', name: idInputs.universalsync, value: "false", wizard_field: "NSX_UNIVERSAL", id: idInputs.universalsync, checked: ""})
                        ).add(
                          label.clone().text(Locale.tr("Universal Synchronization"))
                        )
                      );
                      var ipDiscover = full.clone().append(
                        input.clone().attr({type: 'checkbox', 'class': 'checkboxChangeValue', for: idInputs.ipdiscovery, checked: ""}).add(
                          input.clone().attr({type: 'checkbox', 'class': 'hide', name: idInputs.ipdiscovery, value: "true", wizard_field: "NSX_IP_DISCOVERY", id: idInputs.ipdiscovery, checked: ""})
                        ).add(
                          label.clone().text(Locale.tr("IP Discovery"))
                        )
                      );
                      var macLearning = full.clone().append(
                        input.clone().attr({type: 'checkbox', 'class': 'checkboxChangeValue', for: idInputs.maclearning}).add(
                          input.clone().attr({type: 'checkbox', 'class': 'hide', name: idInputs.maclearning, value: "false", wizard_field: "NSX_MAC_LEARNING", id: idInputs.maclearning, checked: ""})
                        ).add(
                          label.clone().text(Locale.tr("MAC Learning"))
                        )
                      );
                      nsx_fields.append(replication.add(universalSync).add(ipDiscover).add(macLearning));
                      //aca los ajustadores de los values de los checkbox
                      $('.checkboxChangeValue').change(function() {
                        var t = $(this);
                        var select = t.attr("for");
                        var selectBack = $("#"+select);
                        selectBack.val("false");
                        if(t.is(":checked")) {
                          selectBack.val("true");
                        }
                      });
                    break;
                    case type_nsxt.toLowerCase():
                      //NSX-T
                      var adminStatusInput = input.clone().attr({type:'radio', wizard_field: "NSX_ADMIN_STATUS", name: idInputs.adminstatus, id: idInputs.adminstatus});
                      var inputRep = input.clone().attr({type:'radio', wizard_field: "NSX_REP_MODE", name: idInputs.replication, id: idInputs.replication});
                      var adminStatusOptions = {
                        up: 'UP',
                        down: 'DOWN'
                      };
                      var replicationModeIOptions = {
                        mtep: 'MTEP',
                        source: 'SOURCE'
                      };
                      var adminStatus = full.clone().append(
                        label.clone().text(Locale.tr("Admin Status")).add(
                          adminStatusInput.clone().val(adminStatusOptions.up).attr({id: adminStatusOptions.up, checked: ""})
                        ).add(
                          label.clone().text(Locale.tr(adminStatusOptions.up)).attr({for: adminStatusOptions.up})
                        ).add(
                          adminStatusInput.clone().val(adminStatusOptions.down).attr({id: adminStatusOptions.down})
                        ).add(
                          label.clone().text(Locale.tr(adminStatusOptions.down)).attr({for: adminStatusOptions.down})
                        )
                      );
                      var replicationMode = full.clone().append(
                        label.clone().text(Locale.tr("Replication Mode")).add(
                          inputRep.clone().val(replicationModeIOptions.mtep).attr({id: replicationModeIOptions.mtep, checked: ""})
                        ).add(
                          label.clone().text(Locale.tr(replicationModeIOptions.mtep)).attr({for: replicationModeIOptions.mtep})
                        ).add(
                          inputRep.clone().val(replicationModeIOptions.source).attr({id: replicationModeIOptions.source})
                        ).add(
                          label.clone().text(Locale.tr(replicationModeIOptions.source)).attr({for: replicationModeIOptions.source})
                        )
                      );
                      nsx_fields.append(adminStatus.add(replicationMode));
                    break;
                    default:
                      //NOTHING
                    break;
                  }
                }
              }
            });
          }
        }
      },
      error: function(error){
        console.log(error);
      }
    };
    OpenNebulaAction.list(hostActions,actionHost);

    this.securityGroupsTable.refreshResourceTableSelect();

    $(".ar_tab", context).each(function() {
      var ar_id = $(this).attr("ar_id");
      that.arTabObjects[ar_id].onShow();
    });

    if (this.action === "create"){
      $("div#vnet_cluster_div", context).show();
      var cluster_id = $("div#vnet_cluster_id .resource_list_select", context).val();
      if (!cluster_id) cluster_id = "0";

      ResourceSelect.insert({
        context: $("#vnet_cluster_id", context),
        resourceName: "Cluster",
        initValue: cluster_id
      });
    } else {
      $("div#vnet_cluster_div", context).hide();
    }
  }

  function _fill(context, element) {
    if (this.action != "update") {return;}
    this.setHeader(element);
    this.resourceId = element.ID;

    $("#default_sg_warning", context).hide();
    // Populates the Avanced mode Tab
    $("#template", context).val(TemplateUtils.templateToString(element.TEMPLATE));

    WizardFields.fillInput($("[wizard_field=\"NAME\"]", context), element.NAME);
    $("[wizard_field=\"NAME\"]", context).prop("disabled", true).prop("wizard_field_disabled", true);

    // Show all network mode inputs, and make them not required. This will change
    // if a different network model is selected
    $("input#bridge", context).attr("required", "");
    $("div.mode_param", context).show();
    $("div.mode_param [wizard_field]", context).prop("wizard_field_disabled", true).removeAttr("required");

    WizardFields.fillInput($("input#vn_mad", context), element.TEMPLATE["VN_MAD"]);

    if (element.VLAN_ID_AUTOMATIC == 1){
      $("select[wizard_field=AUTOMATIC_VLAN_ID]", context).val("YES").
                                attr("disabled", "disabled").trigger("change");
    } else {
      $("select[wizard_field=AUTOMATIC_VLAN_ID]", context).val("").
                                attr("disabled", "disabled").trigger("change");
    }

    if (element.OUTER_VLAN_ID_AUTOMATIC== 1){
      $("select[wizard_field=AUTOMATIC_OUTER_VLAN_ID]", context).val("YES").
                                attr("disabled", "disabled").trigger("change");
    } else {
      $("select[wizard_field=AUTOMATIC_OUTER_VLAN_ID]", context).val("").
                                attr("disabled", "disabled").trigger("change");
    }

    WizardFields.fill($("#vnetCreateGeneralTab", context), element.TEMPLATE);
    WizardFields.fill($("#vnetCreateBridgeTab", context), element.TEMPLATE);
    WizardFields.fill($("#vnetCreateQoSTab", context), element.TEMPLATE);
    WizardFields.fill($("#vnetCreateContextTab", context), element.TEMPLATE);

    if ($("#network_mode", context).val() == undefined){
      $("#network_mode", context).val("custom").change();
    }

    if (element.TEMPLATE["SECURITY_GROUPS"] != undefined &&
        element.TEMPLATE["SECURITY_GROUPS"].length != 0) {

      var secgroups = element.TEMPLATE["SECURITY_GROUPS"].split(",");

      this.securityGroupsTable.selectResourceTableSelect({ids : secgroups});
    } else {
      this.securityGroupsTable.refreshResourceTableSelect();
    }

    // Delete so these attributes don't end in the custom tags table also
    delete element.TEMPLATE["SECURITY_GROUPS"];

    var fields = $("[wizard_field]", context);

    fields.each(function() {
      var field = $(this);
      var field_name = field.attr("wizard_field");

      delete element.TEMPLATE[field_name];
    });

    CustomTagsTable.fill($("#vnetCreateContextTab", context), element.TEMPLATE);

    // Remove the first AR added in initialize_
    $("#vnetCreateARTab ul#vnet_wizard_ar_tabs i.remove-tab", context).trigger("click");
    $("#vnetCreateARTab #vnetCreateARTabUpdate", context).show();
    $("#vnetCreateARTab #vnetCreateARTabCreate", context).hide();
  }
});
