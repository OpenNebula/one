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
  var ClustersTable = require("tabs/clusters-tab/datatable");
  var TemplateUtils = require("utils/template-utils");
  var WizardFields = require("utils/wizard-fields");
  var ResourceSelect = require("utils/resource-select");

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require("hbs!tabs/vnets-tab/form-panels/create/wizard");
  var TemplateAdvancedHTML = require("hbs!tabs/vnets-tab/form-panels/create/advanced");

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require("./create/formPanelId");
  var TAB_ID = require("../tabId");

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      "create": {
        "title": Locale.tr("Create Virtual Network Template"),
        "buttonText": Locale.tr("Create"),
        "resetButton": true
      },
      "update": {
        "title": Locale.tr("Update Virtual Network Template"),
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

    this.securityGroupsTable = new SecurityGroupsTable("vnet_tmpl_create_sg", opts);
    this.clustersTable = new ClustersTable("vnet_tmpl_create_cluster", opts);

    return TemplateWizardHTML({
      "formPanelId": this.formPanelId,
      "customTagsHTML": CustomTagsTable.html(),
      "securityGroupsTableHTML": this.securityGroupsTable.dataTableHTML,
      "clustersTableHTML": this.clustersTable.dataTableHTML,
      "createGeneralTab": "vntemplateCreateGeneralTab",
      "createBridgeTab": "vntemplateCreateBridgeTab",
      "createARTab": "vntemplateCreateARTab",
      "createSecurityTab": "vntemplateCreateSecurityTab",
      "createQoSTab": "vntemplateCreateQoSTab",
      "createContextTab": "vntemplateCreateContextTab"
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({formPanelId: this.formPanelId});
  }

  function _setup(context) {
    this.arTabObjects = {};
    var that = this;

    var number_of_ar = 0;

    $("#vnet_wizard_ar_btn", context).bind("click", function() {
      that.addARTab(number_of_ar, context);
      number_of_ar++;
      var mode = $("#network_mode", context).val();
      if (mode == "vcenter"){
        $(".sec_groups_datatable", context).hide();
      }
      return false;
    });

    $("#vntemplateCreateARTab #vntemplateCreateARTabUpdate", context).hide();

    $("#network_mode", context).change(function() {
      $("div.mode_param", context).hide();
      $("div.mode_param [wizard_field]", context).prop("wizard_field_disabled", true);
      $("input#vn_mad", context).removeAttr("required");
      $("input#vn_mad", context).removeAttr("value");
      $("#vcenter_switch_name", context).removeAttr("required");
      $("#vcenter_cluster_id select", context).removeAttr("required");
      $("#phydev", context).removeAttr("required");
      $(".sec_groups_datatable", context).show();
      $("#vntemplateCreateSecurityTab-label").show();
      $("#automatic_vlan_id option[value='NO']", context).show();
      $("input[wizard_field=\"VLAN_ID\"]", context).removeAttr("required");

      // vCenter
      $("div.mode_param.vcenter", context).hide();
      $("div.mode_param.vcenter [wizard_field]", context).prop("wizard_field_disabled", true);
      $("input#bridge", context).removeAttr("value");

      switch ($(this).val()) {
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
        $("#vntemplateCreateSecurityTab-label").hide();
        $("div.mode_param.ovswitch [wizard_field]", context).prop("wizard_field_disabled", false);

        $("input#bridge", context).removeAttr("required");
        break;
      case "ovswitch_vxlan":
        $("div.mode_param.ovswitch_vxlan", context).show();
        $("#vntemplateCreateSecurityTab-label").hide();
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
        $("#vntemplateCreateSecurityTab-label").hide();
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
    this.clustersTable.initialize();

    CustomTagsTable.setup($("#vntemplateCreateContextTab", context));

    Foundation.reflow(context, "tabs");
 
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

    // Remove AR given for errors
    if ($("#vntemplateCreateARTab #ar0Tab").length && $("#vntemplateCreateARTab #ar_tabar0").length){
      $("#vntemplateCreateARTab #ar0Tab").remove();
    }

    $("#vntemplateCreateARTab #vnet_wizard_ar_btn", context).click();

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
    a.on("click", "i.remove-tab", function(e) {
      e.stopPropagation();
      var target = $(this).parent().attr("href");
      var li = $(this).closest("li");
      var ul = $(this).closest("ul");
      var content = $("#vntemplateCreateARTab " + target);

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

    $.extend(network_json, WizardFields.retrieve($("#vntemplateCreateGeneralTab", context)));
    $.extend(network_json, WizardFields.retrieve($("#vntemplateCreateBridgeTab", context)));
    $.extend(network_json, WizardFields.retrieve($("#vntemplateCreateQoSTab", context)));
    $.extend(network_json, WizardFields.retrieve($("#vntemplateCreateContextTab", context)));

    var secgroups = this.securityGroupsTable.retrieveResourceTableSelect();
    if (secgroups != undefined && secgroups.length != 0) {
      network_json["SECURITY_GROUPS"] = secgroups.join(",");
    }

    var clusters = this.clustersTable.retrieveResourceTableSelect();
    if (clusters != undefined && clusters.length != 0) {
      network_json["CLUSTER_IDS"] = clusters.join(",");
    }

    $.extend(network_json, CustomTagsTable.retrieve($("#vntemplateCreateContextTab", context)));

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
        "vntemplate" : network_json,
        //"clusters": clusters
      };
      Sunstone.runAction("VNTemplate.create", network_json);
      return false;
    } else if (this.action == "update") {
      Sunstone.runAction("VNTemplate.update", this.resourceId, TemplateUtils.templateToString(network_json));
      return false;
    }
  }

  function _submitAdvanced(context) {
    var template = $("textarea#template", context).val();
    
    if (this.action == "create") {
      var vntemplate_json = {vntemplate: { vntemplate_raw: template}};
      Sunstone.runAction("VNTemplate.create", vntemplate_json);
      return false;

    } else if (this.action == "update") {
      Sunstone.runAction("VNTemplate.update", this.resourceId, template);
      return false;
    }
  }

  function _onShow(context) {
    var that = this;

    this.securityGroupsTable.refreshResourceTableSelect();
    this.clustersTable.refreshResourceTableSelect();

    $(".ar_tab", context).each(function() {
      var ar_id = $(this).attr("ar_id");
      if (that.arTabObjects[ar_id] != undefined) {
        that.arTabObjects[ar_id].onShow();
      }
    });

    if (this.action === "create"){
      $("div#vnet_cluster_table_div", context).show();
      // var cluster_id = $("div#vnet_cluster_id .resource_list_select", context).val();
      // if (!cluster_id) cluster_id = "0";

      // ResourceSelect.insert({
      //   context: $('#vnet_cluster_id', context),
      //   resourceName: 'Cluster',
      //   initValue: cluster_id
      // });
    } else {
      $("div#vnet_cluster_table_div", context).hide();
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
    $("input#bridge", context).removeAttr("required");
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

    WizardFields.fill($("#vntemplateCreateGeneralTab", context), element.TEMPLATE);
    WizardFields.fill($("#vntemplateCreateBridgeTab", context), element.TEMPLATE);
    WizardFields.fill($("#vntemplateCreateQoSTab", context), element.TEMPLATE);
    WizardFields.fill($("#vntemplateCreateContextTab", context), element.TEMPLATE);

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

    if (element.TEMPLATE["CLUSTERS"] != undefined &&
        element.TEMPLATE["CLUSTERS"].length != 0) {

      var clusters = element.TEMPLATE["CLUSTERS"].split(",");

      this.clustersTable.selectResourceTableSelect({ids : clusters});
    } else {
      this.clustersTable.refreshResourceTableSelect();
    }

    // Delete so these attributes don't end in the custom tags table also
    delete element.TEMPLATE["SECURITY_GROUPS"];

    var fields = $("[wizard_field]", context);

    fields.each(function() {
      var field = $(this);
      var field_name = field.attr("wizard_field");

      delete element.TEMPLATE[field_name];
    });

    CustomTagsTable.fill($("#vntemplateCreateContextTab", context), element.TEMPLATE);

    // Remove the first AR added in initialize_
    $("#vntemplateCreateARTab ul#vnet_wizard_ar_tabs i.remove-tab", context).trigger("click");
    $("#vntemplateCreateARTab #vntemplateCreateARTabUpdate", context).show();
    $("#vntemplateCreateARTab #vntemplateCreateARTabCreate", context).hide();
  }
});
