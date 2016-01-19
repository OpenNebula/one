/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

  require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var TemplateUtils = require('utils/template-utils');
  var UserInputs = require('utils/user-inputs');
  var WizardFields = require('utils/wizard-fields');
  var NicsSection = require('utils/nics-section');
  var TemplatesTable = require('tabs/templates-tab/datatable');
  var OpenNebulaVirtualRouter = require('opennebula/virtualrouter');
  var OpenNebulaTemplate = require('opennebula/template');
  var OpenNebulaAction = require('opennebula/action');
  var Notifier = require('utils/notifier');

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require('hbs!./create/wizard');
  var TemplateAdvancedHTML = require('hbs!./create/advanced');

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
        'title': Locale.tr("Create Virtual Router"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      }
    };

    this.templatesTable = new TemplatesTable('vr_create', {'select': true});

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.htmlAdvanced = _htmlAdvanced;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.submitAdvanced = _submitAdvanced;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

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

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({formPanelId: this.formPanelId});
  }

  function _setup(context) {
    var that = this;

    NicsSection.insert({},
      $(".nicsContext", context),
      {floatingIP: true, management: true});

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
              {text_header: '<i class="fa fa-gears fa-lg"></i>&emsp;'+Locale.tr("Custom Attributes")});
        },
        error: Notifier.onError
      });
    });

    $(".vr_attributes #name", context).on("input", function(){
      $('#vm_name', context).val("vr-"+$(this).val()+"-%i");
    });

    Tips.setup(context);

    return false;
  }

  function _submitWizard(context) {
    var virtual_router_json = WizardFields.retrieve($(".vr_attributes", context));

    var nics = NicsSection.retrieve($(".nicsContext", context));
    if (nics.length > 0) {
      virtual_router_json.NIC = nics;
    }

    var tmplId = this.templatesTable.retrieveResourceTableSelect();

    if (this.action == "create") {
      virtual_router_json = {
        "virtual_router" : virtual_router_json
      };

      var vm_name = $('#vm_name', context).val();
      var n_times = parseInt($('#vm_n_times', context).val());

      if (isNaN(n_times)){
        n_times = 1;
      }

      var hold = $('#hold', context).prop("checked");

      OpenNebulaVirtualRouter.create({
        data : virtual_router_json,
        timeout: true,
        success: function (request, response) {

          //TODO: add support for vm_name.replace(/%i/gi, i), or remove tooltip

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
              id: response.VROUTER.ID,
              extra_param: extra_info
            },
            timeout: true,
            success: function(request, response){
              OpenNebulaAction.clear_cache("VM");

              Sunstone.resetFormPanel(TAB_ID, FORM_PANEL_ID);
              Sunstone.hideFormPanel(TAB_ID);
            },
            error: Notifier.onError
          });
        },
        error: function(request, response) {
          Sunstone.hideFormPanelLoading(TAB_ID);
          Notifier.onError(request, response);
        },
      });

      return false;
    }
  }

  function _submitAdvanced(context) {
    if (this.action == "create") {
      var template = $('textarea#template', context).val();
      var virtual_router_json = {virtual_router: {virtual_router_raw: template}};
      Sunstone.runAction("VirtualRouter.create",virtual_router_json);
      return false;
    }
  }

  function _onShow(context) {
    this.templatesTable.refreshResourceTableSelect();
  }
});
