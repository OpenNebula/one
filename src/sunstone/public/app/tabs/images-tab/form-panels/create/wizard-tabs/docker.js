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
  require("ace-builds");
  var Config = require("sunstone-config");
  var Locale = require("utils/locale");
  var OpenNebulaDatastore = require("opennebula/datastore");
  var ResourceSelect = require("utils/resource-select");
  var UniqueId = require("utils/unique-id");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./docker/html");

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require("./docker/wizardTabId");
  var DOCKER_PREPEND = "docker";

  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    this.editor;

    this.getValueEditor = function() {
      var rtn = "";

      try {
        rtn = this.editor.getValue();
      } catch (error) {}

      return rtn;
    };

    if (!Config.isTemplateCreationTabEnabled(opts.tabId, "docker")) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = "fa-file-code";
    this.title = Locale.tr("Dockerfile");
    this.formPanelId = opts.formPanelId || "";
    this.typeSender = "docker";
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;

  return WizardTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var that = this;
    return TemplateHTML({
      "prepend": DOCKER_PREPEND,
      "formPanelId": that.formPanelId,
    });
  }

  function _onShow(context, _) {
    var ds_id = $("#"+DOCKER_PREPEND+"_datastore .resource_list_select", context).val();
    var filterValue = OpenNebulaDatastore.TYPES.IMAGE_DS;

    ResourceSelect.insert({
      context: $("#"+DOCKER_PREPEND+"_datastore", context),
      resourceName: "Datastore",
      initValue: ds_id,
      filterKey: "TYPE",
      filterValue: filterValue.toString(),
      triggerChange: true
    });

    ace.config.set("basePath", "/bower_components/ace-builds");

    this.editor = ace.edit("docker_template");
    this.editor.setTheme("ace/theme/github");
    this.editor.session.setMode("ace/mode/dockerfile");
  }

  function _setup(context) {
    Foundation.reflow(context, "tabs");
  }
});

