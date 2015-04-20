define(function(require) {
  /*
    This module insert a row with the name of the resource.
    The row can be edited and a rename action will be sent
   */
  
  var TemplateRenameTr = require('hbs!./panel-rename-tr/html');
  var Sunstone = require('sunstone');

  /*
    Generate the tr HTML with the name of the resource and an edit icon
    @param {String} resourceType Resource type (i.e: Zone, Host, Image...)
    @param {String} resourceName Name of the resource
    @returns {String} HTML row
   */
  var _html = function(resourceType, resourceName) {
    var renameTrHTML = TemplateRenameTr({
      'resourceType': resourceType,
      'resourceName': resourceName
    })

    return renameTrHTML;
  };

  /*
    Initialize the row, clicking the edit icon will add an input to edit the name
    @param {String} resourceType Resource type (i.e: Zone, Host, Image...)
    @param {String} resourceId ID of the resource
    @param {jQuery Object} context Selector including the tr
   */
  var _setup = function(resourceType, resourceId, context) {
    context.off("click", "#div_edit_rename_link");
    context.on("click", "#div_edit_rename_link", function() {
      var valueStr = $(".value_td_rename", context).text();
      $(".value_td_rename", context).html('<input class="input_edit_value_rename" id="input_edit_rename" type="text" value="' + valueStr + '"/>');
    });

    context.off("change", ".input_edit_value_rename");
    context.on("change", ".input_edit_value_rename", function() {
      var valueStr = $(".input_edit_value_rename", context).val();
      if (valueStr != "") {
        var nameTemplate = {"name": valueStr};
        Sunstone.runAction(resourceType + ".rename", resourceId, nameTemplate);
      }
    });

    return false;
  }

  return {
    'html': _html,
    'setup': _setup
  }
});
