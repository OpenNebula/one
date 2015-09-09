define(function(require) {
  var TemplateUtils = require('utils/template-utils');

  /*
    Inputs must define wizard_field="KEY"
    Inputs with the wizard_field attr will not be considered
   */

  return {
    'retrieve': _retrieveWizardFields,
    'fill': _fillWizardFields
  }

  function _retrieveWizardFields(context) {
    var templateJSON = {};
    var fields = $('[wizard_field]', context);

    fields.each(function() {
      var field = $(this);

      if (field.prop('wizard_field_disabled') != true &&
            field.val() != null && field.val().length &&
            (field.attr("type") != "checkbox" || field.prop("checked")) &&
            (field.attr("type") != "radio" || field.prop("checked"))) {
        var field_name = field.attr('wizard_field');
        templateJSON[field_name] = field.val();
      }
    });

    return templateJSON;
  }

  function _fillWizardFields(context, templateJSON) {
    var fields = $('[wizard_field]', context);

    fields.each(function() {
      var field = $(this);
      var field_name = field.attr('wizard_field');
      var field_val = templateJSON[field_name];

      if (field_val) {
        if (field.is("select")){
          var option = $("option", field).filter(function() {
            return $(this).attr('value').toUpperCase() == field_val.toUpperCase();
          });

          field.val(option.val()).change();
        } else {  // if (field.is("input")){
          switch (field.attr("type")){
          case "radio":
            var checked = (field.val().toUpperCase() == field_val.toUpperCase());

            field.prop("checked", checked);

            if (checked) {
              field.change();
            }
            break;
          case "checkbox":
            var checked = (field.val().toUpperCase() == field_val.toUpperCase());

            field.prop("checked", checked);

            if (checked) {
              field.change();
            }
            break;
          default:
            field.val(
              TemplateUtils.escapeDoubleQuotes(
                TemplateUtils.htmlDecode(field_val)));
            field.change();
          }
        }

        delete templateJSON[field_name];
      }
    });
  }
});
