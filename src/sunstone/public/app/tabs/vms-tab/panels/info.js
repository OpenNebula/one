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

  var Locale = require("utils/locale");
  var Humanize = require("utils/humanize");
  var RenameTr = require("utils/panel/rename-tr");
  var PermissionsTable = require("utils/panel/permissions-table");
  var TemplateTable = require("utils/panel/template-table");
  var TemplateTableVcenter = require("utils/panel/template-table");
  var OpenNebula = require("opennebula");
  var Navigation = require("utils/navigation");

  /*
    TEMPLATES
   */

  var TemplateInfo = require("hbs!./info/html");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./info/panelId");
  var RESOURCE = "VM";
  var XML_ROOT = "VM";

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

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var renameTrHTML = RenameTr.html(TAB_ID, RESOURCE, this.element.NAME);
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);
    var prettyStartTime = Humanize.prettyTime(this.element.STIME);

    var stateStr = OpenNebula.VM.stateStr(this.element.STATE);
    var lcmStateStr = OpenNebula.VM.lcmStateStr(this.element.LCM_STATE);
    var hostnameHTML = OpenNebula.VM.hostnameStrLink(this.element);
    var vrouterHTML = "--";

    var IP = OpenNebula.VM.ipsStr(this.element);

    var alias = (
      config.system_config &&
      config.system_config.get_extended_vm_info &&
      config.system_config.get_extended_vm_info === "true"
    ) ? null : OpenNebula.VM.aliasStr(this.element);

    if (this.element.TEMPLATE.VROUTER_ID != undefined){
      vrouterHTML = Navigation.link(
        OpenNebula.VirtualRouter.getName(this.element.TEMPLATE.VROUTER_ID),
        "vrouters-tab", this.element.TEMPLATE.VROUTER_ID);
    }

    var deployId = (typeof(this.element.DEPLOY_ID) == "object" ? "--" : this.element.DEPLOY_ID);
    var resched = (parseInt(this.element.RESCHED) ? Locale.tr("yes") : Locale.tr("no"));

    // Get rid of the unwanted (for show) SCHED_* keys
    var that = this;
    var strippedTemplate = {};
    var strippedTemplateVcenter = {};
    var unshownValues = {};

    $.each(that.element.USER_TEMPLATE, function(key, value) {
      if (key.match(/^SCHED_*/) || key == "USER_INPUTS") {
        unshownValues[key] = value;
      }
      else if (key.match(/^VCENTER_*/)){
        strippedTemplateVcenter[key] = value;
      }
      else {
        strippedTemplate[key] = value;
      }
    });

    var templateTableHTML = TemplateTable.html(strippedTemplate, RESOURCE, Locale.tr("Attributes"), true);

    var templateTableVcenterHTML = TemplateTableVcenter.html(strippedTemplateVcenter, RESOURCE, Locale.tr("vCenter information"), false);

    var monitoring = $.extend({}, this.element.MONITORING);
    delete monitoring.CPU;
    delete monitoring.MEMORY;
    delete monitoring.NETTX;
    delete monitoring.NETRX;
    delete monitoring.STATE;
    delete monitoring.DISK_SIZE;
    delete monitoring.SNAPSHOT_SIZE;
    var monitoringTableContentHTML;
    if (!$.isEmptyObject(monitoring)) {
      monitoringTableContentHTML = Humanize.prettyPrintJSON(monitoring);
    }

    return TemplateInfo({
      "element": this.element,
      "renameTrHTML": renameTrHTML,
      "stateStr": stateStr,
      "lcmStateStr": lcmStateStr,
      "hostnameHTML": hostnameHTML,
      "prettyStartTime": prettyStartTime,
      "deployId": deployId,
      "IP": IP,
      "alias": alias,
      "resched": resched,
      "permissionsTableHTML": permissionsTableHTML,
      "templateTableVcenterHTML": templateTableVcenterHTML,
      "templateTableHTML": templateTableHTML,
      "monitoringTableContentHTML": monitoringTableContentHTML,
      "vrouterHTML": vrouterHTML,
    });
  }

  function _setup(context) {
    RenameTr.setup(TAB_ID, RESOURCE, this.element.ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);
    // Get rid of the unwanted (for show) SCHED_* keys
    var that = this;
    var strippedTemplate = {};
    var strippedTemplateVcenter = {};
    var unshownValues = {};
     $.each(that.element.USER_TEMPLATE, function(key, value) {
      if (key.match(/^SCHED_*/) || key == "USER_INPUTS") {
        unshownValues[key] = value;
      }
      else if (key.match(/^VCENTER_*/)){
        strippedTemplateVcenter[key] = value;
      }
      else {
        strippedTemplate[key] = value;
      }
    });
    if($.isEmptyObject(strippedTemplateVcenter)){
      $(".vcenter", context).hide();
    }
    TemplateTable.setup(strippedTemplate, RESOURCE, this.element.ID, context, unshownValues, strippedTemplateVcenter);
    TemplateTableVcenter.setup(strippedTemplateVcenter, RESOURCE, this.element.ID, context, unshownValues, strippedTemplate);
  }
});
