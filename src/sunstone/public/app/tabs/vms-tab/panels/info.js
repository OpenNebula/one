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
  var StateActions = require('../utils/state-actions');
  var VncSpiceUtils = require('../utils/vnc-spice-utils');

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
    var renameTrHTML = RenameTr.html(RESOURCE, this.element.NAME);
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);
    var prettyStartTime = Humanize.prettyTime(this.element.STIME);

    var stateStr = OpenNebulaVM.stateStr(this.element.STATE);
    var lcmStateStr = OpenNebulaVM.lcmStateStr(this.element.LCM_STATE);
    var hostname = OpenNebulaVM.hostnameStr(element);

    var deployId = (typeof(this.element.DEPLOY_ID) == "object" ? "-" : this.element.DEPLOY_ID);
    var resched = (parseInt(this.element.RESCHED) ? Locale.tr("yes") : Locale.tr("no"))
    var templateTableHTML = TemplateTable.html(this.element.USER_TEMPLATE, RESOURCE, Locale.tr("Attributes"));

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
      'renameTrHTML': renameTrHTML
    });
  }

  function _setup(context) {
    // Enable only action buttons for the current state
    StateActions.disableAllStateActions();
    StateActions.enableStateActions(this.element.STATE, this.element.LCM_STATE);
    // Enable / disable vnc button
    if (!VncSpiceUtils.VNCEnabled(this.element)) {
        $(".vnc-right-info").hide();
    } else {
        $(".vnc-right-info").show();
    }

    if (!VncSpiceUtils.SPICEEnabled(this.element)) {
        $(".spice-right-info").hide();
    } else {
        $(".spice-right-info").show();
    }

    RenameTr.setup(RESOURCE, this.element.ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);

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

    var templateTableHTML = TemplateTable.html(
      strippedTemplate, RESOURCE, this.element.ID, context, unshownValues);
  }
});
