define(function(require) {
  var TemplateInfo = require('hbs!./info/html');
  var Locale = require('utils/locale');
  var RenameTr = require('utils/panel/rename-tr');
  var ExtendedTemplateTable = require('utils/panel/extended-template-table');

  var PANEL_ID = "zone_info_tab";

  var _html = function(info) {
    var renameTrHTML = RenameTr.html("Zone", info.ZONE.NAME);
    var extendedTemplateTableHTML = ExtendedTemplateTable.html(info.ZONE.TEMPLATE, "Zone", Locale.tr("Attributes"));

    return TemplateInfo({
      'info': info,
      'renameTrHTML': renameTrHTML,
      'extendedTemplateTableHTML': extendedTemplateTableHTML
    });
  }

  var _setup = function(info, context) {
    RenameTr.setup("Zone", info.ZONE.ID, context);
    ExtendedTemplateTable.setup(info.ZONE.TEMPLATE, "Zone", info.ZONE.ID, context);
    return false;
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
