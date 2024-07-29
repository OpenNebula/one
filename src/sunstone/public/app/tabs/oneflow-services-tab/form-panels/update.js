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

  var InstantiateTemplateFormPanel = require('tabs/oneflow-services-tab/form-panels/update/update');
  var Locale = require('utils/locale');
  var RoleTab = require('tabs/oneflow-services-tab/utils/role-tab');
  var TemplatesTable = require('tabs/oneflow-templates-tab/datatable');
  var Tips = require('utils/tips');

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./update/formPanelId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    InstantiateTemplateFormPanel.call(this);
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.display_vmgroups = true;
    this.actions = {
      'update': {
        'title': Locale.tr("Update Service"),
        'buttonText': Locale.tr("Update"),
        'resetButton': true
      }
    };
    this.templatesTable = new TemplatesTable('service_update', {'select': true});
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(InstantiateTemplateFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;
  FormPanel.prototype.fill = _fill;
  FormPanel.prototype.addRoleTab = _add_role_tab;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */
  function _setup(context) {
    var that = this;
    this.roleTabObjects = {};

    InstantiateTemplateFormPanel.prototype.setup.call(this, context);

    $(".selectTemplateTable", context).html(
          '<br/>' + this.templatesTable.dataTableHTML + '<br/>');

    this.templatesTable.initialize();

    $(".instantiate_wrapper", context).hide();

    this.templatesTable.idInput().off("change").on("change", function(){
      $(".instantiate_wrapper", context).show();
      var template_id = $(this).val();
      that.setTemplateId(context, template_id);
    });

    that.roles_index = 0;

    $("#tf_btn_roles", context).bind("click", function(){
      that.addRoleTab(that.roles_index, context);
      that.roles_index++;
    });

    // Fill parents table
    // Each time a tab is clicked the table is filled with existing tabs (roles)
    // Selected roles are kept
    // TODO If the name of a role is changed and is selected, selection will be lost
    $("#roles_tabs", context).off("click", "a");
    $("#roles_tabs", context).on("click", "a", function() {
      var tab_id = "#"+this.id+"Tab";
      var str = "";

      $(tab_id+" .parent_roles").hide();
      var parent_role_available = false;

      $("#roles_tabs_content #role_name", context).each(function(){
        if ($(this).val() && ($(this).val() != $(tab_id+" #role_name", context).val())) {
          parent_role_available = true;
          str += "<tr>\
            <td style='width:20px;text-align:center;'>\
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

    Tips.setup(context);
    return false;
  }

  function _onShow(context) {
    this.templatesTable.refreshResourceTableSelect();
    InstantiateTemplateFormPanel.prototype.onShow.call(this, context);
  }

  function _fill(context, element) {
    var that = this;

    if (this.action != "update") {return;}
    this.setHeader(element);
    this.resourceId = element.ID;

    $("#service_name", context).attr("disabled", "disabled");
    $("#service_name", context).val(element.NAME);

    $("#description", context).val(element.TEMPLATE.BODY.description);

    $('select[name="deployment"]', context).val(element.TEMPLATE.BODY.deployment);
    $("select[name='shutdown_action_service']", context).val(element.TEMPLATE.BODY.shutdown_action);
    $("input[name='ready_status_gate']", context).prop("checked",element.TEMPLATE.BODY.ready_status_gate || false);
    $("input[name='automatic_deletion']", context).prop("checked",element.TEMPLATE.BODY.automatic_deletion || false);

    // Remove role tabs
    $("#roles_tabs i.remove-tab", context).trigger("click");

    var roles_names = [];
    $.each(element.TEMPLATE.BODY.roles, function(index, value){
      roles_names.push(value.name);

      $("#tf_btn_roles", context).click();

      var role_context = $('.role_content', context).last();
      var role_id = $(role_context).attr("role_id");

      that.roleTabObjects[role_id].fill(role_context, value, []);
    });

    $.each(element.TEMPLATE.BODY.roles, function(index, value){
        var role_context = $('.role_content', context)[index];
        var str = "";

        $.each(roles_names, function(){
          if (this != value.name) {
            str += "<tr>\
              <td style='width:20px;'>\
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

    return false;
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
