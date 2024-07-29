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
  var OpenNebulaAction = require("opennebula/action");
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var RoleTab = require("tabs/oneflow-templates-tab/utils/role-tab");
  var TemplateUtils = require("utils/template-utils");
  var UserInputs = require("utils/user-inputs");
  var ScheduleActions = require("utils/schedule_action");

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
  var RESOURCE = "service_create";

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      "create": {
        "title": Locale.tr("Create Service Template"),
        "buttonText": Locale.tr("Create"),
        "resetButton": true
      },
      "update": {
        "title": Locale.tr("Update Service Template"),
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
      "formPanelId": this.formPanelId,
      "userInputsHTML": UserInputs.html(),
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({
      "formPanelId": this.formPanelId
    });
  }

  function _setup(context) {
    this.networksType = [
      { value: "template_id", text: "Create", select: "vntemplates", extra: true },
      { value: "reserve_from", text: "Reserve", select: "networks", extra: true },
      { value: "id", text: "Existing", select: "networks", extra: false },
    ];
    
    // reset global variables on form
    this.roleTabObjects = {};
    var numberOfNetworks = 0;
    var roles_index = 0;
    var that = this;

    //this render a schedule action form
    $(".service_schedule_actions").append(
      ScheduleActions.htmlTable(
        resource = RESOURCE,
        leases = true,
        body = ScheduleActions.getScheduleActionTableContent(),
        isVM = false,
        canAdd = true
      )
    );

    // this is a logic to add, remove and edit schedule_action
    ScheduleActions.setupButtons(
      RESOURCE,
      context,
      that
    );
    // end of logic to add, remove and edit schedule_action

    $(".add_service_network", context).unbind("click");
    $(".add_service_network", context).bind("click", function() {
      var nic_index = numberOfNetworks;
      numberOfNetworks++;


      $(".service_networks tbody").append(
        "<tr id=\"network"+nic_index+"\">\
          <td>\
            <input class=\"service_network_name\" type=\"text\" data-index=\""+nic_index+"\" required />\
            <small class=\"form-error\"><br/>"+Locale.tr("Can only contain alphanumeric and underscore characters, and be unique")+"</small>\
          </td>\
          <td>\
            <textarea class=\"service_network_description\" />\
          </td>\
          <td>\
            <select class=\"service_network_type\" required></select>\
          </td>\
          <td>\
            <select class=\"service_network_id\">\
              <option value=\" \"></option>\
            </select>\
          </td>\
          <td>\
            <input disabled class=\"service_network_extra\" type=\"text\" />\
          </td>\
          <td style=\"text-align: right;\">\
            <a href=\"#\"><i class=\"fas fa-times-circle remove-tab\" data-index=\""+nic_index+"\"></i></a>\
          </td>\
        </tr>");

        that.networksType.map(function(type) {
          $(".service_network_type", "tr#network"+nic_index).append($("<option/>", {
            "value": type.value
          }).text(type.text));
        });

        $(".service_network_name", "tr#network"+nic_index).unbind("keyup");
        $(".service_network_name", "tr#network"+nic_index).bind("keyup", function(){
          // update pattern regex
          var otherNames = $("input.service_network_name").not($(this)).map(function() {
            return $(this).val();
          }).get().join("|");

          $(this).attr("pattern", "^(?!(" + otherNames + ")$)(^\\w+$)");

          _redo_service_networks_selector(context, that);
        });

        $(".service_network_type", "tr#network"+nic_index).unbind("change");
        $(".service_network_type", "tr#network"+nic_index).bind("change", function(){
          var selectedType = $(this).val();
          var serviceNetwork = $(this).closest("tr");

          var data = _get_networks();

          // 1. if val = reserve/existing or create
          $(".service_network_id", serviceNetwork).empty().append($("<option/>").text(""));

          // 2. create and fill selector
          var type = that.networksType.find(function(type) { return type.value === selectedType; });

          // 3. append selector after type
          type && data[type.select].map(function(net) {
            $(".service_network_id", serviceNetwork).append($("<option/>", {
              "value": net.ID
            }).text(net.NAME));
          });

          // 4. append extra after selector if reserve/create
          var disabled = type ? !type.extra : true;
          !disabled && $(".service_network_extra", serviceNetwork).empty();
          $(".service_network_extra", serviceNetwork).prop("disabled", disabled);
        });

        $("i.remove-tab", "tr#network"+nic_index).unbind("click");
        $("i.remove-tab", "tr#network"+nic_index).bind("click", function(){
          var tr = $(this).closest("tr");
          tr.remove();

          _redo_service_networks_selector(context, that, $(this).data("index"));
        });

        // trigger network type to load network options
        $(".service_network_type", "tr#network"+nic_index).val(that.networksType[0].value).change();
    });

    //$("#tf_btn_roles", context).unbind("click");
    $("#tf_btn_roles", context).bind("click", function(){
      that.addRoleTab(roles_index, context);
      roles_index++;
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
        $(tab_id+" .parent_roles_body #"+this, context).attr("checked", true);
      });
    });

    Foundation.reflow(context, "tabs");

    Tips.setup(context);
    UserInputs.setup(context);

    // Add first role
    $("#tf_btn_roles", context).click();

    return false;
  }

  function _submitWizard(context) {
    var that = this;
    var scheduleActions = ScheduleActions.retrieve(context);
    var name = $("input[name=\"service_name\"]", context).val();
    var description = $("#description", context).val();
    var deployment = $("select[name=\"deployment\"]", context).val();
    var shutdown_action_service = $("select[name=\"shutdown_action_service\"]", context).val();
    var ready_status_gate = $("input[name=\"ready_status_gate\"]", context).prop("checked");
    var automatic_deletion = $("input[name=\"automatic_deletion\"]", context).prop("checked");

    var custom_attrs =  {};
    var network_attrs = {};

    // get values for networks
    var attr_network = "network";
    $(".service_networks tbody > tr").each(function(){
      var row = $(this);
      var attr_name = $(".service_network_name", row).val();
      if (attr_name) {
        var attr_mandatory = "M";
        var attr_desc = ($(".service_network_description", row).val() || "");
        var attr_type = $(".service_network_type", row).val() || "";
        var attr_id = $(".service_network_id", row).val() || "";
        var type = that.networksType.find(function(type) { return type.value === attr_type; });
        var attr_extra = type.extra ? (":" + ($(".service_network_extra", row).val() || "")) : "";
        network_attrs[attr_name] =  attr_mandatory + "|" + attr_network + "|" + attr_desc + "| |" + attr_type + ":" + attr_id + attr_extra;
      }
    });

    var userInputsJSON = UserInputs.retrieve(context);
    $.each(userInputsJSON, function(key, value){
      var name = key.toUpperCase();
      custom_attrs[name] = value;
    });

    var roles = [];
    $(".role_content", context).each(function() {
      var role_id = $(this).attr("role_id");

      roles.push( that.roleTabObjects[role_id].retrieve($(this)) );
    });

    //this var is for validate if the request is a PUT or POST. PD: check why the update is a POST
    var post = true;

    //if exist schedule_actions add scheduleAction to each role
    if(scheduleActions){
      post = false;
      roles = roles.map(function(role) {
        if(role.vm_template_contents){
          var template_contents = TemplateUtils.stringToTemplate(role.vm_template_contents);
          var new_vm_template_contents = "";
          Object.keys(template_contents).forEach(function(element) {
            if(element !== "SCHED_ACTION"){
              new_vm_template_contents += TemplateUtils.templateToString({[element]: template_contents[element]});
            }
          });
          new_vm_template_contents += " "+ ScheduleActions.parseToRequestString(scheduleActions);
          role.vm_template_contents = new_vm_template_contents;
        }else{
          role.vm_template_contents = ScheduleActions.parseToRequestString(scheduleActions);
        }
        return role;
      });
    }

    var json_template = {
      name: name,
      deployment: deployment,
      description: description,
      roles: roles,
      ready_status_gate: ready_status_gate,
      automatic_deletion: automatic_deletion
    };

    //add networks in post body
    if (!$.isEmptyObject(network_attrs)){
      json_template["networks"] = network_attrs;
    }

    //add custom attributes in post body
    if (!$.isEmptyObject(custom_attrs)){
      json_template["custom_attrs"] = custom_attrs;
    }

    if (shutdown_action_service){
      json_template["shutdown_action"] = shutdown_action_service;
    }

    // add labels
    var currentInfo = Sunstone.getElementRightInfo(TAB_ID);
    if (
      currentInfo &&
      currentInfo.TEMPLATE &&
      currentInfo.TEMPLATE.BODY &&
      currentInfo.TEMPLATE.BODY.labels
    ) {
      json_template["labels"] = currentInfo.TEMPLATE.BODY.labels;
    }

    if (this.action == "create") {
      Sunstone.runAction("ServiceTemplate.create", json_template );
      return false;
    } else if (this.action == "update") {
      json_template['registration_time'] = that.old_template.registration_time;
      var templateStr = JSON.stringify(json_template);
      Sunstone.runAction("ServiceTemplate.update", this.resourceId, templateStr);
      return false;
    }
  }

  function _submitAdvanced(context) {
    var templateStr = $("textarea#template", context).val();
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

    $(".role_content", context).each(function() {
      var role_id = $(this).attr("role_id");
      that.roleTabObjects[role_id].onShow();
    });
  }

  function _fill(context, element) {
    var that = this;

    if (this.action != "update") {return;}
    this.setHeader(element);
    this.resourceId = element.ID;
    this.old_template = element.TEMPLATE.BODY;

    var arraySchedActions = [];

    //fill schedule actions
    if(this.old_template && 
      this.old_template.roles &&
      this.old_template.roles[0] &&
      this.old_template.roles[0].vm_template_contents
    ){
      var vm_template_contents = TemplateUtils.stringToTemplate(this.old_template.roles[0].vm_template_contents);
      if(vm_template_contents && vm_template_contents.SCHED_ACTION){
        arraySchedActions = Array.isArray(vm_template_contents.SCHED_ACTION)? vm_template_contents.SCHED_ACTION : [vm_template_contents.SCHED_ACTION];
      }

      $("#sched_service_create_actions_body").html(
        ScheduleActions.getScheduleActionTableContent(
          arraySchedActions
        )
      );
    }

    // Populates the Avanced mode Tab
    $("#template", context).val(JSON.stringify(element.TEMPLATE.BODY, null, "  "));

    $("#service_name", context).attr("disabled", "disabled");
    $("#service_name", context).val(element.NAME);

    $("#description", context).val(element.TEMPLATE.BODY.description);

    $("select[name=\"deployment\"]", context).val(element.TEMPLATE.BODY.deployment);
    $("select[name='shutdown_action_service']", context).val(element.TEMPLATE.BODY.shutdown_action);
    $("input[name='ready_status_gate']", context).prop("checked",element.TEMPLATE.BODY.ready_status_gate || false);
    $("input[name='automatic_deletion']", context).prop("checked",element.TEMPLATE.BODY.automatic_deletion || false);

    $(".service_networks i.remove-tab", context).trigger("click");

    //fill form networks
    if ( ! $.isEmptyObject( element.TEMPLATE.BODY["networks"] ) ) {
      $("div#network_configuration a.accordion_advanced_toggle", context).trigger("click");
      $.each(element.TEMPLATE.BODY["networks"], function(key, attr){
        // 0 mandatory; 1 network; 2 description; 3 empty; 4 info_network;
        var parts = attr.split("|");
        // 0 type; 1 id; 3(optional) extra
        var info = parts.slice(-1)[0].split(":");
        var attrs = {
          "name": key,
          "mandatory": parts[0] === "M" ? true : false,
          "network": parts[1],
          "description": parts[2],
          "empty": parts[3],
          "type": info[0],
          "id": info[1],
          "extra": info.slice(2).join(""),
        };

        if (parts[1] === "network") {
          $(".add_service_network", context).trigger("click");
          var tr = $(".service_networks tbody > tr", context).last();
          $(".service_network_name", tr).val(attrs.name).change();
          $(".service_network_description", tr).val(attrs.description).change();
          $(".service_network_type", tr).val(attrs.type).change();
          $(".service_network_id", tr).val(attrs.id).change();
          $(".service_network_extra", tr).val(attrs.extra).change();
        }
      });
    }

    //fill form custom attributes
    var custom_attrs = element.TEMPLATE.BODY["custom_attrs"];
    if (! $.isEmptyObject(custom_attrs)) {
      $("div#custom_attr_values a.accordion_advanced_toggle", context).trigger("click");
      UserInputs.fill(context, {"USER_INPUTS": custom_attrs});
    }

    // Remove role tabs
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

      var role_context = $(".role_content", context).last();
      var role_id = $(role_context).attr("role_id");

      that.roleTabObjects[role_id].fill(role_context, value, network_names);
    });

    $.each(element.TEMPLATE.BODY.roles, function(index, value){
        var role_context = $(".role_content", context)[index];
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
            $(".parent_roles_body #"+this, role_context).attr("checked", true);
          });
        }
    });
  }

  //----------------------------------------------------------------------------

  function _redo_service_networks_selector(dialog, template, nicToDelete){
    $("#roles_tabs_content .role_content", dialog).each(function(){
      _redo_service_networks_selector_role(dialog, this, template, nicToDelete);
    });
  }

  function _redo_service_networks_selector_role(dialog, role_section, template, nicToDelete){
    var checked_networks = [];
    $(".service_network_checkbox:checked", role_section).each(function(){
      var netIndex = $(this).data("index");
      var netName = $(this).val();
      checked_networks[netIndex] = { name: netName };
    });

    $(".alias_network_checkbox:checked", role_section).each(function(){
      var netIndex = $(this).data("index");
      if (checked_networks[netIndex]) {
        checked_networks[netIndex]["alias"] = true;
      }
    });

    var role_tab_id = $(role_section).attr("id");
    var str = "";
    $(".service_networks .service_network_name", dialog).each(function(){
      var index = $(this).data("index");
      var name = $(this).val();
      var regexp = new RegExp($(this).attr("pattern"), "gi");

      var checked = checked_networks[index];
      var wasChecked = checked ? "checked=\"checked\"" : "";
      var wasAlias = checked && checked["alias"] ? "checked=\"checked\"" : "";
      var canBeAlias = !checked ? "disabled=\"disabled\"" : "";

      // Condition 1: Be unique
      // Condition 2: Can only contain alphanumeric and underscore characters
      if (name && name !== "" && regexp.test(name)) {
        var idNetwork = role_tab_id + "_" + index;
        var idName = idNetwork + "_name";
        checked && (checked["name"] = name);

        str += "<tr id='"+idNetwork+"'>\
          <td style='width:20px;text-align:center;vertical-align:middle;'>\
            <input class='service_network_checkbox check_item'\
              type='checkbox' value='"+name+"' id='"+idName+"' data-index='"+index+"' "+wasChecked+" />\
          </td>\
          <td style='vertical-align:middle;'>\
            <label for='"+idName+"'>"+name+"</label>\
          </td>";

        str += "<td style='width:20px;text-align:center;vertical-align:middle;'>\
            <input class='alias_network_checkbox check_item' "+canBeAlias+"\
              type='checkbox' value='"+name+"' id='alias_"+idName+"' data-index='"+index+"' "+wasAlias+" />\
          </td>\
          <td style='width:100px;vertical-align:middle;'>\
            <label for='alias_"+idName+"'>As nic alias</label>\
          </td>";

          str += "<td class='parent_selector' style='width:50%;'>\
            <select class='form-control' " + (!wasAlias ? "hidden" : "required") + "\
              id='parent_"+idName+"' data-index='"+index+"' style='box-sizing:border-box;'>\
                <option value=''></option>\
            </select>\
          </td>";

        str += "</tr>";
      }
    });

    $(".networks_role_body", role_section).html(str);

    $(".networks_role_rdp", role_section).each(function(){
      str ? $(this).show() : $(this).hide();
    });

    if (template && template.roleTabObjects) {
      $(Object.values(template.roleTabObjects)).each(function() {
        this.refresh(checked_networks, nicToDelete);
      });
    }
  }

  function _add_role_tab(role_id, dialog) {
    var that = this;
    var html_role_id  = "role" + role_id;

    var role_tab = new RoleTab(html_role_id);
    that.roleTabObjects[role_id] = role_tab;

    // Append the new div containing the tab and add the tab to the list
    var role_section = $("<div id=\""+html_role_id+"Tab\" class=\"tabs-panel role_content wizard_internal_tab\" role_id=\""+role_id+"\">"+
        role_tab.html() +
    "</div>").appendTo($("#roles_tabs_content", dialog));

    _redo_service_networks_selector_role(dialog, role_section, that);

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
      var li = $(this).closest("li");
      var ul = $(this).closest("ul");
      var content = $(target);
      var role_id = content.attr("role_id");
      li.remove();
      content.remove();
      if (li.hasClass("is-active")) {
        $("a", ul.children("li").last()).click();
      }
      delete that.roleTabObjects[role_id];
      _redo_service_networks_selector(dialog, that);
      return false;
    });
    role_tab.setup(role_section);
    role_tab.onShow();
  }

  function _get_networks() {
    var networks = OpenNebulaAction.cache("VNET");
    if (networks === undefined) {
      Sunstone.runAction("Network.list");
      networks = OpenNebulaAction.cache("VNET");
    }
    networks = networks ? networks.data : [];

    var vntemplates = OpenNebulaAction.cache("VNTEMPLATE");
    if (vntemplates === undefined) {
      Sunstone.runAction("VNTemplate.list");
      vntemplates = OpenNebulaAction.cache("VNTEMPLATE");
    }
    vntemplates = vntemplates ? vntemplates.data : [];

    // Get networks list
    if (networks) {
      var data = Array.isArray(networks) ? networks : [];
      networks = data.map(function(net) {
        return ({
          ID: net.VNET.ID,
          NAME: net.VNET.NAME || "vnet-"+net.VNET.ID
        });
      });
    }

    // Get network templates list
    if (vntemplates) {
      var data = Array.isArray(vntemplates) ? vntemplates : [];
      vntemplates = data.map(function(temp) {
        return ({
          ID: temp.VNTEMPLATE.ID,
          NAME: temp.VNTEMPLATE.NAME || "vntemplate-"+template.VNTEMPLATE.ID
        });
      });
    }
    return ({ networks: networks, vntemplates: vntemplates });
  }

});
