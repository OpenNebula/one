/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
  var Notifier = require('utils/notifier');
//  require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var RoleTab = require('tabs/oneflow-templates-tab/utils/role-tab');
  var TemplateUtils = require('utils/template-utils');
  var CustomTagsTable = require('utils/custom-tags-table');
  var CustomClassCustomAttrs = 'service_custom_attr';
  var CustomClassCustomAttrsButton = 'add_service_custom_attr';

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
      'formPanelId': this.formPanelId,
      'customTagsTableHTML': CustomTagsTable.html(
        CustomClassCustomAttrs,
        CustomClassCustomAttrsButton, 
        true
      )
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
            <small class="form-error"><br/>'+Locale.tr("Can only contain alphanumeric and underscore characters")+'</small>\
          </td>\
          <td>\
            <textarea class="service_network_description"/>\
          </td>\
          <td>\
            <a href="#"><i class="fas fa-times-circle remove-tab"></i></a>\
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


    Foundation.reflow(context, 'tabs');

    // Add first role
    $("#tf_btn_roles", context).trigger("click");

    Tips.setup(context);
    CustomTagsTable.setup(context, true);
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
    var network_attrs = {};

    // get values for networks
    var attr_type = "vnet_id";
    $(".service_networks tbody > tr").each(function(){
      var attr_name = $(".service_network_name", $(this)).val();
      if (attr_name) {
        var attr_desc = $(".service_network_description", $(this)).val() || '';
        network_attrs[attr_name] = "M|" + attr_type + "|" + attr_desc;
      }
    });

    // get values for custom attributes
    $("."+CustomClassCustomAttrs+" tbody.custom_tags > tr").each(function(){
      var row = $(this);
      var attr_name = $(".custom_tag_key", row).val();
      if (attr_name) {
        var attr_type = $(".custom_tag_mandatory", row).val()? $(".custom_tag_mandatory", row).val() : 'M';
        var attr_desc = $(".custom_tag_value", row).val()? "|"+$(".custom_tag_value", row).val() : '';
        var attr_default = $(".custom_tag_default", row).val()? "|"+$(".custom_tag_default", row).val() : '';
        custom_attrs[attr_name] = attr_type + attr_desc + attr_default;
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

    //add networks in post body
    if (!$.isEmptyObject(network_attrs)){
      json_template['networks'] = network_attrs;
    }

    //add custom attributes in post body
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
    var templateStr = $('textarea#template', context).val();
    if (this.action == "create") {
      Sunstone.runAction("ServiceTemplate.create", JSON.parse(templateStr) );
      return false;
    } else if (this.action == "update") {
      Sunstone.runAction("ServiceTemplate.update", this.resourceId, templateStr);
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
    this.setHeader(element);
    this.resourceId = element.ID;

    // Populates the Avanced mode Tab
    $('#template', context).val(JSON.stringify(element.TEMPLATE.BODY, null, "  "));


    $("#service_name", context).attr("disabled", "disabled");
    $("#service_name", context).val(element.NAME);

    $("#description", context).val(element.TEMPLATE.BODY.description);

    $('select[name="deployment"]', context).val(element.TEMPLATE.BODY.deployment);
    $("select[name='shutdown_action_service']", context).val(element.TEMPLATE.BODY.shutdown_action);
    $("input[name='ready_status_gate']", context).prop("checked",element.TEMPLATE.BODY.ready_status_gate || false);


    $(".service_networks i.remove-tab", context).trigger("click");

    //fill form networks
    if ( ! $.isEmptyObject( element.TEMPLATE.BODY['networks'] ) ) {
      $("div#network_configuration a.accordion_advanced_toggle", context).trigger("click");
      $.each(element.TEMPLATE.BODY['networks'], function(key, attr){
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
            var tr = $(".service_networks tbody > tr", context).last();
            $(".service_network_name", tr).val(attrs.name).change();
            $(".service_network_description", tr).val(attrs.description);
            break;
        }
      });
    }

    //fill form custom attributes
    if ( ! $.isEmptyObject( element.TEMPLATE.BODY['custom_attrs'] ) ) {
      $("div#custom_attr_values a.accordion_advanced_toggle", context).trigger("click");
      $.each(element.TEMPLATE.BODY['custom_attrs'], function(key, attr){
        var parts = attr.split("|");
        // 0 mandatory; 1 desc;
        var attrs = {
          "name": key,
          "mandatory": parts[0],
          "description": parts[1],
          'default': parts[2]
        };
        var tr = $("."+CustomClassCustomAttrs+" tbody.custom_tags > tr", context).last();
        if($(".custom_tag_key", tr).val()){
          $("."+CustomClassCustomAttrsButton, context).trigger("click");
          tr = $("."+CustomClassCustomAttrs+" tbody.custom_tags > tr", context).last();
        }
        $(".custom_tag_key", tr).val(attrs.name);

        if(attrs.mandatory){
          var select = $(".custom_tag_mandatory", tr);
          select.find("option").removeAttr("selected");
          var selected = select.find("option[value="+attrs.mandatory+"]").attr("selected","selected");
        }
        $(".custom_tag_value", tr).val(attrs.description);
        $(".custom_tag_default", tr).val(attrs.default);
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


      $.each(selected_networks, function(){
        $(".service_network_checkbox[value='"+this+"']", role_section).attr('checked', true).change();
      });
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

    _redo_service_networks_selector_role(dialog, role_section);

    Tips.setup(role_section);

    var a = $("<li class='tabs-title'>\
      <a class='text-center' id='"+html_role_id+"' href='#"+html_role_id+"Tab'>\
        <span>\
          <i class='off-color fas fa-cube fa-3x'/>\
          <br>\
          <span id='role_name_text'>"+Locale.tr("Role ")+role_id+"</span>\
        </span>\
        <i class='fas fa-times-circle remove-tab'></i>\
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

});
