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
  var BaseFormPanel = require("utils/form-panels/form-panel");
  var Sunstone = require("sunstone");
  var Locale = require("utils/locale");
  var TemplateUtils = require("utils/template-utils");
  var WizardFields = require("utils/wizard-fields");
  var RoleTab = require("tabs/vmgroup-tab/utils/role-tab");
  var AffinityRoleTab = require("tabs/vmgroup-tab/utils/affinity-role-tab");
  var Notifier = require("utils/notifier");

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

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.affinity_role_tab = new AffinityRoleTab([]);
    this.actions = {
      "create": {
        "title": Locale.tr("Create Virtual Machine Group"),
        "buttonText": Locale.tr("Create"),
        "resetButton": true
      },
      "update": {
        "title": Locale.tr("Update Virtual Machine Group"),
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
  FormPanel.prototype.addRoleTab = _add_role_tab;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateWizardHTML({
      "affinity-role-tab": this.affinity_role_tab.html(),
      "formPanelId": this.formPanelId
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({formPanelId: this.formPanelId});
  }

  function _setup(context) {
    this.roleTabObjects = {};
    var that = this;
    var roles_index = 0;

    this.affinity_role_tab.setup(context);

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
      $(tab_id + " .parent_roles_body input:checked", context).each(function(){
        selected_parents.push($(this).val());
      });

      $(tab_id + " .parent_roles_body", context).html(str);

      $.each(selected_parents, function(){
        $(tab_id + " .parent_roles_body #" + this, context).attr("checked", true);
      });
    });


    $("#tf_btn_roles", context).bind("click", function(){
      that.addRoleTab(roles_index, context);
      roles_index++;

      return false;
    });

    Foundation.reflow(context, "tabs");

    // Add first role
    $("#tf_btn_roles", context).trigger("click");

    return false;
  }

  function _submitWizard(context) {
    that = this;
    var name = TemplateUtils.removeHTMLTags(WizardFields.retrieveInput($("#vm_group_name", context)));
    var description = TemplateUtils.removeHTMLTags(WizardFields.retrieveInput($("#vm_group_description", context)));

    var role = [];

    $(".role_content", context).each(function() {
      var role_id = $(this).attr("role_id");
      role.push(that.roleTabObjects[role_id].retrieve($(this)));
    });

    var roles_affinity = this.affinity_role_tab.retrieve(context);
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
      var template = $("textarea#template", context).val();
      var vm_group_json = { vm_group: { vm_grp_raw: template } };
      Sunstone.runAction("VMGroup.create", vm_group_json);
      return false;
    } else if (this.action == "update") {
      var template_raw = $("textarea#template", context).val();
      Sunstone.runAction("VMGroup.update_template", this.resourceId, template_raw);
      return false;
    }
  }

  function _onShow(context) {
    var that = this;
    $(".role_content", context).each(function() {
      var role_id = $(this).attr("role_id");
      that.roleTabObjects[role_id].onShow();
    });
  }

  function _fill(context, element) {
    $("#new_role", context)[0].parentElement.remove();
    var that = this;
    this.setHeader(element);
    this.resourceId = element.ID;

    $("#template", context).val(TemplateUtils.templateToString(element.TEMPLATE));

    WizardFields.fillInput($("#vm_group_name",context), element.NAME);
    $("#vm_group_name",context).prop("disabled", true);

    WizardFields.fillInput($("#vm_group_description", context), element.TEMPLATE.DESCRIPTION );

    //Remove row of roles
    if (!Array.isArray(element.ROLES.ROLE)){
      element.ROLES.ROLE = [element.ROLES.ROLE];
    }

    $.each(element.ROLES.ROLE, function(index, value){
      var name = value.NAME;
      if (name){
        var html = "<option id='" + name + "' class='roles' value=" + name + "> " + name + "</option>";
        $("#list_roles_select").append(html);
        $("select #" + name).mousedown(function(e) {
          e.preventDefault();
          $(this).prop("selected", !$(this).prop("selected"));
          return false;
        });
      }
    });

    this.affinity_role_tab.fill(context, element);
    $("#btn_refresh_roles", context).remove();
    $("#affinity", context).show();
  }

  function _add_role_tab(role_id, dialog) {
    var that = this;
    var html_role_id  = "role" + role_id;

    var role_tab = new RoleTab(html_role_id);
    that.roleTabObjects[role_id] = role_tab;

    //Append the new div containing the tab and add the tab to the list
    var role_section = $("<div id=\""+html_role_id+"Tab\" class=\"tabs-panel role_content wizard_internal_tab\" role_id=\""+role_id+"\">"+
        role_tab.html() +
    "</div>").appendTo($("#roles_tabs_content", dialog));

    _redo_service_vmgroup_selector_role(dialog, role_section);

    role_section.on("change", "#role_name", function(){
      var val = true;
      var chars = ["/","*","&","|",":", String.fromCharCode(92),"\"", ";", "/",String.fromCharCode(39),"#","{","}","$","<",">","*"];
      var newName = $(this).val();
      $.each(chars, function(index, value){
        if(newName.indexOf(value) != -1 && val){
          val = false;
        }
      });
      if (val){
        that.affinity_role_tab.refresh($(this).val(), role_tab.oldName());
        role_tab.changeNameTab(newName);
      } else {
        Notifier.notifyError(Locale.tr("The new role name contains invalid characters."));
      }
    });

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
      var li = $(this).closest("li");
      var ul = $(this).closest("ul");
      var content = $(target);

      var role_id = content.attr("role_id");

      li.remove();
      content.remove();

      if (li.hasClass("is-active")) {
        $("a", ul.children("li").last()).click();
      }
      that.affinity_role_tab.removeRole(role_tab.oldName());
      delete that.roleTabObjects[role_id];

      return false;
    });

    role_tab.setup(role_section);
    role_tab.onShow();
  }

  function _redo_service_vmgroup_selector_role(dialog, role_section){
    $("#roles_tabs_content .role_content", dialog).each(function(){
      var role_section = this;
      var role_tab_id = $(role_section).attr("id");
    });
  }
});
