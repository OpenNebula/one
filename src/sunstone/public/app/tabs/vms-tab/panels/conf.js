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

  var Locale = require("utils/locale");
  var Sunstone = require("sunstone");
  var Config = require("sunstone-config");
  var TemplateUtils = require("utils/template-utils");
  var StateActions = require("../utils/state-actions");

  /*
    TEMPLATES
   */

  var Template = require("hbs!./conf/html");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./conf/panelId");
  var RESOURCE = "VM";
  var XML_ROOT = "VM";

  var UPDATECONF_FORM_ID = require("../form-panels/updateconf/formPanelId");

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.panelId = PANEL_ID;
    this.title = Locale.tr("Conf");
    this.icon = "fa-cog";

    this.element = $.extend(
      true,
      {},
      info[XML_ROOT]
    );

    var conf = {};
    if (this.element["BACKUPS"] != undefined) {
      conf["BACKUPS"] = this.element["BACKUPS"]["BACKUP_CONFIG"];
    }

    var template = this.element.TEMPLATE;

    $.each(["OS", "FEATURES", "INPUT", "GRAPHICS", "RAW", "CONTEXT", "CPU_MODEL"], function(){
      if(template[this] != undefined){
        conf[this] = template[this];
      }
    });

    this.conf = conf;

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return Template({
      conf: this.conf
    });
  }

  function _setup(context) {
    var that = this;
    if (Config.isTabActionEnabled("vms-tab", "VM.updateconf")) {
      if (!StateActions.enabledStateAction("VM.updateconf", that.element.STATE, that.element.LCM_STATE)){
        $("#vm_updateconf", context).attr("disabled", "disabled");
      }

      context.off("click", "#vm_updateconf");
      context.on("click", "#vm_updateconf", function() {
        Sunstone.resetFormPanel(TAB_ID, UPDATECONF_FORM_ID);

        Sunstone.showFormPanel(TAB_ID, UPDATECONF_FORM_ID, "updateconf",
          function(formPanelInstance, context) {
            formPanelInstance.fill(context, that.element);
          });

        return false;
      });
    }

  }
});
