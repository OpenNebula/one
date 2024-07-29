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

//  require("foundation.tab");
  var BaseFormPanel = require("utils/form-panels/form-panel");
  var Sunstone = require("sunstone");
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var OpenNebulaAction = require("opennebula/action");
  var OpenNebulaServiceTemplate = require("opennebula/servicetemplate");
  var OpenNebulaTemplate = require("opennebula/template");
  var Notifier = require("utils/notifier");
  var WizardFields = require("utils/wizard-fields");
  var UserInputs = require("utils/user-inputs");
  var Config = require("sunstone-config");
  var TemplateUtils = require("utils/template-utils");
  var ServiceUtils = require("utils/service-utils");
  var ScheduleActions = require("utils/schedule_action");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./instantiate/html");

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require("./instantiate/formPanelId");
  var TAB_ID = require("../tabId");
  var vm_group = "VM_GROUP";
  var classButton = "small button leases right radius";
  var RESOURCE_SCHED_ACTIONS = "inst_flow";

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.display_vmgroups = false;
    this.actions = {
      "instantiate": {
        "title": Locale.tr("Instantiate Service Template"),
        "buttonText": Locale.tr("Instantiate"),
        "resetButton": false
      }
    };

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.setTemplateId = _setTemplateId;
  FormPanel.prototype.htmlWizard = _html;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var values_hbs = {
      "formPanelId": this.formPanelId,
      "userInputsHTML": UserInputs.html(),
    };
    if(config && config.system_config && config.system_config.leases){
      values_hbs.userInputsCharters = ScheduleActions.htmlTable(
        resource = RESOURCE_SCHED_ACTIONS,
        leases = true,
        body = ScheduleActions.getScheduleActionTableContent(),
        isVM = false,
        canAdd = true
      );
    }
    return TemplateHTML(values_hbs);
  }

  function _setup(context) {
    var that = this;
    Tips.setup(context);
    ScheduleActions.setupButtons(
      RESOURCE_SCHED_ACTIONS,
      context,
      that
    );
    return false;
  }

  function _onShow(context) {
    var vmgroups = OpenNebulaAction.cache(vm_group);
    if(!vmgroups){
      Sunstone.runAction("VMGroup.list");
    }
  }

  function _setTemplateId(context, templateId) {
    var that = this;
    this.templateId = templateId;
    this.service_template_json = {};
    OpenNebulaServiceTemplate.show({
      data : {
        id: templateId
      },
      timeout: true,
      success: function (request, template_json){
        that.service_template_json = template_json;
        $(".name", context).text(template_json.DOCUMENT.NAME);
        $("#instantiate_service_user_inputs", context).empty();
        UserInputs.serviceTemplateInsert(
          $("#instantiate_service_user_inputs", context),
          template_json,
          { select_networks: Config.isFeatureEnabled("show_vnet_instantiate_flow") }
        );
        n_roles = template_json.DOCUMENT.TEMPLATE.BODY.roles.length;
        n_roles_done = 0;
        var total_cost = 0;
        var vmgroup_title = Locale.tr("Associate VM Group to Service");
        var setDisplayTitle = function(value=""){
          vmgroup_title = value;
        };
        $.each(template_json.DOCUMENT.TEMPLATE.BODY.roles, function(index, role){
          var div_id = "user_input_role_"+index;
          if(vmgroup_title && that.display_vmgroups){
            $("#instantiate_service_role_user_inputs", context).empty().prepend(
              $("<legend/>").text(vmgroup_title)
            );
            setDisplayTitle("");
          }
          $("#instantiate_service_role_user_inputs", context).append(
            $("<div/>",{id:div_id, class:"large-6 columns"})
          );
          OpenNebulaTemplate.show({
            data : {
              id: role.vm_template,
              extended: true
            },
            timeout: true,
            success: function (request, vm_template_json){
              that.vm_template_json = vm_template_json;
              $("#"+div_id, context).empty();
              //if (role.vm_template_contents){
                roleTemplate = TemplateUtils.stringToTemplate(role.vm_template_contents);
                if (roleTemplate.SCHED_ACTION){
                  $(".schedule_actions_values", context).html(
                    ScheduleActions.htmlTable(
                      resource = RESOURCE_SCHED_ACTIONS,
                      leases = true,
                      body = ScheduleActions.getScheduleActionTableContent(
                        roleTemplate.SCHED_ACTION
                      ),
                      isVM = false,
                      canAdd = true
                    )
                  );
                }
                if(roleTemplate && roleTemplate.APPEND){
                  var append = roleTemplate.APPEND.split(",");
                  $.each(append, function(key, value){
                    if (!that.vm_template_json.VMTEMPLATE.TEMPLATE[value]){
                      that.vm_template_json.VMTEMPLATE.TEMPLATE[value] = roleTemplate[value];
                    } else {
                      if (!Array.isArray(that.vm_template_json.VMTEMPLATE.TEMPLATE[value])){
                        that.vm_template_json.VMTEMPLATE.TEMPLATE[value] = [that.vm_template_json.VMTEMPLATE.TEMPLATE[value]];
                      }
                      if (Array.isArray(roleTemplate[value])){
                        $.each(roleTemplate[value], function(rkey, rvalue){
                          that.vm_template_json.VMTEMPLATE.TEMPLATE[value].push(rvalue);
                        });
                      } else {
                        that.vm_template_json.VMTEMPLATE.TEMPLATE[value].push(roleTemplate[value]);
                      }
                    }
                    delete roleTemplate[value];
                  });
                  delete roleTemplate.APPEND;
                }
                $.extend(true, that.vm_template_json.VMTEMPLATE.TEMPLATE, roleTemplate);
              //}
              if (vm_template_json.VMTEMPLATE.TEMPLATE["MEMORY_COST"] && vm_template_json.VMTEMPLATE.TEMPLATE["MEMORY_UNIT_COST"] && vm_template_json.VMTEMPLATE.TEMPLATE["MEMORY_UNIT_COST"] === "GB") {
                vm_template_json.VMTEMPLATE.TEMPLATE["MEMORY_COST"] = vm_template_json.VMTEMPLATE.TEMPLATE["MEMORY_COST"]*1024;
              }
              if (vm_template_json.VMTEMPLATE.TEMPLATE["DISK_COST"]) {
                vm_template_json.VMTEMPLATE.TEMPLATE["DISK_COST"] = vm_template_json.VMTEMPLATE.TEMPLATE["DISK_COST"]*1024;
              }
              var cost = OpenNebulaTemplate.cost(that.vm_template_json);
              if (cost !== 0 && Config.isFeatureEnabled("showback")) {
                total_cost += (cost * role.cardinality);

                $(".total_cost_div", context).show();
                $(".total_cost_div .cost_value", context).text((total_cost).toFixed(4));
              }

              var opts = {
                text_header: Locale.tr("Role") + " " + role.name
              };
              //vmgroups
              if(that.display_vmgroups){
                var vmgroups = OpenNebulaAction.cache(vm_group);
                if(vmgroups && vmgroups.data){
                  opts.vmgroups = vmgroups.data;
                  opts.role = role.name;
                  if(!Array.isArray(vmgroups.data)){
                    opts.vmgroups = [vmgroups.data];
                  }
                }
              }

              UserInputs.vmTemplateInsert(
                $("#"+div_id, context),
                vm_template_json,
                opts
              );
              n_roles_done += 1;
              if(n_roles_done === n_roles){
                Sunstone.enableFormPanelSubmit();
              }
            },
            error: function(request,error_json, container){
              Notifier.onError(request,error_json, container);
              $("#instantiate_vm_user_inputs", context).empty();
            }
          });
        });
      },
      error: function(request,error_json, container){
        Notifier.onError(request,error_json, container);
        $("#instantiate_service_user_inputs", context).empty();
      }
    });
  }

  //submit
  function _submitWizard(context) {
    var that = this;
    var service_name = $("#service_name",context).val();
    var n_times = $("#service_n_times",context).val();
    var n_times_int=1;
    if (n_times.length){
      n_times_int=parseInt(n_times,10);
    }
    var extra_info = ServiceUtils.getExtraInfo(
      context,
      Config.isFeatureEnabled("show_vnet_instantiate_flow")
    );
    var customAttrsValues = $.extend({}, extra_info.merge_template.custom_attrs_values);
    if(
      that &&
      that.service_template_json &&
      that.service_template_json.DOCUMENT &&
      that.service_template_json.DOCUMENT.TEMPLATE &&
      that.service_template_json.DOCUMENT.TEMPLATE.BODY
    ){
      if(that.service_template_json.DOCUMENT.TEMPLATE.BODY.custom_attrs){
        var customAttrs = that.service_template_json.DOCUMENT.TEMPLATE.BODY.custom_attrs;
        var optionalCustomAttrs = {};
        Object.keys(customAttrs).forEach(function(customAttrKey){
          customAttr = customAttrs[customAttrKey];
          customAttrSplit = customAttr.split("|");
          if(customAttrSplit[0] && customAttrSplit[0].toLowerCase() === "o"){
            optionalCustomAttrs[customAttrKey] = (customAttrSplit[4] && customAttrSplit[4]!==undefined)? customAttrSplit[4] : "";
          }
        });
        extra_info.merge_template.custom_attrs_values = $.extend({}, optionalCustomAttrs, extra_info.merge_template.custom_attrs_values);
      }
      if (that.service_template_json.DOCUMENT.TEMPLATE.BODY.roles) {
        var charters = "";
        var scheduleActionsList = ScheduleActions.retrieve(context, true);

        $.each(scheduleActionsList, function(_,sched_action){
          charters += TemplateUtils.templateToString(sched_action);
        });

        $.each(that.service_template_json.DOCUMENT.TEMPLATE.BODY.roles, function(index, role){
          var temp_role = $.extend({}, role);
          var temp_inputs = $.extend({}, WizardFields.retrieve($("#user_input_role_"+index, context)));
          var vm_template_contents = TemplateUtils.stringToTemplate(role.vm_template_contents);

          $.each(temp_inputs, function(inputName, inputValue) {
            if (Array.isArray(inputValue)) {
              delete temp_inputs[inputName];
              temp_inputs[inputName] = inputValue.join(",");
            }

            // removes duplicated inputs in context
            delete vm_template_contents[inputName];
          });

          temp_role.user_inputs_values = temp_inputs;
          temp_role.vm_template_contents = TemplateUtils.templateToString(vm_template_contents);

          var stringCustomValues = TemplateUtils.templateToString(customAttrsValues);
          if (stringCustomValues) {
            (temp_role.vm_template_contents)
              ? temp_role.vm_template_contents += stringCustomValues
              : temp_role.vm_template_contents = stringCustomValues;
          }
          $("#instantiate_service_role_user_inputs").find("select").each(function(_, vm_group){
            var element = $(vm_group);
            rolevm_group = element.attr("data-role");
            vm_group_value = element.children("option:selected").val();
            if(rolevm_group && role.name && rolevm_group === role.name && vm_group_value){
              if(temp_role.vm_template_contents === undefined){
                temp_role.vm_template_contents = "";
              }
              temp_role.vm_template_contents += TemplateUtils.templateToString({
                VMGROUP:{
                  ROLE: role.name,
                  VMGROUP_ID: vm_group_value
                }
              });
            }
          });
          if(charters.length){
            temp_role.vm_template_contents = charters;
          }
          extra_info.merge_template.roles.push(temp_role);
        });
        charters = "";
      }
    }
    if (!service_name.length){ //empty name
      for (var i=0; i< n_times_int; i++){
        Sunstone.runAction("ServiceTemplate.instantiate", that.templateId, extra_info);
      }
    } else {
      if (service_name.indexOf("%i") === -1){//no wildcard, all with the same name
        extra_info["merge_template"]["name"] = service_name;
        for (var i=0; i< n_times_int; i++){
          Sunstone.runAction(
              "ServiceTemplate.instantiate",
              that.templateId, extra_info);
        }
      } else { //wildcard present: replace wildcard
        for (var i=0; i< n_times_int; i++){
          extra_info["merge_template"]["name"] = service_name.replace(/%i/gi,i);
          Sunstone.runAction(
              "ServiceTemplate.instantiate",
              that.templateId, extra_info);
        }
      }
    }
    return false;
  }
});
