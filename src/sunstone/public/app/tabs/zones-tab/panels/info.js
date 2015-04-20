define(function(require) {
  var TemplateInfo = require('hbs!./info/content');
  var Locale = require('utils/locale');
  var PanelRenameTr = require('utils/panel-rename-tr');

  var _html = function(info) {
    return TemplateInfo({
      'info': info,
      'renameTrHTML': PanelRenameTr.html("Zone", info.ZONE.NAME)
    });
  }

  var _setup = function(info, context) {
    PanelRenameTr.setup("Zone", info.ZONE.ID, context);
  }

  var infoPanel = {
    title : Locale.tr("Info"),
    icon: "fa-info-circle",
    html : _html,
    setup: _setup
  }

  return infoPanel;
});
