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
  var DisksResize = require('utils/disks-resize');
  var CapacityInputs = require('tabs/templates-tab/form-panels/create/wizard-tabs/general/capacity-inputs');

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
    context.foundation('abide', 'reflow');

    context.off('invalid.fndtn.abide', '#' + DIALOG_ID + 'Form');
    context.off('valid.fndtn.abide', '#' + DIALOG_ID + 'Form');
    context.on('invalid.fndtn.abide', '#' + DIALOG_ID + 'Form', function(e) {
      Notifier.notifyError(Locale.tr("One or more required fields are missing or malformed."));
      return false;
    }).on('valid.fndtn.abide', '#' + DIALOG_ID + 'Form', function(e) {
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
        var disks = DisksResize.retrieve($(".disksContext"  + template_id, context));
        if (disks.length > 0) {
          tmp_json.DISK = disks;
        }

        capacityContext = $(".capacityContext"  + template_id, context);
        $.extend(tmp_json, CapacityInputs.retrieveResize(capacityContext));

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

    var templatesContext = $(".list_of_templates", context)
    templatesContext.html("");

    $.each(selected_nodes, function(index, template_id) {
      OpenNebulaTemplate.show({
        data : {
          id: template_id
        },
        timeout: true,
        success: function (request, template_json) {
          templatesContext.append(
            '<h3 style="border-bottom: 1px solid #efefef; padding-bottom: 10px;">' + 
              '<span style="border-bottom: 2px solid #0098c3; padding: 0px 50px 10px 0px;">' +
                template_json.VMTEMPLATE.NAME + 
              '</span>' +
            '</h3>'+
            '<div class="large-11 columns large-centered capacityContext' + template_json.VMTEMPLATE.ID + '">' +
              '<div class="row">'+
                '<div class="large-12 columns">'+
                  '<h3 class="subheader text-right">'+
                    '<span class="left">'+
                      '<i class="fa fa-laptop fa-lg"></i>&emsp;'+
                      Locale.tr("Capacity")+
                    '</span>'+
                  '</h3>'+
                '</div>'+
              '</div>'+
              '<div class="row">'+
                CapacityInputs.html() +
              '</div>'+
            '</div>' +
            '<div class="large-11 columns large-centered disksContext' + template_json.VMTEMPLATE.ID + '"></div>' +
            '<div class="large-11 columns large-centered template_user_inputs' + template_json.VMTEMPLATE.ID + '"></div>'+
            '<br>');

          DisksResize.insert(template_json, $(".disksContext"  + template_json.VMTEMPLATE.ID, context));

          var inputs_div = $(".template_user_inputs" + template_json.VMTEMPLATE.ID, context);

          UserInputs.vmTemplateInsert(
              inputs_div,
              template_json,
              {text_header: '<i class="fa fa-gears fa-lg"></i>&emsp;'+Locale.tr("Custom Attributes")});

          inputs_div.data("opennebula_id", template_json.VMTEMPLATE.ID)

          capacityContext = $(".capacityContext"  + template_json.VMTEMPLATE.ID, context);
          CapacityInputs.setup(capacityContext);
          CapacityInputs.fill(capacityContext, template_json.VMTEMPLATE);

          if (template_json.VMTEMPLATE.TEMPLATE.SUNSTONE_CAPACITY_SELECT &&
              template_json.VMTEMPLATE.TEMPLATE.SUNSTONE_CAPACITY_SELECT.toUpperCase() == "NO"){

            capacityContext.hide();
          }
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
