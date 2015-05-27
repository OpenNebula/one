define(function(require) {
  /*
    DEPENDENCIES
   */
  
  require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var CustomTags = require('utils/form-panels/custom-tags');
  var ArTab = require('tabs/vnets-tab/utils/ar-tab');
  var SecurityGroupsTable = require('tabs/secgroups-tab/datatable');
  var TemplateUtils = require('utils/template-utils');
  var WizardFields = require('utils/wizard-fields');

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require('hbs!./create/wizard');
  var TemplateAdvancedHTML = require('hbs!./create/advanced');
  
  /*
    CONSTANTS
   */
  
  var FORM_PANEL_ID = require('./create/formPanelId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'create': {
        'title': Locale.tr("Create Virtual Network"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      },
      'update': {
        'title': Locale.tr("Update Virtual Network"),
        'buttonText': Locale.tr("Update"),
        'resetButton': false
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
      'formPanelId': this.formPanelId,
      'customTagsHTML': CustomTags.html(),
      'securityGroupsTableHTML': this.securityGroupsTable.dataTableHTML
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

      context.foundation();

      return false;
    });

    // close icon: removing the tab on click
    $("#vnetCreateARTab", context).on("click", "i.remove-tab", function() {
      var target = $(this).parent().attr("href");
      var dd = $(this).closest('dd');
      var dl = $(this).closest('dl');
      var content = $(target);

      var ar_id = content.attr("ar_id");

      dd.remove();
      content.remove();

      if (dd.attr("class") == 'active') {
        $('a', dl.children('dd').last()).click();
      }

      delete that.arTabObjects[ar_id];

      return false;
    });

    $("#vnetCreateARTab #vnetCreateARTabUpdate", context).hide();

    $('#network_mode', context).change(function() {
      $('input,select#vlan,label[for!="network_mode"]', $(this).parent()).hide();
      $('input', $(this).parent()).val("");
      switch ($(this).val()) {
      case "default":
        $('input#bridge,label[for="bridge"]', context).show().prop('wizard_field_disabled', false);
        $('input#phydev,label[for="phydev"]', context).hide().prop('wizard_field_disabled', true);
        $('select#vlan,label[for="vlan"]', context).hide().prop('wizard_field_disabled', true);
        $('input#vlan_id,label[for="vlan_id"]', context).hide().prop('wizard_field_disabled', true);
        $('input#ip_spoofing,label[for="ip_spoofing"]', context).show().prop('wizard_field_disabled', false);
        $('input#mac_spoofing,label[for="mac_spoofing"]', context).show().prop('wizard_field_disabled', false);
        $('input#mtu,label[for="mtu"]', context).hide().prop('wizard_field_disabled', false);

        $('input#phydev', context).removeAttr('required');
        $('input#bridge', context).attr('required', '');
        break;
      case "802.1Q":
        $('input#bridge,label[for="bridge"]', context).show().prop('wizard_field_disabled', false);
        $('input#phydev,label[for="phydev"]', context).show().prop('wizard_field_disabled', false);
        $('select#vlan,label[for="vlan"]', context).show().prop('wizard_field_disabled', false);
        $('input#vlan_id,label[for="vlan_id"]', context).show().prop('wizard_field_disabled', false);
        $('input#ip_spoofing,label[for="ip_spoofing"]', context).show().prop('wizard_field_disabled', false);
        $('input#mac_spoofing,label[for="mac_spoofing"]', context).show().prop('wizard_field_disabled', false);
        $('input#mtu,label[for="mtu"]', context).show().prop('wizard_field_disabled', false);

        $('input#phydev', context).removeAttr('required');
        $('input#bridge', context).removeAttr('required');
        break;
      case "vxlan":
        $('input#bridge,label[for="bridge"]', context).show().prop('wizard_field_disabled', false);
        $('input#phydev,label[for="phydev"]', context).show().prop('wizard_field_disabled', false);
        $('select#vlan,label[for="vlan"]', context).show().prop('wizard_field_disabled', false);
        $('input#vlan_id,label[for="vlan_id"]', context).show().prop('wizard_field_disabled', false);
        $('input#ip_spoofing,label[for="ip_spoofing"]', context).show().prop('wizard_field_disabled', false);
        $('input#mac_spoofing,label[for="mac_spoofing"]', context).show().prop('wizard_field_disabled', false);
        $('input#mtu,label[for="mtu"]', context).show().prop('wizard_field_disabled', false);

        $('input#phydev', context).removeAttr('required');
        $('input#bridge', context).removeAttr('required');
        break;
      case "ebtables":
        $('input#bridge,label[for="bridge"]', context).show().prop('wizard_field_disabled', false);
        $('input#phydev,label[for="phydev"]', context).hide().prop('wizard_field_disabled', true);
        $('select#vlan,label[for="vlan"]', context).show().prop('wizard_field_disabled', false);
        $('input#vlan_id,label[for="vlan_id"]', context).hide().prop('wizard_field_disabled', true);
        $('input#ip_spoofing,label[for="ip_spoofing"]', context).show().prop('wizard_field_disabled', false);
        $('input#mac_spoofing,label[for="mac_spoofing"]', context).show().prop('wizard_field_disabled', false);
        $('input#mtu,label[for="mtu"]', context).hide().prop('wizard_field_disabled', false);

        $('input#phydev', context).removeAttr('required');
        $('input#bridge', context).attr('required', '');
        break;
      case "openvswitch":
        $('input#bridge,label[for="bridge"]', context).show().prop('wizard_field_disabled', false);
        $('input#phydev,label[for="phydev"]', context).hide().prop('wizard_field_disabled', true);
        $('select#vlan,label[for="vlan"]', context).show().prop('wizard_field_disabled', false);
        $('input#vlan_id,label[for="vlan_id"]', context).show().prop('wizard_field_disabled', false);
        $('input#ip_spoofing,label[for="ip_spoofing"]', context).hide().prop('wizard_field_disabled', true);
        $('input#mac_spoofing,label[for="mac_spoofing"]', context).show().prop('wizard_field_disabled', false);
        $('input#mtu,label[for="mtu"]', context).hide().prop('wizard_field_disabled', false);

        $('input#phydev', context).removeAttr('required');
        $('input#bridge', context).attr('required', '');
        break;
      case "vmware":
        $('input#bridge,label[for="bridge"]', context).show();
        $('input#phydev,label[for="phydev"]', context).hide();
        $('select#vlan,label[for="vlan"]', context).show();
        $('input#vlan_id,label[for="vlan_id"]', context).show();
        $('input#ip_spoofing,label[for="ip_spoofing"]', context).hide().prop('wizard_field_disabled', true);
        $('input#mac_spoofing,label[for="mac_spoofing"]', context).hide().prop('wizard_field_disabled', true);
        $('input#mtu,label[for="mtu"]', context).hide().prop('wizard_field_disabled', false);

        $('input#phydev', context).removeAttr('required');
        $('input#bridge', context).attr('required', '');
        break;
      }

      $("div.network_mode_description").hide();
      $('div.network_mode_description[value="' + $(this).val() + '"]').show();
    });

    //Initialize shown options
    $('#network_mode', context).trigger("change");

    this.securityGroupsTable.initialize();

    CustomTags.setup($("#vnetCreateContextTab", context));

    // Add first AR
    $("#vnet_wizard_ar_btn", context).trigger("click");

    $(document).foundation('reflow', 'tab');
    Tips.setup();
    return false;
  }

  function _add_ar_tab(ar_id, context) {
    var str_ar_tab_id  = 'ar' + ar_id;

    var ar_tab = new ArTab();
    this.arTabObjects[ar_id] = ar_tab;

    var html_tab_content =
      '<div id="' + str_ar_tab_id + 'Tab" class="ar_tab content" ar_id="' + ar_id + '">' +
        ar_tab.html(str_ar_tab_id) +
      '</div>';

    // Append the new div containing the tab and add the tab to the list
    var a = $("<dd><a id='ar_tab" + str_ar_tab_id + "' href='#" + str_ar_tab_id + "Tab'>" +
        Locale.tr("Address Range") + " <i class='fa fa-times-circle remove-tab'></i></a></dd>"
        ).appendTo($("dl#vnet_wizard_ar_tabs", context));

    $(html_tab_content).appendTo($("#vnet_wizard_ar_tabs_content", context));

    $("a", a).trigger("click");

    var ar_section = $('#' + str_ar_tab_id + 'Tab', context);
    ar_tab.setup(ar_section, str_ar_tab_id);
  }

  function _submitWizard(context) {
    var that = this;

    //Fetch values
    var network_json = {};

    $.extend(network_json, WizardFields.retrieve($("#vnetCreateGeneralTab", context)));
    $.extend(network_json, WizardFields.retrieve($("#vnetCreateBridgeTab", context)));
    $.extend(network_json, WizardFields.retrieve($("#vnetCreateContextTab", context)));

    var secgroups = this.securityGroupsTable.retrieveResourceTableSelect();
    if (secgroups != undefined && secgroups.length != 0) {
      network_json["SECURITY_GROUPS"] = secgroups.join(",");
    }

    $.extend(network_json, CustomTags.retrieve($("#vnetCreateContextTab", context)));

    $('.ar_tab', context).each(function() {
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
        "vnet" : network_json
      };

      Sunstone.runAction("Network.create", network_json);
      return false;
    } else if (this.action == "update") {
      Sunstone.runAction("Network.update", this.resourceId, TemplateUtils.convert_template_to_string(network_json));
      return false;
    }
  }

  function _submitAdvanced(context) {
    if (this.action == "create") {
      var template = $('textarea#template', context).val();
      var vnet_json = {vnet: {vnet_raw: template}};
      Sunstone.runAction("Network.create", vnet_json);
      return false;

    } else if (this.action == "update") {
      var template_raw = $('textarea#template', context).val();
      Sunstone.runAction("Network.update", this.resourceId, template_raw);
      return false;
    }
  }

  function _onShow(context) {
    var that = this;

    this.securityGroupsTable.refreshResourceTableSelect();

    $('.ar_tab', context).each(function() {
      var ar_id = $(this).attr("ar_id");
      that.arTabObjects[ar_id].onShow();
    });
  }

  function _fill(element, context) {
    if (this.action != "update") {return;}
    this.resourceId = element.ID;

    $("#default_sg_warning").hide();
    // Populates the Avanced mode Tab
    $('#template', context).val(TemplateUtils.convert_template_to_string(element.TEMPLATE).replace(/^[\r\n]+$/g, ""));

    $('[wizard_field="NAME"]', context).val(
        element.NAME). //TODO escapeDoubleQuotes(htmlDecode( element.NAME ))).
        prop("disabled", true).
        prop('wizard_field_disabled', true);

    WizardFields.fill($("#vnetCreateGeneralTab", context), element.TEMPLATE);
    WizardFields.fill($("#vnetCreateBridgeTab", context), element.TEMPLATE);
    WizardFields.fill($("#vnetCreateContextTab", context), element.TEMPLATE);

    // Show all network mode inputs, and make them not required. This will change
    // if a different network model is selected
    $('input#bridge,label[for="bridge"]', context).show().prop('wizard_field_disabled', false).removeAttr('required');
    $('input#phydev,label[for="phydev"]', context).show().prop('wizard_field_disabled', false).removeAttr('required');
    $('select#vlan,label[for="vlan"]', context).show().prop('wizard_field_disabled', false).removeAttr('required');
    $('input#vlan_id,label[for="vlan_id"]', context).show().prop('wizard_field_disabled', false).removeAttr('required');
    $('input#ip_spoofing,label[for="ip_spoofing"]', context).show().prop('wizard_field_disabled', false);
    $('input#mac_spoofing,label[for="mac_spoofing"]', context).show().prop('wizard_field_disabled', false);

    if (element.TEMPLATE["SECURITY_GROUPS"] != undefined &&
        element.TEMPLATE["SECURITY_GROUPS"].length != 0) {

      var secgroups = element.TEMPLATE["SECURITY_GROUPS"].split(",");

      this.securityGroupsTable.selectResourceTableSelect({ids : secgroups});
    } else {
      this.securityGroupsTable.refreshResourceTableSelect();
    }

    // Delete so these attributes don't end in the custom tags table also
    delete element.TEMPLATE["SECURITY_GROUPS"];

    var fields = $('[wizard_field]', context);

    fields.each(function() {
      var field = $(this);
      var field_name = field.attr('wizard_field');

      delete element.TEMPLATE[field_name];
    });

    CustomTags.fill($("#vnetCreateContextTab", context), element.TEMPLATE);

    // Remove the first AR added in initialize_
    $("#vnetCreateARTab i.remove-tab", context).trigger("click");
    $("#vnetCreateARTab #vnetCreateARTabUpdate", context).show();
    $("#vnetCreateARTab #vnetCreateARTabCreate", context).hide();
  }
});
