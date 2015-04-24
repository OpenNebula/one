define(function(require){
  var Locale = require('utils/locale');
  var PANEL_ID = require('./images/panelId');

  var _html = function(info) {
    return ''
  }

  var _setup = function(info, context) {
    return false;
  }
  var ImagesPanel = {
    title : Locale.tr("Images"),
    icon: "fa-upload",
    panelId: PANEL_ID,
    html : _html,
    setup: _setup
  }

  return ImagesPanel;
})