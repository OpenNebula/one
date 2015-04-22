define(function(require) {
  var TemplateHTML = require('hbs!./create/html');
  var Sunstone = require('sunstone');
  var DIALOG_ID = require('./create/dialogId');

  var _html = function() {
    return TemplateHTML({dialogId: DIALOG_ID});
  }

  var _setup = function(dialog) {
    $('#'+DIALOG_ID+'Form', dialog).submit(_submit);
    return false;
  }

  var _submit = function() {
    var name = $('#zonename', this).val();
    var endpoint = $("#endpoint", this).val();
    var zoneJSON = {"zone" : {"name" : name, "endpoint" : endpoint}};
    Sunstone.runAction("Zone.create", zoneJSON);
    return false;
  }

  var _onShow = function(dialog) {
    $("#zonename", dialog).focus();
    return false;
  }

  return {
    'dialogId': DIALOG_ID,
    'html': _html,
    'setup': _setup,
    'onShow': _onShow
  }
});
