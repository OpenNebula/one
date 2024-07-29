/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

define(function(require) {
  /*
    DEPENDENCIES
   */

  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var UserInputs = require('utils/user-inputs');
  var WizardFields = require('utils/wizard-fields');
  var NicsSection = require('utils/nics-section');
  var VRouterTemplatesTable = require('tabs/vrouter-templates-tab/datatable');
  var OpenNebulaVirtualRouter = require('opennebula/virtualrouter');
  var OpenNebulaTemplate = require('opennebula/template');
  var OpenNebulaAction = require('opennebula/action');
  var Notifier = require('utils/notifier');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./instantiate/html');

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./instantiate/formPanelId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'instantiate': {
        'title': Locale.tr("Instantiate VMs"),
        'buttonText': Locale.tr("Instantiate"),
        'resetButton': false
      }
    };

    this.templatesTable = new VRouterTemplatesTable(
        'vr_instantiate',
        { 'select': true });

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.fill = _fill;
  FormPanel.prototype.htmlWizard = _html;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'formPanelId': this.formPanelId
    });
  }

  function _setup(context) {
    var that = this;

    $(".selectTemplateTable", context).html(this.templatesTable.dataTableHTML);
    $(".table_wrapper", context).show();

    this.templatesTable.initialize();

    this.templatesTable.idInput().attr("required", "");

    this.templatesTable.idInput().on("change", function(){
      var templateId = $(this).val();

      var inputs_div = $(".template_user_inputs", context);
      inputs_div.empty();

      OpenNebulaTemplate.show({
        data : {
          id: templateId
        },
        timeout: true,
        success: function (request, template_json) {
          UserInputs.vmTemplateInsert(
              inputs_div,
              template_json,
              {text_header: '<i class="fas fa-gears"></i> '+Locale.tr("Custom Attributes")});
        },
        error: Notifier.onError
      });
    });

    Tips.setup(context);
    return false;
  }

  function _onShow(context) {
    this.templatesTable.refreshResourceTableSelect();
  }

  function _fill(context, element) {
    this.setHeader(element);

    this.vrId = element.ID;

    if(element.TEMPLATE.TEMPLATE_ID != undefined){
      this.templatesTable.selectResourceTableSelect(
          {ids: element.TEMPLATE.TEMPLATE_ID});
    }
  }

  function _submitWizard(context) {
    var that = this;

    var tmplId = this.templatesTable.retrieveResourceTableSelect();

    var vm_name = $('#vm_name', context).val();
    var n_times = parseInt($('#vm_n_times', context).val());

    if (isNaN(n_times)){
      n_times = 1;
    }

    var hold = $('#hold', context).prop("checked");

    var tmpl = WizardFields.retrieve($(".template_user_inputs", context));

    var extra_info = {
      'n_vms': n_times,
      'template_id': tmplId,
      'vm_name': vm_name,
      'hold': hold,
      'template': tmpl
    };

    OpenNebulaVirtualRouter.instantiate({
      data:{
        id: that.vrId,
        extra_param: extra_info
      },
      timeout: true,
      success: function(request, response){
        OpenNebulaAction.clear_cache("VM");

        Sunstone.resetFormPanel(TAB_ID, FORM_PANEL_ID);
        Sunstone.hideFormPanel(TAB_ID);
      },
      error: function(request, response) {
        Sunstone.hideFormPanelLoading(TAB_ID);

        Notifier.onError(request, response);
      }
    });

    return false;
  }
});
