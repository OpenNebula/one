define(function(require) {
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var RenameTr = require('utils/panel/rename-tr');
  var PermissionsTable = require('utils/panel/permissions-table');

  /*
    TEMPLATES
   */

  var TemplateInfo = require('hbs!./info/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "Template"
  var XML_ROOT = "VMTEMPLATE"

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
    var prettyRegTime = Humanize.prettyTime(this.element.REGTIME);

    return TemplateInfo({
      'element': this.element,
      'renameTrHTML': renameTrHTML,
      'permissionsTableHTML': permissionsTableHTML,
      'prettyRegTime': prettyRegTime,
    });
  }

  function _setup(context) {
    $('.resource-info-header', '#' + TAB_ID).text(this.element.NAME);
    RenameTr.setup(RESOURCE, this.element.ID, context);
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);
  }
});
