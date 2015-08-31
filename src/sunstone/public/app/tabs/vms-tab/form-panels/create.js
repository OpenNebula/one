define(function(require) {
  /*
    DEPENDENCIES
   */

  require('foundation.tab');
  var InstantiateTemplateFormPanel = require('tabs/templates-tab/form-panels/instantiate');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var Notifier = require('utils/notifier');
  var WizardFields = require('utils/wizard-fields');
  var UserInputs = require('utils/user-inputs');
  var OpenNebulaTemplate = require('opennebula/template');
  var TemplatesTable = require('tabs/templates-tab/datatable');
  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./create/formPanelId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    InstantiateTemplateFormPanel.call(this);

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
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(InstantiateTemplateFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */
  function _setup(context) {
    var that = this;
    InstantiateTemplateFormPanel.prototype.setup.call(this, context);

    $(".selectTemplateTable", context).html(
      '<fieldset>' +
        '<legend>' + Locale.tr("Select a template") + '</legend>' +
        this.templatesTable.dataTableHTML +
      '</fieldset>');

    this.templatesTable.initialize();

    $("#selected_resource_id_vm_create", context).on("change", function(){
        $(".nameContainer", context).show();

         var templatesContext = $(".list_of_templates", context);
        templatesContext.html("");
        templatesContext.show();

        var template_id = $(this).val();
        that.setTemplateIds(context, [template_id]);
    });

    Tips.setup(context);
  }

  function _onShow(context) {
    this.templatesTable.resetResourceTableSelect();
    InstantiateTemplateFormPanel.prototype.onShow.call(this, context);

    $(".nameContainer", context).hide();
  }
});
