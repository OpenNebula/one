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
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var TemplateUtils = require('utils/template-utils');
  var WizardFields = require('utils/wizard-fields');
  var VNetsTable = require('tabs/vnets-tab/datatable');
  var Utils = require('../utils/common');

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
        'title': Locale.tr("Create Security Group"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      },
      'update': {
        'title': Locale.tr("Update Security Group"),
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

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {

    var opts = {
      info: false,
      select: true
    };

    this.vnetsTable = new VNetsTable("new_sg_rule", opts);

    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
      'vnetsTableHTML': this.vnetsTable.dataTableHTML
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({formPanelId: this.formPanelId});
  }

  function _setup(context) {
    var that = this;
    context.off("change", '.security_group_rule_protocol');
    context.on("change", '.security_group_rule_protocol', function(){
      $('.range_row', context).hide();
      $('.range_row input', context).removeAttr('required');

      $('.icmp_type_wrapper', context).hide();
      $('.icmpv6_type_wrapper', context).hide();

      switch ($(this).val()) {
      case "TCP":
      case "UDP":
        $('.range_row', context).show();
        $(".range_row select", context).trigger("change");
        break;
      case "ICMP":
        $('.icmp_type_wrapper', context).show();
        break;
      case "ICMPv6":
        $('.icmpv6_type_wrapper', context).show();
        break;
      case "IPSEC":
      case "ALL":
        break;
      }
    });

    context.off("change", '.security_group_rule_network_sel');
    context.on("change", '.security_group_rule_network_sel', function(){
      $('.security_group_rule_network',context).hide();
      $('div.security_group_rule_network input',context).removeAttr('required');
      that.vnetsTable.idInput().removeAttr("required");

      $('.vnet_select',context).hide();

      switch ($(this).val()) {
      case "ANY":
        break;
      case "NETWORK":
        $('.security_group_rule_network',context).show();
        $('div.security_group_rule_network input',context).attr('required', '');
        break;
      case "VNET":
        $('.vnet_select',context).show();
        that.vnetsTable.idInput().attr("required", "");

        that.vnetsTable.refreshResourceTableSelect();

        break;
      }
    });

    context.off("change", '.security_group_rule_range_sel');
    context.on("change", '.security_group_rule_range_sel', function(){
      switch ($(this).val()) {
      case "ALL":
        $('.security_group_rule_range', context).hide();
        $(".security_group_rule_range input", context).removeAttr('required');
        break;
      case "RANGE":
        $('.security_group_rule_range', context).show();
        $(".security_group_rule_range input", context).attr('required', '');
        break;
      }
    });

    $('#rules_form_wizard',context)
      .off('forminvalid.zf.abide').off('formvalid.zf.abide').off("submit");

    Foundation.reInit($('#rules_form_wizard',context));

    $('#rules_form_wizard',context)
      .on('forminvalid.zf.abide', function(ev, frm) {
      })
      .on('formvalid.zf.abide', function(ev, frm) {
        var rule = {};
        rule["PROTOCOL"] = WizardFields.retrieveInput($(".security_group_rule_protocol", context));
        rule["RULE_TYPE"] = WizardFields.retrieveInput($(".security_group_rule_type", context));

        switch ($('.security_group_rule_range_sel', context).val()) {
        case "ALL":
          break;
        case "RANGE":
          rule["RANGE"] = WizardFields.retrieveInput($(".security_group_rule_range input", context));
          break;
        }

        switch ($('.security_group_rule_network_sel', context).val()) {
        case "ANY":
          break;
        case "NETWORK":
          rule["IP"] = WizardFields.retrieveInput($('#security_group_rule_first_ip', context));
          rule["SIZE"] = WizardFields.retrieveInput($('#security_group_rule_size', context));
          break;
        case "VNET":
          rule["NETWORK_ID"] = that.vnetsTable.retrieveResourceTableSelect();
          break;
        }

        if (rule["PROTOCOL"] == "ICMP" ){
          var icmp_type_val = WizardFields.retrieveInput($(".security_group_rule_icmp_type", context));

          if (icmp_type_val != ""){
            rule["ICMP_TYPE"] = icmp_type_val;
          }
        }

         if (rule["PROTOCOL"] == "ICMPv6" ){
          var icmpv6_type_val = WizardFields.retrieveInput($(".security_group_rule_icmpv6_type", context));

          if (icmpv6_type_val != ""){
            rule["ICMPv6_TYPE"] = icmpv6_type_val;
          }
        }

        var text = Utils.sgRuleToSt(rule);

        $(".security_group_rules tbody", context).append(
            '<tr>\
              <td>'+text.PROTOCOL+'</td>\
              <td>'+text.RULE_TYPE+'</td>\
              <td>'+text.RANGE+'</td>\
              <td>'+text.NETWORK+'</td>\
              <td>'+text.ICMP_TYPE+'</td>\
              <td>'+text.ICMPv6_TYPE+'</td>\
              <td>\
                <a href="#"><i class="fas fa-times-circle remove-tab"></i></a>\
              </td>\
            </tr>');

        // Add data to tr element
        $(".security_group_rules tbody", context).children("tr").last().data("rule", rule);

        // Reset new rule fields
        $('#new_rule_wizard select option', context).prop('selected', function() {
          return this.defaultSelected;
        });

        $('#new_rule_wizard select', context).trigger("change");

        $('#new_rule_wizard input', context).val("");

        that.vnetsTable.resetResourceTableSelect();
      })
      .on("submit", function(ev) {
        ev.preventDefault();
      });

    context.off("click", ".security_group_rules i.remove-tab");
    context.on("click", ".security_group_rules i.remove-tab", function(){
      var tr = $(this).closest('tr');
      tr.remove();
    });

    this.vnetsTable.initialize();

    Tips.setup();

    $('#new_rule_wizard select', context).trigger("change");

    return false;
  }

  function _submitWizard(context) {
    var name = WizardFields.retrieveInput($('#security_group_name', context));
    var description = WizardFields.retrieveInput($('#security_group_description', context));

    var rules =  [];

    $(".security_group_rules tbody tr").each(function(){
      rules.push($(this).data("rule"));
    });

    var security_group_json = {
      "NAME" : name,
      "DESCRIPTION": description,
      "RULE" : rules
    };

    if (this.action == "create") {
      security_group_json = {
        "security_group" : security_group_json
      };

      Sunstone.runAction("SecurityGroup.create",security_group_json);
      return false;
    } else if (this.action == "update") {

      var update_json = $.extend({},this.element.TEMPLATE,security_group_json)

      delete update_json["NAME"];

      Sunstone.runAction(
        "SecurityGroup.update",
        this.resourceId,
        TemplateUtils.templateToString(update_json));

      return false;
    }
  }

  function _submitAdvanced(context) {
    if (this.action == "create") {
      var template = $('textarea#template', context).val();
      var security_group_json = {security_group: {security_group_raw: template}};
      Sunstone.runAction("SecurityGroup.create",security_group_json);
      return false;
    } else if (this.action == "update") {
      var template_raw = $('textarea#template', context).val();
      Sunstone.runAction("SecurityGroup.update", this.resourceId, template_raw);
      return false;
    }
  }

  function _onShow(context) {
    this.vnetsTable.refreshResourceTableSelect();
  }

  function _fill(context, element) {
    this.element = element;
    var that = this;

    this.setHeader(element);
    this.resourceId = element.ID;

    // Populates the Avanced mode Tab
    $('#template', context).val(TemplateUtils.templateToString(element.TEMPLATE));

    WizardFields.fillInput($('#security_group_name',context), element.NAME);
    $('#security_group_name',context).prop("disabled", true);

    WizardFields.fillInput($('#security_group_description', context), element.TEMPLATE.DESCRIPTION );

    var rules = element.TEMPLATE.RULE;

    if (!rules) { //empty
      rules = [];
    }
    else if (rules.constructor != Array) { //>1 rule
      rules = [rules];
    }

    $.each(rules, function(){
      var text = Utils.sgRuleToSt(this);

      $(".security_group_rules tbody", context).append(
        '<tr>\
        <td>'+text.PROTOCOL+'</td>\
        <td>'+text.RULE_TYPE+'</td>\
        <td>'+text.RANGE+'</td>\
        <td>'+text.NETWORK+'</td>\
        <td>'+text.ICMP_TYPE+'</td>\
        <td>'+text.ICMPv6_TYPE+'</td>\
        <td>\
        <a href="#"><i class="fas fa-times-circle remove-tab"></i></a>\
        </td>\
        </tr>');

      $(".security_group_rules tbody", context).children("tr").last().data("rule", this);
    });
  }
});