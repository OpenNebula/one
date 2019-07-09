/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
  var FilesTable = require("tabs/files-tab/datatable");
  var UniqueId = require("utils/unique-id");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./numa/html");

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require("./numa/wizardTabId");

  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, "os_booting")) {
      throw "Wizard Tab not enabled";
    }
    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = "fa-chart-pie";
    this.title = Locale.tr("NUMA");
    this.classes = "hypervisor";
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
    return TemplateHTML();
  }

  function _onShow(context, panelForm) {
    $("#numa-topology", context).change(function(){
      var value = $(this).val();
      console.log("--->", value);
    });
  }

  function _setup(context) {
    var that = this;
    Foundation.reflow(context, "tabs");
  }

  function _retrieve(context) {
    console.log("retrieve")
    var templateJSON = {};

    //if (!$.isEmptyObject(osJSON)) { templateJSON["OS"] = osJSON; };

    /*var featuresJSON = WizardFields.retrieve(".featuresTab", context);
    if (!$.isEmptyObject(featuresJSON)) { templateJSON["FEATURES"] = featuresJSON; };

    var cpuModelJSON = WizardFields.retrieve(".cpuTab", context);
    if (!$.isEmptyObject(cpuModelJSON)) { templateJSON["CPU_MODEL"] = cpuModelJSON; };*/

    return templateJSON;
  }

  function _fillBootValue(id="", context=null, value="") {
    if(id.length && context && value.length){
      $(String(id), context).attr("value", value);
    }
  }
ç
  function _fill(context, templateJSON) {
    console.log("fill", templateJSON);
    var topology = templateJSON["TOPOLOGY"];
    if (topology) {
      WizardFields.fill(context, pinPolicy);

      if (pinPolicy && pinPolicy["PIN_POLICY"]) {
        _fillBootValue("", context, pinPolicy["BOOT"]);
      }
    }

    var topologyJSON = templateJSON["TOPOLOGY"];
    if (topologyJSON) {
      WizardFields.fill(context, topologyJSON);
      delete topologyJSON["TOPOLOGY"];
    }
  }
});
