define(function(require) {
  var TemplateInfo = require('hbs!./info/html');
  var Locale = require('utils/locale');
  var RenameTr = require('utils/panel/rename-tr');
  var TemplateTable = require('utils/panel/template-table');

  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "Zone"

  var _html = function(info) {
    var element = _element(info);
    var renameTrHTML = RenameTr.html(RESOURCE, element.NAME);
    var templateTableHTML = TemplateTable.html(element.TEMPLATE, RESOURCE, 
                                      Locale.tr("Attributes"));

    return TemplateInfo({
      'info': info,
      'renameTrHTML': renameTrHTML,
      'templateTableHTML': templateTableHTML
    });
  }

  var _setup = function(info, context) {
    var element = _element(info);
    RenameTr.setup(RESOURCE, element.ID, context);
    TemplateTable.setup(element.TEMPLATE, RESOURCE, element.ID, context);
    return false;
  }

  /*
    Returns the object representing the resource, access the root element
   */
  var _element = function(info) {
    return info[RESOURCE.toUpperCase()]
  }

  var InfoPanel = {
    title : Locale.tr("Info"),
    icon: "fa-info-circle",
    panelId: PANEL_ID,
    html : _html,
    setup: _setup
  }

  return InfoPanel;
});
