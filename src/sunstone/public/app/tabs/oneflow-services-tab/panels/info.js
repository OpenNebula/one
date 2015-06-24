define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var Locale = require('utils/locale');
  var PermissionsTable = require('utils/panel/permissions-table');
  var OpenNebulaService = require('opennebula/service');

  /*
    TEMPLATES
   */
  
  var TemplateHTML = require('hbs!./info/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var XML_ROOT = "DOCUMENT";
  var RESOURCE = "Service";

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
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);

    return TemplateHTML({
      'element': this.element,
      'permissionsTableHTML': permissionsTableHTML,
      'stateStr': OpenNebulaService.stateStr(this.element.TEMPLATE.BODY.state)
    });
  }

  function _setup(context) {
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);
  }
});
