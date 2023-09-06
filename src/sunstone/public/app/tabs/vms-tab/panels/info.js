/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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
  var Navigation = require("utils/navigation");
  var OpenNebula = require("opennebula");
  var PermissionsTable = require("utils/panel/permissions-table");
  var RenameTr = require("utils/panel/rename-tr");
  var Sunstone = require("sunstone");
  var TemplateTable = require("utils/panel/template-table");
  var TemplateUtils = require("utils/template-utils");

  /*
    TEMPLATES
   */

  var TemplateInfo = require("hbs!./info/html");
  var TemplateInfoError = require("hbs!utils/info-error/html");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./info/panelId");
  var RESOURCE = "VM";
  var XML_ROOT = "VM";
  var REGEX_VCENTER_ATTRS = /^VCENTER_/;
  // Get rid of the unwanted (for show) SCHED_* keys
  var REGEX_HIDDEN_ATTRS = /^(USER_INPUTS|BACKUP)$|SCHED_|ERROR/;

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
    var that = this;
    var renameTrHTML = RenameTr.html(TAB_ID, RESOURCE, this.element.NAME);
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);
    var prettyStartTime = Humanize.prettyTime(this.element.STIME);

    var stateStr = OpenNebula.VM.stateStr(this.element.STATE);
    var stateClass = OpenNebula.VM.stateClass(this.element.STATE);
    var lcmStateStr = OpenNebula.VM.lcmStateStr(this.element.LCM_STATE);
    var lcmStateClass = OpenNebula.VM.lcmStateClass(this.element.LCM_STATE);
    var hostnameHTML = OpenNebula.VM.hostnameStrLink(this.element);
    var IP = OpenNebula.VM.ipsStr(this.element, { forceGroup: true });
    var sshWithPortForwarding = OpenNebula.VM.getSshWithPortForwarding(this.element, true);

    var vrouterHTML = "--";

    if (this.element.TEMPLATE.VROUTER_ID != undefined){
      vrouterHTML = Navigation.link(
        OpenNebula.VirtualRouter.getName(this.element.TEMPLATE.VROUTER_ID),
        "vrouters-tab", this.element.TEMPLATE.VROUTER_ID
      );
    }

    var deployId = (typeof(this.element.DEPLOY_ID) === "object" ? "--" : this.element.DEPLOY_ID);
    var resched = (parseInt(this.element.RESCHED) ? Locale.tr("yes") : Locale.tr("no"));

    var attributes = TemplateTable.getTemplatesAttributes(this.element.USER_TEMPLATE, {
      regexVCenter: REGEX_VCENTER_ATTRS,
      regexHidden: REGEX_HIDDEN_ATTRS
    });

    var templateTableHTML = TemplateTable.html(attributes.general, RESOURCE, Locale.tr("Attributes"));
    var templateTableVcenterHTML = TemplateTable.html(attributes.vcenter, RESOURCE, Locale.tr("vCenter information"));

    var monitoring = $.extend({}, this.element.MONITORING);

    delete monitoring.CPU;
    delete monitoring.MEMORY;
    delete monitoring.NETTX;
    delete monitoring.NETRX;
    delete monitoring.STATE;
    delete monitoring.DISK_SIZE;
    delete monitoring.SNAPSHOT_SIZE;

    var monitoringTableContentHTML = !$.isEmptyObject(monitoring) && Humanize.prettyPrintJSON(monitoring);

    var errorMessageHTML = "";
    if (this.element &&
        this.element.USER_TEMPLATE &&
        this.element.USER_TEMPLATE.ERROR){
          errorMessageHTML = TemplateInfoError(
            {
              error_msg: this.element.USER_TEMPLATE.ERROR,
              error_title: Locale.tr("Driver Error"),
              canDismiss: true,
              dismissId: "close_vm_async_error",
              size: 12
            }
          );
    }

    if (this.element &&
        this.element.USER_TEMPLATE &&
        this.element.USER_TEMPLATE.SCHED_MESSAGE){
          errorMessageHTML += TemplateInfoError(
            {
              error_msg: this.element.USER_TEMPLATE.SCHED_MESSAGE,
              error_title: Locale.tr("Scheduler Error"),
              canDismiss: true,
              dismissId: "close_vm_scheduler_async_error",
              size: 12
            }
          );
    }

    if (this.element &&
        this.element.TEMPLATE &&
        this.element.TEMPLATE.SCHED_ACTION){
          var arraySchedActions = Array.isArray(this.element.TEMPLATE.SCHED_ACTION) ?
            this.element.TEMPLATE.SCHED_ACTION :
            [this.element.TEMPLATE.SCHED_ACTION];
          var lastErrorAndId = getLastSchedErrorAndId(arraySchedActions);
          if(lastErrorAndId.error){
            errorMessageHTML += TemplateInfoError(
              {
                error_msg: lastErrorAndId.error,
                error_title: Locale.tr("Scheduled Action Error") + " (ID: #" + lastErrorAndId.id + ")",
                canDismiss: false,
                dismissId: "",
                size: 12
              }
            );
          }
    }

    that.errorMessageHTML = errorMessageHTML;

    return TemplateInfo({
      "element": this.element,
      "renameTrHTML": renameTrHTML,
      "stateStr": stateStr,
      "stateClass": stateClass,
      "lcmStateStr": lcmStateStr,
      "lcmStateClass": lcmStateClass,
      "hostnameHTML": hostnameHTML,
      "prettyStartTime": prettyStartTime,
      "deployId": deployId,
      "IP": IP,
      "sshWithPortForwarding": sshWithPortForwarding,
      "resched": resched,
      "permissionsTableHTML": permissionsTableHTML,
      "templateTableVcenterHTML": templateTableVcenterHTML,
      "templateTableHTML": templateTableHTML,
      "monitoringTableContentHTML": monitoringTableContentHTML,
      "vrouterHTML": vrouterHTML
    });
  }

  function getLastSchedErrorAndId(sched_array){
    var lastErrorAndId = {
      error: "",
      id: 0
    };
    var lastEnd = 0;
    $.each(sched_array, function(_, sched_action){
      if (sched_action.MESSAGE &&
        sched_action.END_VALUE &&
        parseInt(sched_action.END_VALUE, 10) > lastEnd
      ){
        lastErrorAndId.error = typeof sched_action.MESSAGE === "string"? sched_action.MESSAGE : "";
        lastErrorAndId.id = parseInt(sched_action.ID, 10);
        lastEnd = parseInt(sched_action.END_VALUE, 10);
      }
    });
    return lastErrorAndId;
  }

  function _setup(context) {
    var that = this;

    RenameTr.setup(TAB_ID, RESOURCE, this.element.ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);

    var attributes = TemplateTable.getTemplatesAttributes(this.element.USER_TEMPLATE, {
      regexVCenter: REGEX_VCENTER_ATTRS,
      regexHidden: REGEX_HIDDEN_ATTRS
    });

    if($.isEmptyObject(attributes.vcenter)){
      $(".vcenter", context).hide();
    }

    // General Attributes section
    TemplateTable.setup(attributes.general, RESOURCE, this.element.ID, context, attributes.hidden, attributes.vcenter);
    // vCenter Attributes section
    TemplateTable.setup(attributes.vcenter, RESOURCE, this.element.ID, context, attributes.hidden, attributes.general);

    context.off("click", "#close_vm_async_error");
    context.on("click", "#close_vm_async_error", function() {
      var resourceId = that.element.ID;
      var templateJSON = $.extend({}, that.element.USER_TEMPLATE);
      delete templateJSON.ERROR;
      template_str = TemplateUtils.templateToString(templateJSON);

      Sunstone.runAction(RESOURCE + ".update_template", resourceId, template_str);
    });

    context.off("click", "#close_vm_scheduler_async_error");
    context.on("click", "#close_vm_scheduler_async_error", function() {
      var resourceId = that.element.ID;
      var templateJSON = $.extend({}, that.element.USER_TEMPLATE);
      delete templateJSON.SCHED_MESSAGE;
      template_str = TemplateUtils.templateToString(templateJSON);

      Sunstone.runAction(RESOURCE + ".update_template", resourceId, template_str);
    });

    if (OpenNebula.VM.isvCenterVM(this.element)) {
      $("button[href=\"VM.upload_marketplace_dialog\"]").attr("disabled","disabled");
    } else {
      $("button[href=\"VM.upload_marketplace_dialog\"]").removeAttr("disabled");
    }

    $("#vms-tab-panelsErrors", context).html(that.errorMessageHTML);
  }
});
