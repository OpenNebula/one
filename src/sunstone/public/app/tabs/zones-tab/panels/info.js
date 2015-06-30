define(function(require) {
  /*
    DEPENDENCIES
   */

  var TemplateInfo = require('hbs!./info/html');
  var Locale = require('utils/locale');
  var RenameTr = require('utils/panel/rename-tr');

  /*
    TEMPLATES
   */

  var TemplateTable = require('utils/panel/template-table');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./info/panelId');
  var TAB_ID = require('../tabId');
  var RESOURCE = "Zone"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info[RESOURCE.toUpperCase()];

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
    var templateTableHTML = TemplateTable.html(this.element.TEMPLATE, RESOURCE,
                                      Locale.tr("Attributes"));

    return TemplateInfo({
      'element': this.element,
      'renameTrHTML': renameTrHTML,
      'templateTableHTML': templateTableHTML
    });
  }

  function _setup(context) {
    $('.resource-info-header', '#' + TAB_ID).text(this.element.NAME);
    RenameTr.setup(RESOURCE, this.element.ID, context);
    TemplateTable.setup(this.element.TEMPLATE, RESOURCE, this.element.ID, context);
    return false;
  }
});
