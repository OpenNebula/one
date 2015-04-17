define(function(require){
  var TemplateInfo = require('hbs!./info/content');
  var Locale = require('utils/locale');

  var _generateHTML = function(info) {
    return TemplateInfo(info);
  }

  var _initialize = function(info) {

  }

  var infoPanel = {
      title : Locale.tr("Info"),
      icon: "fa-info-circle",
      content : _generateHTML,
      initialize: _initialize
  }

  return infoPanel;
});