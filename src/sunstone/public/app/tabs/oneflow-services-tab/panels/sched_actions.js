/* -------------------------------------------------------------------------- */
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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

  var Config = require("sunstone-config");
  var Sunstone = require("sunstone");
  var Actions = require("opennebula/action");
  var Service = require("opennebula/service");
  var Locale = require("utils/locale");
  var Notifier = require("utils/notifier");
  var ScheduleActions = require("utils/schedule_action");
  var TemplateUtils = require("utils/template-utils");
  var Leases = require("utils/leases");
  var OpenNebulaAction = require("../../../opennebula/action");
  var Humanize = require("utils/humanize");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./sched-actions/html");


  /*
    CONSTANTS
   */

  var PANEL_ID = require("./sched-actions/panelId");
  var RESOURCE = "Service";
  var RESOURCE_SCHED_ACTIONS = "flow";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.icon = "fa-calendar-alt";
    this.title = Locale.tr("Actions");
    this.id = (info && info.DOCUMENT && info.DOCUMENT.ID) || "0";
    this.body = (info && info.DOCUMENT && info.DOCUMENT.TEMPLATE && info.DOCUMENT.TEMPLATE.BODY) || {};
    this.data = (this.body && this.body.roles) || [];

    this.actions = [
      "terminate",
      "terminate-hard",
      "hold",
      "release",
      "stop",
      "suspend",
      "resume",
      "reboot",
      "reboot-hard",
      "poweroff",
      "poweroff-hard",
      "undeploy",
      "undeploy-hard",
      "snapshot-create",
      "snapshot-delete",
      "snapshot-revert",
      "disk-snapshot-create",
      "disk-snapshot-delete",
      "disk-snapshot-revert"
    ];
    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function actionRow(scheduling_action) {
    var done_str    = scheduling_action.DONE ? (Humanize.prettyTime(scheduling_action.DONE)) : "";
    var message_str = scheduling_action.MESSAGE ? scheduling_action.MESSAGE : "";
    var action_id = scheduling_action.ID || "";
    var update_sched = "";
    if(action_id){
      update_sched = "<button id='minus_"+scheduling_action.ID+ "' class='small button btn-warning edit_action_x' data_id='"+action_id+"'><i class='fas fa-edit'></i></button>";
    }
    var str = "<td class='done_row'>" + done_str + "</td>\
       <td class='message_row'>" + TemplateUtils.htmlEncode(message_str) + "</td>\
       <td colspan='3' style='text-align: right;'>\
         <div style='display: flex;justify-content: flex-end;'>\
          <div>\
            <button id='minus_" + scheduling_action.ID + "' class='small button btn-danger remove_action_x'><i class='fas fa-trash-alt'></i></button>\
          </div>\
          <div>"+update_sched+"</div>\
       </td>\
     </tr>";
    return str;
  }

  function actionsTable(parseData) {
    var str = "";
    var empty = "\
      <tr id=\"no_actions_tr\">\
          <td colspan=\"6\">" + Locale.tr("No actions to show") + "</td>\
      </tr>";
    if (!parseData) {
      return empty;
    } else {
      var sched_actions = Array.isArray(parseData)? parseData : [parseData];
      if (sched_actions.length <= 0) {
        return empty;
      }
      $.each(sched_actions, function(index, scheduling_action) {
        if(scheduling_action && scheduling_action.ID){
          var className = "";
          var idTD = "<td class=\"id_row\"></td>";
          var id = 0;
          if(scheduling_action.ID){
            className = "_"+scheduling_action.ID;
            idTD = "<td class=\"id_row\">" + TemplateUtils.htmlEncode(scheduling_action.ID) + "</td>";
            id = scheduling_action.ID;
          }
          str += "<tr class='tr_action"+className+"' data='" + JSON.stringify(scheduling_action) + "'>";
          str += idTD;
          var actions = ScheduleActions.fromJSONtoActionsTable([scheduling_action], id, true);
          str += actions;
          str += actionRow(scheduling_action);
        }
      });
    }
    return str;
  }


  function _htmlSchedActions(vmTemplateContents){
    var parseData = TemplateUtils.stringToTemplate(vmTemplateContents);
    return "<div class='row'>\
    <div class='large-12 columns'>\
      <table id='scheduling_"+RESOURCE_SCHED_ACTIONS+"_actions_table' class='info_table dataTable'>\
       <thead>\
         <tr>\
            <th>" + Locale.tr("ID") + "</th>\
            <th>" + Locale.tr("Action") + "</th>\
            <th>" + Locale.tr("Time") + "</th>\
            <th>" + Locale.tr("Rep") + "</th>\
            <th>" + Locale.tr("End") + "</th>\
            <th>" + Locale.tr("Done") + "</th>\
            <th>" + Locale.tr("Message") + "</th>\
            <th colspan=''> </th>\
            <th><button id='add_scheduling_"+RESOURCE_SCHED_ACTIONS+"_action' class='button small success right radius' >" + Locale.tr("Add action") + "</button></th>\
            <th>" +
              Leases.html() +
            "</th>\
         </tr>\
        </thead>\
        <tbody id='sched_vms_actions_body' class='scheduling_place'>"+
          actionsTable(parseData && parseData.SCHED_ACTION) +
       "</tbody>\
       </table>\
      </div>\
    </div>";
  }

  function _html() {
    var optionsActions = this.actions.map(function(ac){
      return "<option value='"+ac+"'>"+ac+"</option>";
    }).join("");

    var optionsRoles = this.data
      .filter(function(role) {
        return role && role.name;
      })
      .map(function(role){
        return "<option value='"+role.name+"'>"+role.name+"</option>";
      });

    optionsRoles.unshift("<option value=''>"+Locale.tr("All Roles")+"</option>");
    optionsRoles = optionsRoles.join("");

    return TemplateHTML({
      sched_actions_table: _htmlSchedActions(this.data[0].vm_template_contents),
      actions: optionsActions,
      res: RESOURCE,
      roles: optionsRoles
    });
  }

  function findMaxID(items) {
    return items.reduce((acc, val) => {
        acc = ( acc === undefined || val.ID > acc ) ? val.ID : acc;
        return acc;
    }, 0);
  }

  function addID(actns){
    acc = findMaxID(actns);
    return actns.map(el=>{
      if(el && !el.ID){
        acc = el.ID = parseInt(acc, 10)+1;
      }
      return el;
    });
  }

  /*** update schedule actions ***/
  function updateNodes(that, callback, type = "replace"){
    if(callback && typeof callback === "function" && that && that.data){
      var roles = Array.isArray(that.data)? that.data : [that.data];
      var updateService = true;
      roles.forEach(function(element){
        if(element && element.vm_template_contents !== undefined && element.nodes){
          var jsonTemplateContents = TemplateUtils.stringToTemplate(element.vm_template_contents);
          var nodes = Array.isArray(element.nodes)? element.nodes : [element.nodes];
          nodes.forEach(element => {
            if(element && element.vm_info && element.vm_info.VM && element.vm_info.VM.ID){
              OpenNebulaAction.show({
                data:{
                  id: element.vm_info.VM.ID
                },
                success: function(req, res){
                  var executedCallback = callback(jsonTemplateContents && jsonTemplateContents.SCHED_ACTION);
                  var userTemplate = res && res.VM && res.VM.USER_TEMPLATE || {};
                  var newUserTemplate = {};
                  switch (type) {
                    case "add":
                      var userTemplateSchedActions = userTemplate && userTemplate.SCHED_ACTION || [];
                      if(userTemplateSchedActions && executedCallback){
                        var newActions = Array.isArray(userTemplateSchedActions) ? userTemplateSchedActions : [userTemplateSchedActions];
                        if(Array.isArray(executedCallback)){
                          newActions = newActions.concat(executedCallback);
                        }else{
                          newActions.push(executedCallback);
                        }
                        newUserTemplate = addID(newActions);
                      }
                    break;
                    default:
                      if(executedCallback){
                        newUserTemplate = addID(executedCallback);
                      }
                    break;
                  }
                  userTemplate.SCHED_ACTION = newUserTemplate;
                  //this update the VM
                  OpenNebulaAction.simple_action(
                    {
                      data:{
                        id: element.vm_info.VM.ID
                      },
                      success: function(req){
                        if(userTemplate && userTemplate.SCHED_ACTION){
                          $(".sched_place").empty().append(_htmlSchedActions(TemplateUtils.templateToString({SCHED_ACTION: userTemplate.SCHED_ACTION})));
                          //update service
                          if(updateService){
                            updateService = false;
                            //this set a new vm_template_contents in roles
                            var rols = that.data.forEach(
                              function(element){
                                element.vm_template_contents = TemplateUtils.templateToString({SCHED_ACTION: userTemplate.SCHED_ACTION});
                                return element;
                              }
                            );
                            Service.update(
                              {
                                data:{
                                  id: that.id,
                                  extra_param: JSON.stringify(that.body)
                                },
                                success: function(){
                                  updateService = true;
                                  Notifier.notifyCustom(
                                    Locale.tr("Service Updated"),
                                    ""
                                  );
                                },
                                error: function(req, resp){
                                  updateService = true;
                                  Notifier.notifyError(
                                    (resp && resp.error && resp.error.message) || Locale.tr("Cannot update the Service: ")+(that.id || "")
                                  );
                                }
                              }
                            );
                          }
                        }
                      },
                      error: function(req, resp){
                        Notifier.notifyError(
                          (resp && resp.error && resp.error.message) || Locale.tr("Cannot update the VM: ")+element.vm_info.VM.ID
                        );
                      }
                    },
                    "VM",
                    "update",
                    {
                      template_raw: TemplateUtils.templateToString(userTemplate)
                    }
                  );
                },
                error: function(){
                  Notifier.notifyError(Locale.tr("Cannot get information of the VM: ")+element.vm_info.VM.ID);
                }
              }, "VM");
            }
          });
        }
      });
    }
  }

  function functionButtons(context, that, actions){
    var CREATE = true;

    function clear(){
      CREATE = true;
    }

    function renderCreateForm(){
      if(CREATE){
        ScheduleActions.htmlNewAction(actions, context, RESOURCE_SCHED_ACTIONS);
        ScheduleActions.setup(context);
        CREATE = false;
      }
      return false;
    };

    //add
    context.off("click", "#add_scheduling_"+RESOURCE_SCHED_ACTIONS+"_action").on("click" , "#add_scheduling_"+RESOURCE_SCHED_ACTIONS+"_action", function(e){
      e.preventDefault();
      renderCreateForm();
      $("#edit_"+RESOURCE_SCHED_ACTIONS+"_action_json").hide();
      $("#add_"+RESOURCE_SCHED_ACTIONS+"_action_json").show();
    });
    context.off("click", "#add_"+RESOURCE_SCHED_ACTIONS+"_action_json").on("click" , "#add_"+RESOURCE_SCHED_ACTIONS+"_action_json", function(e) {
      e.preventDefault();
      var sched_action = ScheduleActions.retrieveNewAction(context);
      if (sched_action != false) {
        $("#no_actions_tr", context).remove();
        $("#sched_vms_actions_body").prepend(ScheduleActions.fromJSONtoActionsTable(sched_action));
      }
      updateNodes(that, function(){
        return sched_action;
      },"add");
      clear();
    });

    //update
    context.off("click", ".edit_action_x").on("click", ".edit_action_x", function(e) {
      e.preventDefault();
      var id = $(this).attr("data_id");
      if(id && id.length){
        renderCreateForm();
        $("#edit_"+RESOURCE_SCHED_ACTIONS+"_action_json").show().attr("data_id", id);
        $("#add_"+RESOURCE_SCHED_ACTIONS+"_action_json").hide();
        ScheduleActions.fill($(this),context);
      }
    });
    context.off("click" , "#edit_"+RESOURCE_SCHED_ACTIONS+"_action_json").on("click" , "#edit_"+RESOURCE_SCHED_ACTIONS+"_action_json", function(e){
      e.preventDefault();
      var id = $(this).attr("data_id");
      if(id && id.length){
        $(".wickedpicker").hide();
        var sched_action = ScheduleActions.retrieveNewAction(context);
        if (sched_action != false) {
          var sched_actions = ScheduleActions.retrieve(context);
          if(Array.isArray(sched_actions)){
            sched_actions = sched_actions.map(
              function(action){
                if(action && action.ID && action.ID===id){
                  return sched_action;
                }else{
                  return action;
               }
              }
            );
          }
          updateNodes(that, function(){
            return sched_actions;
          },"replace");
        }
        clear();
      }
      return false;
    });

    //delete
    context.off("click", ".remove_action_x").on("click", ".remove_action_x", function(e) {
      e.preventDefault();
      var index = this.id.substring(6, this.id.length);
      updateNodes(that, function(schedAction){
        var actions = Array.isArray(schedAction)? schedAction : [schedAction];
        actions.forEach(function(el, i){
          if(el && el.ID && String(el.ID) === index){
            delete actions[i];
            return;
          }
        });
        return actions;
      }, "replace");
      clear();
    });
  }

  function _setup(context) {
    var that = this;

    that.formContext = context;
    Leases.actions(that, RESOURCE_SCHED_ACTIONS, "add-service", function(schedActions){
      updateNodes(that, function(){
        return schedActions;
      },"add");
    });

    var actions = ScheduleActions.defaultActions;

    $("select#select_new_action").off("change").on("change",function(){
      var snap_name = $("#snapname");
      var snap_id = $("#snapid");
      var disk_id = $("#diskid");
      switch ($(this).val()) {
        case "snapshot-create":
          snap_name.removeClass("hide");
          snap_id.addClass("hide").val("");
          disk_id.addClass("hide").val("");
        break;
        case "snapshot-revert":
          snap_name.addClass("hide").val("");
          snap_id.removeClass("hide");
          disk_id.addClass("hide").val("");
        break;
        case "snapshot-delete":
          snap_name.addClass("hide").val("");
          snap_id.removeClass("hide");
          disk_id.addClass("hide").val("");
        break;
        case "disk-snapshot-create":
          snap_name.removeClass("hide");
          snap_id.addClass("hide").val("");
          disk_id.removeClass("hide");
        break;
        case "disk-snapshot-revert":
          snap_name.addClass("hide").val("");
          snap_id.removeClass("hide");
          disk_id.removeClass("hide");
        break;
        case "disk-snapshot-delete":
          snap_name.addClass("hide").val("");
          snap_id.removeClass("hide");
          disk_id.removeClass("hide");
        break;
        default:
          snap_name.addClass("hide").val("");
          snap_id.addClass("hide").val("");
          disk_id.addClass("hide").val("");
        break;
      }
    });

    context.off("click", "#add_"+RESOURCE+"_action_json").on("click", "#add_"+RESOURCE+"_action_json", function(){
      var new_action = $("select#select_new_action").val();
      var role = $("select#role_name").val();
      var snap_name = $("#snapname").val();
      var snap_id = $("#snapid").val();
      var disk_id = $("#diskid").val();
      if(new_action){
        var actionJSON = {};
        actionJSON.error = function(e){
          Notifier.notifyError((e && e.error && e.error.message) || Locale.tr("Error"));
        };
        actionJSON.success = function(e){
          Notifier.notifyMessage(Locale.tr("Bulk Action Created"));
        };
        actionJSON.data = {};
        actionJSON.data.id = that.id;
        actionJSON.data.action = {perform: new_action};
        actionJSON.data.action.params = {};
        if(that.actions.includes(new_action)){
          var rawData = [disk_id,snap_id,snap_name];
          var args = rawData.filter(function (e) {return e;}).join();
          if(args){
            actionJSON.data.action.params.args = args;
          }
        }
        if(role!=="" && role!==undefined){
          actionJSON.data.roleName = role;
        }
        Actions.addFlowAction(actionJSON,RESOURCE);
      }
      return false;
    });
    functionButtons(context, that, actions);
  }
});
