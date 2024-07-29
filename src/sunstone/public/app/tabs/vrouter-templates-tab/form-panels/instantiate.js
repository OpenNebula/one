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
  var OpenNebulaVirtualRouter = require('opennebula/virtualrouter');
  var OpenNebulaTemplate = require('opennebula/template');
  var OpenNebulaAction = require('opennebula/action');
  var Notifier = require('utils/notifier');
  var Config = require('sunstone-config');
  var Navigation = require('utils/navigation');

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require('hbs!./instantiate/wizard');

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
        'title': Locale.tr("Instantiate Virtual Router Template"),
        'buttonText': Locale.tr("Instantiate"),
        'resetButton': false
      }
    };

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.setTemplateId = _setTemplateId;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateWizardHTML({
      'formPanelId': this.formPanelId
    });
  }

  function _setup(context) {
    var that = this;

    NicsSection.insert({},
      $(".nicsContext", context),
      { floatingIP: true,
        forceIPv6:true,
        forceIPv4:true,
        management: true,
        hide_auto_button: true,
        securityGroups: Config.isFeatureEnabled("secgroups")});

    $(".vr_attributes #name", context).on("input", function(){
      $('#vm_name', context).val("vr-"+$(this).val()+"-%i");
    });

    Tips.setup(context);

    return false;
  }

  function _submitWizard(context) {
    var that = this;

    var virtual_router_json = WizardFields.retrieve($(".vr_attributes", context));

    var nics = NicsSection.retrieve($(".nicsContext", context));
    if (nics.length > 0) {
      virtual_router_json.NIC = nics;
    }

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

        var tmpl = WizardFields.retrieve($(".template_user_inputs", context));

        var extra_info = {
          'n_vms': n_times,
          'template_id': that.templateId,
          'vm_name': vm_name,
          'hold': hold,
          'template': tmpl
        };

        Notifier.notifyCustom(Locale.tr("Virtual Router created"),
          Navigation.link(" ID: " + response.VROUTER.ID, "vrouters-tab", response.VROUTER.ID),
          false);

        OpenNebulaVirtualRouter.instantiate({
          data:{
            id: response.VROUTER.ID,
            extra_param: extra_info
          },
          timeout: true,
          success: function(request, response){
            OpenNebulaAction.clear_cache("VM");

            Sunstone.resetFormPanel();
            Sunstone.hideFormPanel();
          },
          error: function(request, response) {
            Sunstone.hideFormPanelLoading();

            Notifier.notifyError(Locale.tr(
              "Failed to create VMs. Virtual Router may need to be deleted manually."));
            Notifier.onError(request, response);
          }
        });
      },
      error: function(request, response) {
        Sunstone.hideFormPanelLoading();
        Notifier.onError(request, response);
      },
    });

    return false;
  }

  function _onShow(context) {
  }

  function _setTemplateId(context, templateId){
    this.templateId = templateId;

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

        $("span.template_name", context).text(template_json.VMTEMPLATE.NAME);
      },
      error: Notifier.onError
    });
  }
});
