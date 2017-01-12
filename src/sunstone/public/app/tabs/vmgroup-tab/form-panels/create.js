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

//  require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var TemplateUtils = require('utils/template-utils');
  var WizardFields = require('utils/wizard-fields');
  var RoleTab = require('tabs/vmgroup-tab/utils/role-tab');

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
        'title': Locale.tr("Create Virtual Machine Group"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      },
      'update': {
        'title': Locale.tr("Update Virtual Machine Group"),
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
  FormPanel.prototype.addRoleTab = _add_role_tab;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {

    var opts = {
      info: false,
      select: true
    };

    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({formPanelId: this.formPanelId});
  }

  function _setup(context) {
    this.roleTabObjects = {};
    var that = this;
    var roles_index = 0;

    // Fill parents table
    // Each time a tab is clicked the table is filled with existing tabs (roles)
    // Selected roles are kept
    // TODO If the name of a role is changed and is selected, selection will be lost
    $("#roles_tabs", context).on("click", "a", function() {
      var tab_id = "#"+this.id+"Tab";
      var str = "";

      $(tab_id+" .parent_roles").hide();
      var parent_role_available = false;

      $("#roles_tabs_content #role_name", context).each(function(){
        if ($(this).val() && ($(this).val() != $(tab_id+" #role_name", context).val())) {
          parent_role_available = true;
          str += "<tr>\
            <td style='width:10%'>\
              <input class='check_item' type='checkbox' value='"+$(this).val()+"' id='"+$(this).val()+"'/>\
            </td>\
            <td>"+$(this).val()+"</td>\
          </tr>";
        }
      });

      if (parent_role_available) {
        $(tab_id+" .parent_roles", context).show();
      }

      var selected_parents = [];
      $(tab_id+" .parent_roles_body input:checked", context).each(function(){
        selected_parents.push($(this).val());
      });

      $(tab_id+" .parent_roles_body", context).html(str);

      $.each(selected_parents, function(){
        $(tab_id+" .parent_roles_body #"+this, context).attr('checked', true);
      });
    });

    $("#tf_btn_roles", context).bind("click", function(){
      that.addRoleTab(roles_index, context);
      roles_index++;

      return false;
    });

    Foundation.reflow(context, 'tabs');

    // Add first role
    $("#tf_btn_roles", context).trigger("click");

    Tips.setup();

    return false;
  }

  function _submitWizard(context) {

    var name = WizardFields.retrieveInput($('#vm_group_name', context));
    var description = WizardFields.retrieveInput($('#vm_group_description', context));

    var rules =  [];

    $(".vm_group_rules tbody tr").each(function(){
      rules.push($(this).data("rule"));
    });

    var vm_group_json = {
      "NAME" : name,
      "DESCRIPTION": description,
      "RULE" : rules
    };

    if (this.action == "create") {
      vm_group_json = {
        "vmgroup" : vm_group_json
      };

      Sunstone.runAction("VMGroup.create",vm_group_json);
      return false;
    } else if (this.action == "update") {
      delete vm_group_json["NAME"];

      Sunstone.runAction(
        "vmGroup.update",
        this.resourceId,
        TemplateUtils.templateToString(vm_group_json));

      return false;
    }
  }

  function _submitAdvanced(context) {
    if (this.action == "create") {
      var template = $('textarea#template', context).val();
      var vm_group_json = {vm_group: {vm_group_raw: template}};
      Sunstone.runAction("vmGroup.create",vm_group_json);
      return false;
    } else if (this.action == "update") {
      var template_raw = $('textarea#template', context).val();
      Sunstone.runAction("vmGroup.update", this.resourceId, template_raw);
      return false;
    }
  }

  function _onShow(context) {
    var that = this;

    $('.role_content', context).each(function() {
      var role_id = $(this).attr("role_id");
      that.roleTabObjects[role_id].onShow();
    });
  }

  function _fill(context, element) {
    var that = this;

    this.setHeader(element);
    this.resourceId = element.ID;

    // Populates the Avanced mode Tab
    $('#template', context).val(TemplateUtils.templateToString(element.TEMPLATE));

    WizardFields.fillInput($('#vm_group_name',context), element.NAME);
    $('#vm_group_name',context).prop("disabled", true);

    WizardFields.fillInput($('#vm_group_description', context), element.TEMPLATE.DESCRIPTION );

    var rules = element.TEMPLATE.RULE;

    if (!rules) { //empty
      rules = [];
    }
    else if (rules.constructor != Array) { //>1 rule
      rules = [rules];
    }

    $.each(rules, function(){
      var text = Utils.sgRuleToSt(this);

      $(".vm_group_rules tbody", context).append(
        '<tr>\
        <td>'+text.PROTOCOL+'</td>\
        <td>'+text.RULE_TYPE+'</td>\
        <td>'+text.RANGE+'</td>\
        <td>'+text.NETWORK+'</td>\
        <td>'+text.ICMP_TYPE+'</td>\
        <td>\
        <a href="#"><i class="fa fa-times-circle remove-tab"></i></a>\
        </td>\
        </tr>');

      $(".vm_group_rules tbody", context).children("tr").last().data("rule", this);
    });
  }

  function _add_role_tab(role_id, dialog) {
    var that = this;
    var html_role_id  = 'role' + role_id;

    var role_tab = new RoleTab(html_role_id);
    that.roleTabObjects[role_id] = role_tab;

    // Append the new div containing the tab and add the tab to the list
    var role_section = $('<div id="'+html_role_id+'Tab" class="tabs-panel role_content wizard_internal_tab" role_id="'+role_id+'">'+
        role_tab.html() +
    '</div>').appendTo($("#roles_tabs_content", dialog));

    _redo_service_vmgroup_selector_role(dialog, role_section);

    Tips.setup(role_section);

    var a = $("<li class='tabs-title'>\
      <a class='text-center' id='"+html_role_id+"' href='#"+html_role_id+"Tab'>\
        <span>\
          <i class='off-color fa fa-cube fa-3x'/>\
          <br>\
          <span id='role_name_text'>"+Locale.tr("Role ")+role_id+"</span>\
        </span>\
        <i class='fa fa-times-circle remove-tab'></i>\
      </a>\
    </li>").appendTo($("ul#roles_tabs", dialog));

    Foundation.reInit($("ul#roles_tabs", dialog));
    $("a", a).trigger("click");

    // close icon: removing the tab on click
    a.on("click", "i.remove-tab", function() {
      var target = $(this).parent().attr("href");
      var li = $(this).closest('li');
      var ul = $(this).closest('ul');
      var content = $(target);

      var role_id = content.attr("role_id");

      li.remove();
      content.remove();

      if (li.hasClass('is-active')) {
        $('a', ul.children('li').last()).click();
      }

      delete that.roleTabObjects[role_id];

      return false;
    });

    role_tab.setup(role_section);
    role_tab.onShow();
  }

  function _redo_service_vmgroup_selector(dialog){
    $('#roles_tabs_content .role_content', dialog).each(function(){
      var role_section = this;
      _redo_service_vmgroup_selector_role(dialog, role_section);
    });
  }

  function _redo_service_vmgroup_selector_role(dialog, role_section){
    $('#roles_tabs_content .role_content', dialog).each(function(){
      var role_section = this;

      var selected_networks = [];
      $(".service_network_checkbox:checked", role_section).each(function(){
        selected_networks.push($(this).val());
      });

      $(".networks_role", role_section).hide();
      var service_networks = false;

      var role_tab_id = $(role_section).attr('id');

      var str = "";
      $(".service_networks .service_network_name", dialog).each(function(){
        if ($(this).val()) {
          service_networks = true;
          str += "<tr>\
            <td style='width:10%'>\
              <input class='service_network_checkbox check_item' type='checkbox' value='"+$(this).val()+"' id='"+role_tab_id+"_"+$(this).val()+"'/>\
            </td>\
            <td>\
              <label for='"+role_tab_id+"_"+$(this).val()+"'>"+$(this).val()+"</label>\
            </td>\
          </tr>";
        }
      });

      if (service_networks) {
        $(".networks_role", role_section).show();
      }

      $.each(selected_networks, function(){
        $(".service_network_checkbox[value='"+this+"']", role_section).attr('checked', true).change();
      });
    });
  }
});
