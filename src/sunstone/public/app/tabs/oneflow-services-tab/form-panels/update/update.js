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
  var Tips = require("utils/tips");
  var OpenNebula = require("opennebula");
  var UserInputs = require("utils/user-inputs");
  var Notifier = require("utils/notifier");
  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./html");

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require("./formPanelId");
  var TAB_ID = require("../../tabId");
  var classButton = "small button leases right radius";

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.display_vmgroups = false;
    this.actions = {
      "update": {
        "title": Locale.tr("Update Service"),
        "buttonText": Locale.tr("Update"),
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
      values_hbs.userInputsCharters = $("<div/>").append(
        $("<div/>",{style:"display:inline-block;clear:both;width:100%"}).append(
          $("<button />", {class: classButton, id:"addCharters"}).append(
            $("<i/>", {class: "fa fa-clock"})
          )
        ).add(
          $("<table/>", {class: "service-charters"})
        )
      ).prop("outerHTML");
    }
    return TemplateHTML(values_hbs);
  }

  function _setup(context) {
    Tips.setup(context);
    return false;
  }

  function _onShow() {
    Sunstone.runAction("Service.show", window.ServiceId);
  }

  function _setTemplateId(_, templateId) {
    this.templateId = templateId;
  }

  function _submitWizard(context) {
    if (this.action != "update") return;
    var that = this;

    var description = $("#description", context).val();
    var roles = [];

    var json_template = {};
    var ret = {};

    OpenNebula.Service.show({
      data : {
        id: window.ServiceId
      },
      error: Notifier.onError,
      success: function(_, response){
        if (
          response &&
          response.DOCUMENT &&
          response.DOCUMENT.TEMPLATE &&
          response.DOCUMENT.TEMPLATE.BODY
        ) {
          var body = response.DOCUMENT.TEMPLATE.BODY;

          if (body.roles){
            $(".role_content", context).each(function() {
              var role_id = $(this).attr("role_id");

              var role_info = that.roleTabObjects[role_id].retrieve($(this));

              role_info["cardinality"] = parseInt(role_info.cardinality, 10);
              role_info["cooldown"] = parseInt(role_info.cooldown, 10);
              role_info["vm_template"] = parseInt(role_info.vm_template, 10);
              role_info["last_vmname"] = body.roles[role_id].last_vmname;
              role_info["nodes"] = body.roles[role_id].nodes;
              role_info["state"] = body.roles[role_id].state;

              roles.push(role_info);
            });

            json_template = {
              description: description,
              roles: roles
            };
          }

          Object.assign(ret, body, json_template);
          Sunstone.runAction("Service.update",that.resourceId, JSON.stringify(ret));
        }
      }
    });

    return false;
  }
});
