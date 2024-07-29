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

  var Config = require("sunstone-config");
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var WizardFields = require("utils/wizard-fields");
  var TemplateUtils = require("utils/template-utils");
  var CustomTagsTable = require("utils/custom-tags-table");
  var OpenNebulaHost = require("opennebula/host");
  var UniqueId = require("utils/unique-id");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./other/html");

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require("./other/wizardTabId");

  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, "other")) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = "fa-tag";
    this.title = Locale.tr("Tags");
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;

  return WizardTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      "customTagsTableHTML": CustomTagsTable.html()
    });
  }

  function _onShow(context, panelForm) {
  }

  function _setup(context) {
    CustomTagsTable.setup(context);
  }

  function _retrieve(context) {
    var templateJSON = CustomTagsTable.retrieve(context);

    var rawJSON = {};
    var rawData = WizardFields.retrieveInput($(".raw_data", context));
    if (rawData != "") {
      rawJSON["DATA"] = rawData;

      var rawType = $(".raw_type", context).val();
      if (rawType != undefined) {
        rawJSON["TYPE"] = rawType;
      }

      rawJSON["VALIDATE"] = $("#raw_validate", context).is(":checked") ? "YES" : "NO";
    }

    if (!$.isEmptyObject(rawJSON)) { templateJSON["RAW"] = rawJSON; };

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var rawJSON = templateJSON.RAW;
    if (rawJSON) {
      $(".raw_type", context).val(rawJSON["TYPE"]);
      $(".raw_type", context).change();

      WizardFields.fillInput($(".raw_data", context), rawJSON["DATA"]);

      if (["yes", "YES"].includes(rawJSON["VALIDATE"])) {
        $("#raw_validate", context).prop("checked", "checked");
      }

      delete templateJSON.RAW;
    }
    CustomTagsTable.fill(context, templateJSON);
  }
});
