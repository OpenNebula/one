define(function(require) {
  /*
    DEPENDENCIES
   */

  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./instantiate/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var OpenNebulaTemplate = require('opennebula/template');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var UserInputs = require('utils/user-inputs');
  var WizardFields = require('utils/wizard-fields');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./instantiate/dialogId');
  var TEMPLATES_TAB_ID = require('tabs/templates-tab/tabId')

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    BaseDialog.call(this);
  };

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.setup = _setup;

  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'dialogId': this.dialogId
    });
  }

  function _setup(context) {
    var that = this;

    context.off('invalid.fndtn.abide', '#' + DIALOG_ID + 'Form');
    context.off('valid.fndtn.abide', '#' + DIALOG_ID + 'Form');
    context.on('invalid.fndtn.abide', '#' + DIALOG_ID + 'Form', function(e) {
      // Fix for valid event firing twice
      if (e.namespace != 'abide.fndtn') { return; };
      Notifier.notifyError(Locale.tr("One or more required fields are missing or malformed."));
      return false;
    }).on('valid.fndtn.abide', '#' + DIALOG_ID + 'Form', function(e) {
      // Fix for valid event firing twice
      if (e.namespace != 'abide.fndtn') { return; };
      var vm_name = $('#vm_name', this).val();
      var n_times = $('#vm_n_times', this).val();
      var n_times_int = 1;

      var hold = $('#hold', this).prop("checked");

      var selected_nodes = Sunstone.getDataTable(TEMPLATES_TAB_ID).elements();

      $.each(selected_nodes, function(index, template_id) {
        if (n_times.length) {
          n_times_int = parseInt(n_times, 10);
        };

        var extra_msg = "";
        if (n_times_int > 1) {
          extra_msg = n_times_int + " times";
        }

        Notifier.notifySubmit("Template.instantiate", template_id, extra_msg);

        var extra_info = {
          'hold': hold
        };

        var tmp_json = WizardFields.retrieve($(".template_user_inputs" + template_id, context));

        extra_info['template'] = tmp_json;

        if (!vm_name.length) { //empty name use OpenNebula core default
          for (var i = 0; i < n_times_int; i++) {
            extra_info['vm_name'] = "";
            Sunstone.runAction("Template.instantiate_quiet", template_id, extra_info);
          }
        } else {
          if (vm_name.indexOf("%i") == -1) {//no wildcard, all with the same name
            extra_info['vm_name'] = vm_name;

            for (var i = 0; i < n_times_int; i++) {
              Sunstone.runAction(
                  "Template.instantiate_quiet",
                  template_id,
                  extra_info);
            }
          } else { //wildcard present: replace wildcard
            for (var i = 0; i < n_times_int; i++) {
              extra_info['vm_name'] = vm_name.replace(/%i/gi, i);

              Sunstone.runAction(
                  "Template.instantiate_quiet",
                  template_id,
                  extra_info);
            }
          }
        }
      })

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      return false;
    });
  }

  function _onShow(context) {
    $("#instantiate_vm_template_proceed", context).attr("disabled", "disabled");
    var selected_nodes = Sunstone.getDataTable(TEMPLATES_TAB_ID).elements();

    $("#instantiate_vm_user_inputs", context).html(
      '<br>' +
      '<div class="row">' +
        '<div class="large-12 large-centered columns">' +
          '<div class="subheader">' +
            Locale.tr("Templates to be instantiated") +
          '</div>' +
          '<ul class="disc list_of_templates">' +
          '</ul>' +
        '</div>' +
      '</div>');

    $.each(selected_nodes, function(index, template_id) {
      OpenNebulaTemplate.show({
        data : {
          id: template_id
        },
        timeout: true,
        success: function (request, template_json) {
          $(".list_of_templates", context).append("<li>" + template_json.VMTEMPLATE.NAME + '</li>')

          var inputs_div = $("<div class='template_user_inputs" + template_json.VMTEMPLATE.ID + "'></div>").appendTo(
            $("#instantiate_vm_user_inputs", context));

          UserInputs.vmTemplateInsert(
              inputs_div,
              template_json,
              {text_header: template_json.VMTEMPLATE.NAME});

          inputs_div.data("opennebula_id", template_json.VMTEMPLATE.ID)
        },
        error: function(request, error_json, container) {
          Notifier.onError(request, error_json, container);
          $("#instantiate_vm_user_inputs", context).empty();
        }
      });
    })

    $("#instantiate_vm_template_proceed", context).removeAttr("disabled");

    Tips.setup(context);
    return false;
  }
});
