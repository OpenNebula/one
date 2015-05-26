define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');

  /*
    TEMPLATES
   */
  
  var TemplateInfo = require('hbs!./template/html');

  /*
    CONSTANTS
   */
  
  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./template/panelId');
  var RESOURCE = "Template"
  var XML_ROOT = "VMTEMPLATE"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Template");
    this.icon = "fa-file-o";

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
    var prettyTemplateHTML = Humanize.prettyPrintJSON(this.element.TEMPLATE);

    return TemplateInfo({
      'element': this.element,
      'prettyTemplateHTML': prettyTemplateHTML
    });
  }

  function _setup(context) {
  }
});
