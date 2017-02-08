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
  var GroupRoleAffinity = require('tabs/vmgroup-tab/utils/group-role-affinity');
  var Utils = require('../utils/common');
  var Notifier = require('utils/notifier');

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
    this.group_roles_affinity = {};
    var that = this;
    var roles_index = 0;
    var group_roles_index = 0;

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
        if ($(this).val() != "" && ($(this).val() != $(tab_id+" #role_name", context).val())) {
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

    $("#btn_refresh_roles", context).bind("click", function(){
        $("#btn_refresh_roles", context).html("<i class='fa fa-angle-double-down'></i> "+Locale.tr("Refresh roles"));
        var role =  [];
        $("#list_roles_select").html("");
        $('.role_content', context).each(function() {
          var role_id = $(this).attr("role_id");
          var role = that.roleTabObjects[role_id].retrieve($(this));
          if(role.name){
            var html = "<input id="+ role.name +" type='checkbox' class='roles' value="+role.name+" />\
                      <label for="+ role.name+">"+role.name+"</label>\
                      <br />";
            $("#list_roles_select").append(html);
          }
      });
        $("#affinity",context).show();
    });

    $("#btn_group_vm_roles").bind("click", function(){
      var rolesSt = "";
      var numRoles = 0;
      $(".roles",context).each(function(){
        if($(this)[0].checked)
          rolesSt+= $(this)[0].id+",";
          numRoles++;
      });
      if(rolesSt != "" && numRoles > 1){
        var affinity = $("#value_affinity", context).val();
        _add_group_affinity_box(rolesSt.slice(0,-1), context, group_roles_index, that.group_roles_affinity);
        group_roles_index++;
      }
      else{
        Notifier.notifyError(Locale.tr("You have to choose at least two roles."));
      }
    });
      
    $("#affinity",context).hide();
    Foundation.reflow(context, 'tabs');

    // Add first role
    $("#tf_btn_roles", context).trigger("click");

    Tips.setup();

    return false;
  }

  function _submitWizard(context) {
    that = this;
    var name = WizardFields.retrieveInput($('#vm_group_name', context));
    var description = WizardFields.retrieveInput($('#vm_group_description', context));

    var role =  [];
    var roles_affinity ={};
    roles_affinity["AFFINED"] = [];
    roles_affinity["ANTI_AFFINED"] = [];

    //RETRIEVE ALL GROUPS OF AFFINITY ROLES
    $('.group_role_content', context).each(function() {
      var group_role_id = $(this).attr("group_role_id");
      var group_role = that.group_roles_affinity[group_role_id];
      roles_affinity[group_role.getAffinity()].push(group_role.retrieve($(this)));
    });

    $('.role_content', context).each(function() {
      var role_id = $(this).attr("role_id");
      role.push(that.roleTabObjects[role_id].retrieve($(this)));
    });
    //call to role-tab.js for retrieve data
    
    var vm_group_json = {
      "NAME" : name,
      "DESCRIPTION": description,
      "ROLE" : role,
    };

    vm_group_json = $.extend(vm_group_json, roles_affinity);

    if (this.action == "create") {
      vm_group_json = {
        "vm_group" : vm_group_json
      };
      Sunstone.runAction("VMGroup.create",JSON.parse(JSON.stringify(vm_group_json)));
      return false;
    } else if (this.action == "update") {
      delete vm_group_json["NAME"];

      Sunstone.runAction(
        "VMGroup.update",
        this.resourceId,
        TemplateUtils.templateToString(vm_group_json));

      return false;
    }
  }

  function _submitAdvanced(context) {
    if (this.action == "create") {
      var template = $('textarea#template', context).val();
      var vm_group_json = {vm_group: {vm_group_raw: template}};
      Sunstone.runAction("VMGroup.create",vm_group_json);
      return false;
    } else if (this.action == "update") {
      var template_raw = $('textarea#template', context).val();
      Sunstone.runAction("VMGroup.update_template", this.resourceId, template_raw);
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
    var group_roles_index = 0;

    // Populates the Avanced mode Tab
    $('#template', context).val(TemplateUtils.templateToString(element.TEMPLATE));

    WizardFields.fillInput($('#vm_group_name',context), element.NAME);
    $('#vm_group_name',context).prop("disabled", true);

    WizardFields.fillInput($('#vm_group_description', context), element.TEMPLATE.DESCRIPTION );

    var roles_names = [];
    var data = [];
    if(Array.isArray(element.ROLES.ROLE))
      data = element.ROLES.ROLE;
    else
      data.push(element.ROLES.ROLE);

    $.each(data, function(index, value){
      roles_names.push(value.NAME);

      $("#tf_btn_roles", context).click();

      var role_context = $('.role_content', context).last();
      var role_id = $(role_context).attr("role_id");

      that.roleTabObjects[role_id].fill(role_context, value,element);
    });

    $.each(data, function(index, value){
      var role_context = $('.role_content', context)[index];
      var str = "";

      $.each(roles_names, function(){
        if (this != value.NAME) {
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

    $.each(element.TEMPLATE, function(affinity, value){
      if(affinity == "AFFINED" || affinity == "ANTI_AFFINED"){
        if(Array.isArray(value)){
          for(dbs in value){
            _add_group_affinity_box(value[dbs],context, group_roles_index, that.group_roles_affinity, affinity);
            group_roles_index++;
          }
        }
        else{
          _add_group_affinity_box(value, context, group_roles_index, that.group_roles_affinity, affinity);
          group_roles_index++;
        }
      }
    });

    //Remove first tab role, is empty.
    var role_context_first = $('.role_content', context).first();
    var role_id_first = $(role_context_first).attr("role_id");
    $('i.remove-tab', context).first().click();
    delete that.roleTabObjects[role_id_first];
    $("#tf_btn_roles", context).click();


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

  function _redo_service_vmgroup_selector_role(dialog, role_section){
    $('#roles_tabs_content .role_content', dialog).each(function(){
      var role_section = this;
      var role_tab_id = $(role_section).attr('id');
    });
  }

  function _add_group_affinity_box(rolesSt, context, group_roles_index, group_roles_affinity, affinity){
    var that = this;
    var index = group_roles_index;
    var group_roles_id  = 'group_role_' + group_roles_index;
    var group_role = new GroupRoleAffinity(group_roles_id, rolesSt, affinity);
    group_roles_affinity[group_roles_index] = group_role;
    var html = '<div id="'+group_roles_id+'" class="group_role_content" group_role_id="'+group_roles_index+'">' + group_role.html() + '</div>';
    $("#group_vm_roles").append(html);
    $(".group_roles").on("click", "i.remove_group_affinity", function() {
      $(this.parentElement.parentElement).remove();
      delete group_roles_affinity[index];
      return false;
    });
  }
});
