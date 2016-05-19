/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var RenameTr = require('utils/panel/rename-tr');
  var PermissionsTable = require('utils/panel/permissions-table');
  var TemplateTable = require('utils/panel/template-table');
  var OpenNebulaVM = require('opennebula/vm');
  var Sunstone = require('sunstone');
  var Config = require('sunstone-config');

  /*
    TEMPLATES
   */

  var TemplateInfo = require('hbs!./info/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "VM"
  var XML_ROOT = "VM"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info[XML_ROOT];

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
    var renameTrHTML = RenameTr.html(TAB_ID, RESOURCE, this.element.NAME);
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);
    var prettyStartTime = Humanize.prettyTime(this.element.STIME);

    var stateStr = OpenNebulaVM.stateStr(this.element.STATE);
    var lcmStateStr = OpenNebulaVM.lcmStateStr(this.element.LCM_STATE);
    var hostname = OpenNebulaVM.hostnameStr(this.element);

    var deployId = (typeof(this.element.DEPLOY_ID) == "object" ? "--" : this.element.DEPLOY_ID);
    var resched = (parseInt(this.element.RESCHED) ? Locale.tr("yes") : Locale.tr("no"))

    // Get rid of the unwanted (for show) SCHED_* keys
    var that = this;
    var strippedTemplate = {};
    var unshownValues = {};

    $.each(that.element.USER_TEMPLATE, function(key, value) {
      if (key.match(/^SCHED_*/) || key == "USER_INPUTS") {
        unshownValues[key] = value;
      } else {
        strippedTemplate[key] = value;
      }
    });

    var templateTableHTML = TemplateTable.html(strippedTemplate, RESOURCE, Locale.tr("Attributes"));

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
      'element': this.element,
      'renameTrHTML': renameTrHTML,
      'stateStr': stateStr,
      'lcmStateStr': lcmStateStr,
      'hostname': hostname,
      'prettyStartTime': prettyStartTime,
      'deployId': deployId,
      'resched': resched,
      'permissionsTableHTML': permissionsTableHTML,
      'templateTableHTML': templateTableHTML,
      'monitoringTableContentHTML': monitoringTableContentHTML,
      'renameTrHTML': renameTrHTML
    });
  }

  function _setup(context) {
    RenameTr.setup(TAB_ID, RESOURCE, this.element.ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);

    $("a.vrid", context).on("click", function(){
      // TODO: this should be checked internally in showElement,
      // but it won't work because of bug #4198

      if (Config.isTabEnabled("vrouters-tab")){
        Sunstone.showElement("vrouters-tab", "VirtualRouter.show", $(this).text());
      }
    });

    // Get rid of the unwanted (for show) SCHED_* keys
    var that = this;
    var strippedTemplate = {};
    var unshownValues = {};
    $.each(that.element.USER_TEMPLATE, function(key, value) {
      if (!key.match(/^SCHED_*/)) {
        strippedTemplate[key] = value;
      } else {
        unshownValues[key] = value;
      }
    })

    TemplateTable.setup(strippedTemplate, RESOURCE, this.element.ID, context, unshownValues);
  }
});
