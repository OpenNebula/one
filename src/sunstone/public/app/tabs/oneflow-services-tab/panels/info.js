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

  var Humanize = require("utils/humanize");
  var Locale = require("utils/locale");
  var OpenNebulaService = require("opennebula/service");
  var PermissionsTable = require("utils/panel/permissions-table");
  var RenameTr = require("utils/panel/rename-tr");
  var TemplateUtils = require("utils/template-utils");
  var Sunstone = require("sunstone");

  var OpenNebulaAction = require("opennebula/action");
  var OpenNebula = require("opennebula");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./info/html");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./info/panelId");
  var XML_ROOT = "DOCUMENT";
  var RESOURCE = "Service";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info[XML_ROOT];

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;
  Panel.prototype.onShow = _onShow;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function dismissWarning(){
    $(".close_flowvms_async_error").off("click").on("click", function(e){
      e.preventDefault();
      var vm_pool = OpenNebulaAction.cache("VM");
      var element = $(this);
      var dataIds = element.data("ids");
      if(dataIds !== undefined && vm_pool && vm_pool.data){
        var ids = String(dataIds).split(",");

        var findVm = function(id){
          return vm_pool.data.find(function(vm){
            return vm && vm.VM && vm.VM.ID === id;
          });
        };
        ids.forEach(id => {
          var vmData = findVm(id);
          var templateJSON = $.extend({}, vmData.VM.USER_TEMPLATE);
          delete templateJSON.ERROR;
          template_str = TemplateUtils.templateToString(templateJSON);
          Sunstone.runAction("VM.update_template", id, template_str);
          element.closest(".warning-message").hide("1500", function(){
            $(this).remove();
          });
        });
      }
    });
  }

  function _html() {
    var that = this;
    var renameTrHTML = RenameTr.html(TAB_ID, RESOURCE, this.element.NAME);
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);
    var prettyStartTime = this.element.TEMPLATE.BODY["start_time"] ? Humanize.prettyTime(this.element.TEMPLATE.BODY["start_time"]) : "-";

    var errorMessageHTML = "";
    var async = false;

    function getVmPool(callback, errorCallback){
      var vm_pool = OpenNebulaAction.cache("VM");
      if(callback && typeof callback === "function"){
        if(vm_pool && vm_pool.data){
          callback(vm_pool.data);
        }else{
          OpenNebula.VM.list({
            timeout: true,
            success: function (request, item_list){
              if(item_list){
                async = true;
                callback(item_list);
              }
            },
            error: function(){
              if(errorCallback && typeof errorCallback === "function"){
                errorCallback();
              }
            }
          });
        }
      }
    }

    // this render the alert
    function renderAlertFromUserTemplate(vmPool){
      var errors = {};
      if(
        vmPool &&
        that.element &&
        that.element.TEMPLATE &&
        that.element.TEMPLATE.BODY &&
        that.element.TEMPLATE.BODY.roles
      ){
        var roles = Array.isArray(that.element.TEMPLATE.BODY.roles)? that.element.TEMPLATE.BODY.roles : [that.element.TEMPLATE.BODY.roles];
        roles.forEach(function(role){
          if(role && role.nodes){
            var nodes = Array.isArray(role.nodes)? role.nodes: [role.nodes];
            nodes.forEach(node => {
              if(node && node.deploy_id !== undefined){

                var datavm = vmPool.find(function(vm){
                  if(
                    vm &&
                    vm.VM &&
                    vm.VM.ID === String(node.deploy_id) &&
                    vm.VM.USER_TEMPLATE &&
                    vm.VM.USER_TEMPLATE.ERROR
                  ){
                    return true;
                  }
                });

                if(
                  datavm &&
                  datavm.VM &&
                  datavm.VM.ID &&
                  datavm.VM.USER_TEMPLATE &&
                  datavm.VM.USER_TEMPLATE.ERROR
                ){
                  if(errors[datavm.VM.USER_TEMPLATE.ERROR]){
                    var value = errors[datavm.VM.USER_TEMPLATE.ERROR];
                    value.push(datavm.VM.ID);
                  }else{
                    errors[datavm.VM.USER_TEMPLATE.ERROR] = [datavm.VM.ID];
                  }
                }
              }
            });
          }
        });
      }

      Object.keys(errors).forEach(function(element){
        if(element){
          render = $("<div/>", {class:"callout warning warning-message", style:"border-radius: .5em;" });
          render.data("data-ids", errors[element]);
          render.append(
            $("<div/>", {class: "row"}).append(
              $("<div/>",{class: "columns large-1"}).append(
                $("<i>/", {class: "fas fa-exclamation-circle"})
              ).add(
                $("<div/>",{class: "columns large-9"}).append(
                  $("<p/>").html(
                    Locale.tr("VM: ")+
                    "<b>"+errors[element].join(",")+" </b>"+
                    Locale.tr("has error: ")+
                    "<b>"+element+"</b>"
                  )
                )
              ).add(
                $("<div/>",{class: "columns large-2"}).append(
                  $("<a/>",{class:"close_flowvms_async_error","data-ids": errors[element].join(",")}).append(
                    $("<u/>").text(Locale.tr("Dismiss"))
                  )
                )
              )
            )
          );
          errorMessageHTML += render.prop("outerHTML");
        }
      });

      if(async){
        $(".warningsVms").empty().append(errorMessageHTML);
        dismissWarning();
      }
    }

    getVmPool(renderAlertFromUserTemplate);

    return TemplateHTML({
      "element": this.element,
      "renameTrHTML": renameTrHTML,
      "permissionsTableHTML": permissionsTableHTML,
      "stateStr": OpenNebulaService.stateStr(this.element.TEMPLATE.BODY.state),
      "prettyStartTime": prettyStartTime,
      "errorMessageHTML": errorMessageHTML,
    });
  }

  function _setup(context) {
    RenameTr.setup(TAB_ID, RESOURCE, this.element.ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);
  }

  function _onShow(context) {
    dismissWarning();
  }
});
