define(function(require) {
  /*
    DEPENDENCIES
   */

  var TemplateInfo = require('hbs!./info/html');
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var TemplateUtils = require('utils/template-utils');

  /*
    TEMPLATES
   */

  var TemplateTable = require('utils/panel/template-table');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "Marketplace";
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info;

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
    var url = this.element.links.download.href;
    url = url.replace(/\/download$/, '');

    var short_description = "";

    if(this.element.short_description){
      short_description = TemplateUtils.htmlDecode(this.element.short_description).replace(/\n/g, "<br/>");
    }

    var description = TemplateUtils.htmlDecode(this.element.description).replace(/\n/g, "<br/>");

    return TemplateInfo({
      'element': this.element,
      'url': url,
      'short_description': short_description,
      'description': description
    });
  }

  function _setup(context) {
    $('.resource-id', '#' + TAB_ID).hide();
    $('.resource-info-header', '#' + TAB_ID).text(this.element.name);
    return false;
  }
});
