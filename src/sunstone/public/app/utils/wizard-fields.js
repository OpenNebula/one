define(function(require) {
  return {
    'retrieve': _retrieveWizardFields,
    'fill': _fillWizardFields
  }

  // TODO: other types: radio, checkbox
  function _retrieveWizardFields(dialog) {
    var template_json = {};
    var fields = $('[wizard_field]', dialog);

    fields.each(function() {
      var field = $(this);

      if (field.prop('wizard_field_disabled') != true &&
            field.val() != null && field.val().length &&
            (field.attr("type") != "checkbox" || field.prop("checked"))
          ) {

        var field_name = field.attr('wizard_field');
        template_json[field_name] = field.val();
      }
    });
    return template_json;
  }

  function _fillWizardFields(dialog, template_json) {
    var fields = $('[wizard_field]', dialog);

    fields.each(function() {
      var field = $(this);
      var field_name = field.attr('wizard_field');
      if (template_json[field_name]) {
        switch (field.attr("type")){
        case "radio":
          var checked = (field.val() == template_json[field_name]);

          field.prop("checked", checked);

          if (checked) {
            field.change();
          }
          break;
        case "checkbox":
          var checked = (field.val().toUpperCase() ==
                          template_json[field_name].toUpperCase());

          field.prop("checked", checked);

          if (checked) {
            field.change();
          }
          break;
        default:
          field.val(template_json[field_name])  //TODO field.val(escapeDoubleQuotes(htmlDecode(template_json[field_name])));
          field.change();
        }
      }
    });
  }
});
