/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
  var TemplateHTML = require("hbs!./instantiate/html");
  var TemplateRowHTML = require("hbs!./instantiate/templateRow");
  var Sunstone = require("sunstone");
  var Notifier = require("utils/notifier");
  var OpenNebulaVNTemplate = require("opennebula/vntemplate");
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var WizardFields = require("utils/wizard-fields");
  var TemplateUtils = require("utils/template-utils");
  var Config = require("sunstone-config");
  var UniqueId = require("utils/unique-id");

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require("./instantiate/formPanelId");
  var TAB_ID = require("../tabId");

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      "instantiate": {
        "title": Locale.tr("Instantiate Network Template"),
        "buttonText": Locale.tr("Instantiate"),
        "resetButton": false
      }
    };

    this.template_objects = [];

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.setTemplateIds = _setTemplateIds;
  FormPanel.prototype.htmlWizard = _html;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      "formPanelId": this.formPanelId
    });
  }

  function _setup(context) {
  }

  function _submitWizard(context) {
    var that = this;

    if (!this.selected_nodes || this.selected_nodes.length == 0) {
      Notifier.notifyError(Locale.tr("No template selected"));
      Sunstone.hideFormPanelLoading();
      return false;
    }

    var vnet_name = $("#vnet_name", context).val();
    var n_times = $("#vnet_n_times", context).val();
    var n_times_int = 1;

    if (n_times.length) {
      n_times_int = parseInt(n_times, 10);
    }



    $.each(this.selected_nodes, function(index, template_id) {
      var extra_info = {}

      var tmp_json = WizardFields.retrieve($(".vntemplate_user_inputs" + template_id, context));
      $.each(tmp_json, function(key, value){
        if (Array.isArray(value)){
          delete tmp_json[key];
          tmp_json[key] = value.join(",");
        }
      });

      extra_info["template"] = tmp_json;
        for (var i = 0; i < n_times_int; i++) {
          extra_info["vnet_name"] = vnet_name.replace(/%i/gi, i); // replace wildcard

          Sunstone.runAction("VNTemplate.instantiate", [template_id], extra_info);
        }
    });

    return false;
  }

  function _setTemplateIds(context, selected_nodes) {
    var that = this;

    this.selected_nodes = selected_nodes;
    this.template_objects = [];
    this.template_base_objects = {};

    var templatesContext = $(".list_of_vntemplates", context);

    var idsLength = this.selected_nodes.length;
    var idsDone = 0;

    $.each(this.selected_nodes, function(index, template_id) {
      OpenNebulaVNTemplate.show({
        data : {
          id: template_id,
          extended: false
        },
        timeout: true,
        success: function (request, template_json) {
          that.template_base_objects[template_json.VNTEMPLATE.ID] = template_json;
        }
      });
    });

    templatesContext.html("");
    $.each(this.selected_nodes, function(index, template_id) {

      OpenNebulaVNTemplate.show({
        data : {
          id: template_id
        },
        timeout: true,
        success: function (request, template_json) {
          that.template_objects.push(template_json);

          templatesContext.append(
            TemplateRowHTML(
              { element: template_json.VMTEMPLATE
              })
          );

          idsDone += 1;
          if (idsLength == idsDone){
            Sunstone.enableFormPanelSubmit(that.tabId);
          }
        },
        error: function(request, error_json, container) {
          Notifier.onError(request, error_json, container);
        }
      });
    });
  }

  function _onShow(context) {
    Sunstone.disableFormPanelSubmit(this.tabId);

    var templatesContext = $(".list_of_vntemplates", context);
    templatesContext.html("");

    Tips.setup(context);
    return false;
  }

});
