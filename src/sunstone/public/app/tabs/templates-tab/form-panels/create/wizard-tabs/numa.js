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
  var OpenNebulaAction = require('opennebula/action');

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./numa/html");

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require("./numa/wizardTabId");
  var RESOURCE = "Host";

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
    this.numa = false;
    if(opts && opts.listener && opts.listener.action){
      this.action = opts.listener.action;
    }
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
    var that = this;
    return TemplateHTML();
  }

  function successCallback(data, data1){
    console.log("pass->", data, data1);
  }

  function errorCallback(error, error1){
    console.log("error->", error, error1);
  }

  function _onShow(context, panelForm) {
    var that = this;
    $('#numa-topology', context).on( 'click', function() {
      var form = $(".numa-form",context)
      if( $(this).is(':checked') ){
        form.removeClass("hide");
        //aca se tiene que llamar a los hugepages
        OpenNebulaAction.list(
          {
            success: successCallback, 
            error: errorCallback
          }, 
          RESOURCE
        );
        that.numa = true;
      }else{
        form.addClass("hide");
        that.numa = false;
      }
    });
  }

  function _setup(context) {
    console.log("3", this)
    var that = this;
    Foundation.reflow(context, "tabs");
    if(that && that.action){
      
    }
  }

  function _retrieve(context) {
    console.log("4")
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

  function _fill(context, templateJSON) {
    console.log("5", templateJSON);
    /*var topology = templateJSON["TOPOLOGY"];
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
    }*/
  }
});
