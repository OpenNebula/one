/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

  require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var RoleTab = require('tabs/oneflow-templates-tab/utils/role-tab');
  var TemplateUtils = require('utils/template-utils');

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
        'title': Locale.tr("Create Service Template"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      },
      'update': {
        'title': Locale.tr("Update Service Template"),
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
    return TemplateWizardHTML({
      'formPanelId': this.formPanelId
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({
      'formPanelId': this.formPanelId
    });
  }

  function _setup(context) {
    this.roleTabObjects = {};
    var that = this;

    var roles_index = 0;

    $(".add_service_network", context).on("click", function(){
      $(".service_networks tbody").append(
        '<tr>\
          <td>\
            <input class="service_network_name" type="text" pattern="^\\w+$"/>\
            <small class="error">'+Locale.tr("Can only contain alphanumeric and underscore characters")+'</small>\
          </td>\
          <td>\
            <textarea class="service_network_description"/>\
          </td>\
          <td>\
            <a href="#"><i class="fa fa-times-circle remove-tab"></i></a>\
          </td>\
        </tr>');
    });

    $(".add_service_network", context).trigger("click");

    context.on("change", ".service_network_name", function(){
      _redo_service_networks_selector(context);
    });

    context.on("click", ".service_networks i.remove-tab", function(){
      var tr = $(this).closest('tr');
      tr.remove();

      _redo_service_networks_selector(context);
    });

    $("#tf_btn_roles", context).bind("click", function(){
      that.addRoleTab(roles_index, context);
      roles_index++;

      context.foundation();

      return false;
    });

    // close icon: removing the tab on click
    $("#roles_tabs", context).on("click", "i.remove-tab", function() {
      var target = $(this).parent().attr("href");
      var dd = $(this).closest('dd');
      var dl = $(this).closest('dl');
      var content = $(target);

      var role_id = content.attr("role_id");

      dd.remove();
      content.remove();

      if (dd.attr("class") == 'active') {
        $('a', dl.children('dd').last()).click();
      }

      delete that.roleTabObjects[role_id];

      return false;
    });

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


    $(document).foundation('tab', 'reflow');

    // Add first role
    $("#tf_btn_roles", context).trigger("click");

    Tips.setup(context);
    return false;
  }

  function _submitWizard(context) {
    var that = this;

    var name = $('input[name="service_name"]', context).val();
    var description = $('#description', context).val();
    var deployment = $('select[name="deployment"]', context).val();
    var shutdown_action_service = $('select[name="shutdown_action_service"]', context).val();
    var ready_status_gate = $('input[name="ready_status_gate"]', context).prop("checked");

    var custom_attrs =  {};

    $(".service_networks tbody tr").each(function(){
      if ($(".service_network_name", $(this)).val()) {
        var attr_name = $(".service_network_name", $(this)).val();
        var attr_type = "vnet_id";
        var attr_desc = $(".service_network_description", $(this)).val();
        custom_attrs[attr_name] = "M|" + attr_type + "|" + attr_desc;
      }
    });

    var roles = [];

    $('.role_content', context).each(function() {
      var role_id = $(this).attr("role_id");

      roles.push( that.roleTabObjects[role_id].retrieve($(this)) );
    });

    var json_template = {
      name: name,
      deployment: deployment,
      description: description,
      roles: roles
    };

    if (!$.isEmptyObject(custom_attrs)){
      json_template['custom_attrs'] = custom_attrs;
    }

    if (shutdown_action_service){
      json_template['shutdown_action'] = shutdown_action_service;
    }

    json_template['ready_status_gate'] = ready_status_gate;

    if (this.action == "create") {
      Sunstone.runAction("ServiceTemplate.create", json_template );
      return false;
    } else if (this.action == "update") {
      Sunstone.runAction("ServiceTemplate.update",this.resourceId, JSON.stringify(json_template));
      return false;
    }
  }

  function _submitAdvanced(context) {
    var json_template = $('textarea#template', context).val();

    if (this.action == "create") {
      Sunstone.runAction("ServiceTemplate.create", JSON.parse(json_template) );
      return false;
    } else if (this.action == "update") {
      Sunstone.runAction("ServiceTemplate.update", this.resourceId, json_template);
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

    if (this.action != "update") {return;}
    this.resourceId = element.ID;

    // Populates the Avanced mode Tab
    $('#template', context).val(TemplateUtils.htmlDecode(
                          JSON.stringify(element.TEMPLATE.BODY, null, "  ")));


    $("#service_name", context).attr("disabled", "disabled");
    $("#service_name", context).val(TemplateUtils.htmlDecode(element.NAME));

    $("#description", context).val(TemplateUtils.htmlDecode(element.TEMPLATE.BODY.description));

    $('select[name="deployment"]', context).val(element.TEMPLATE.BODY.deployment);
    $("select[name='shutdown_action_service']", context).val(element.TEMPLATE.BODY.shutdown_action);
    $("input[name='ready_status_gate']", context).prop("checked",element.TEMPLATE.BODY.ready_status_gate || false);


    $(".service_networks i.remove-tab", context).trigger("click");

    if ( ! $.isEmptyObject( element.TEMPLATE.BODY['custom_attrs'] ) ) {
      $("div#network_configuration a.accordion_advanced_toggle", context).trigger("click");

      $.each(element.TEMPLATE.BODY['custom_attrs'], function(key, attr){
        var parts = attr.split("|");
        // 0 mandatory; 1 type; 2 desc;
        var attrs = {
          "name": key,
          "mandatory": parts[0],
          "type": parts[1],
          "description": parts[2],
        };

        switch (parts[1]) {
          case "vnet_id":
            $(".add_service_network", context).trigger("click");

            var tr = $(".service_networks tbody tr", context).last();
            $(".service_network_name", tr).val(TemplateUtils.htmlDecode(attrs.name)).change();
            $(".service_network_description", tr).val(TemplateUtils.htmlDecode(attrs.description));

            break;
        }
      });
    }

    $("#roles_tabs i.remove-tab", context).trigger("click");

    var network_names = [];

    $(".service_networks .service_network_name", context).each(function(){
      if ($(this).val()) {
        network_names.push($(this).val());
      }
    });

    var roles_names = [];
    $.each(element.TEMPLATE.BODY.roles, function(index, value){
      roles_names.push(value.name);

      $("#tf_btn_roles", context).click();

      var role_context = $('.role_content', context).last();
      var role_id = $(role_context).attr("role_id");

      that.roleTabObjects[role_id].fill(role_context, value, network_names);
    });

    $.each(element.TEMPLATE.BODY.roles, function(index, value){
        var role_context = $('.role_content', context)[index];
        var str = "";

        $.each(roles_names, function(){
          if (this != value.name) {
            str += "<tr>\
              <td style='width:10%'>\
                <input class='check_item' type='checkbox' value='"+this+"' id='"+this+"'/>\
              </td>\
              <td>"+this+"</td>\
            </tr>";
          }
        });

        $(".parent_roles_body", role_context).html(str);

        if (value.parents) {
          $.each(value.parents, function(index, value){
            $(".parent_roles_body #"+this, role_context).attr('checked', true);
          });
        }
    });
  }

  //----------------------------------------------------------------------------

  function _redo_service_networks_selector(dialog){
    $('#roles_tabs_content .role_content', dialog).each(function(){
      var role_section = this;
      _redo_service_networks_selector_role(dialog, role_section);
    });
  }

  function _redo_service_networks_selector_role(dialog, role_section){
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

      $(".networks_role_body", role_section).html(str);

      if (service_networks) {
        $(".networks_role", role_section).show();
      }

      $(".vm_template_contents", role_section).val("");

      $.each(selected_networks, function(){
        $(".service_network_checkbox[value='"+this+"']", role_section).attr('checked', true).change();
      });
    });
  }

  function _add_role_tab(role_id, dialog) {
    var html_role_id  = 'role' + role_id;

    var role_tab = new RoleTab(html_role_id);
    this.roleTabObjects[role_id] = role_tab;

    // Append the new div containing the tab and add the tab to the list
    var role_section = $('<div id="'+html_role_id+'Tab" class="content role_content wizard_internal_tab" role_id="'+role_id+'">'+
        role_tab.html() +
    '</div>').appendTo($("#roles_tabs_content", dialog));

    _redo_service_networks_selector_role(dialog, role_section);

    var a = $("<dd>\
      <a class='text-center' id='"+html_role_id+"' href='#"+html_role_id+"Tab'>\
        <span>\
          <i class='off-color fa fa-cube fa-3x'/>\
          <br>\
          <span id='role_name_text'>"+Locale.tr("Role ")+role_id+"</span>\
        </span>\
        <i class='fa fa-times-circle remove-tab'></i>\
      </a>\
    </dd>").appendTo($("dl#roles_tabs", dialog));

    $("a", a).trigger("click");

    role_tab.setup(role_section);
    role_tab.onShow();
  }

});
