define(function(require) {
  /*
    DEPENDENCIES
   */
  
  require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var Notifier = require('utils/notifier');
  var WizardFields = require('utils/wizard-fields');
  var UserInputs = require('utils/user-inputs');
  var OpenNebulaTemplate = require('opennebula/template');
  var TemplatesTable = require('tabs/templates-tab/datatable');

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require('hbs!./create/wizard');
  
  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./create/formPanelId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'create': {
        'title': Locale.tr("Create Virtual Machine"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      }
    };

    this.templatesTable = new TemplatesTable('vm_create', {'select': true});

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.setup = _setup;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.submitWizard = _submitWizard;

  return FormPanel;
  
  /*
    FUNCTION DEFINITIONS
   */
  
  function _htmlWizard() {

    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
      'templatesTableHTML': this.templatesTable.dataTableHTML
    });
  }

  function _setup(context) {
    $("#create_vm_template_proceed", context).attr("disabled", "disabled");
    $("#create_vm_inputs_step", context).hide();

    this.templatesTable.initialize();

    $("#selected_resource_id_vm_create", context).on("change", function(){
        var template_id = $(this).val();

        $("#create_vm_inputs_step", context).hide();
        $("#create_vm_user_inputs", context).empty();

        OpenNebulaTemplate.show({
            data : {
                id: template_id
            },
            timeout: true,
            success: function (request, template_json){
                $("#create_vm_inputs_step", context).hide();
                $("#create_vm_user_inputs", context).empty();

                var has_inputs = UserInputs.vmTemplateInsert(
                    $("#create_vm_user_inputs", context),
                    template_json,
                    {text_header: ""});

                if(has_inputs){
                    $("#create_vm_inputs_step", context).show();
                }

                $("#create_vm_template_proceed", context).removeAttr("disabled");
            },
            error: function(request,error_json, container){
                Notifier.onError(request,error_json, container);
            }
        });
    });

    Tips.setup(context);
  }

  function _onShow(context) {
    $("input#vm_name", context).focus();
    this.templatesTable.resetResourceTableSelect();
  }

  function _submitWizard(context) {
    var vm_name = $('#create_vm_name', context).val();
    var template_id = $("#selected_resource_id_vm_create", context).val();
    var n_times = $('#create_vm_n_times', context).val();
    var n_times_int = 1;
    var hold = $('#create_vm_hold', context).prop("checked");

    if (!template_id.length) {
      Notifier.notifyError(tr("You have not selected a template"));
      return false;
    }

    if (n_times.length) {
      n_times_int = parseInt(n_times, 10);
    }

    var extra_msg = "";
    if (n_times_int > 1) {
      extra_msg = n_times_int + " times";
    }

    Notifier.notifySubmit("Template.instantiate", template_id, extra_msg);

    var extra_info = {
      'hold': hold
    };

    var tmp_json = WizardFields.retrieve(context);

    extra_info['template'] = tmp_json;

    if (!vm_name.length) { //empty name use OpenNebula core default
      for (var i = 0; i < n_times_int; i++) {
        extra_info['vm_name'] = "";
        Sunstone.runAction("Template.instantiate_quiet", template_id, extra_info);
      }
    } else {
      if (vm_name.indexOf("%i") == -1) {//no wildcard, all with the same name
        for (var i = 0; i < n_times_int; i++) {
          extra_info['vm_name'] = vm_name;
          Sunstone.runAction("Template.instantiate_quiet", template_id, extra_info);
        }
      } else { //wildcard present: replace wildcard
        for (var i = 0; i < n_times_int; i++) {
          extra_info['vm_name'] = vm_name.replace(/%i/gi, i);
          Sunstone.runAction("Template.instantiate_quiet", template_id, extra_info);
        }
      }
    }

    setTimeout(function() {
      Sunstone.resetFormPanel(TAB_ID, FORM_PANEL_ID);
      Sunstone.hideFormPanel(TAB_ID);
      Sunstone.runAction("VM.list");
    }, 1500);

    return false;
  }
});
