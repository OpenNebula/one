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

  var BaseFormPanel = require('utils/form-panels/form-panel');
  var TemplateHTML = require('hbs!./instantiate/html');
  var TemplateRowHTML = require('hbs!./instantiate/templateRow');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var OpenNebulaTemplate = require('opennebula/template');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var UserInputs = require('utils/user-inputs');
  var WizardFields = require('utils/wizard-fields');
  var DisksResize = require('utils/disks-resize');
  var NicsSection = require('utils/nics-section');
  var CapacityInputs = require('tabs/templates-tab/form-panels/create/wizard-tabs/general/capacity-inputs');

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
        'title': Locale.tr("Instantiate VM Template"),
        'buttonText': Locale.tr("Instantiate"),
        'resetButton': false
      }
    };

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.setTemplateIds = _setTemplateIds;
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
    context.foundation('abide', 'reflow');
  }

  function _submitWizard(context) {
    if (!this.selected_nodes || this.selected_nodes.length == 0) {
      Notifier.notifyError(Locale.tr("No template selected"));
      Sunstone.hideFormPanelLoading(this.tabId);
      return false;
    }

    var vm_name = $('#vm_name', context).val();
    var n_times = $('#vm_n_times', context).val();
    var n_times_int = 1;

    var hold = $('#hold', context).prop("checked");

    $.each(this.selected_nodes, function(index, template_id) {
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

      var tmp_json = WizardFields.retrieve($(".template_user_inputs" + template_id, context));
      var disks = DisksResize.retrieve($(".disksContext"  + template_id, context));
      if (disks.length > 0) {
        tmp_json.DISK = disks;
      }

      var nics = NicsSection.retrieve($(".nicsContext"  + template_id, context));
      if (nics.length > 0) {
        tmp_json.NIC = nics;
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
    });

    return false;
  }

  function _setTemplateIds(context, selected_nodes) {
    this.selected_nodes = selected_nodes;

    var templatesContext = $(".list_of_templates", context);

    var idsLength = this.selected_nodes.length;
    var idsDone = 0;

    $.each(this.selected_nodes, function(index, template_id) {
      OpenNebulaTemplate.show({
        data : {
          id: template_id
        },
        timeout: true,
        success: function (request, template_json) {
          templatesContext.append(
            TemplateRowHTML(
              { element: template_json.VMTEMPLATE,
                capacityInputsHTML: CapacityInputs.html()
              }) );

          DisksResize.insert(template_json, $(".disksContext"  + template_json.VMTEMPLATE.ID, context));
          NicsSection.insert(template_json, $(".nicsContext"  + template_json.VMTEMPLATE.ID, context));

          var inputs_div = $(".template_user_inputs" + template_json.VMTEMPLATE.ID, context);

          UserInputs.vmTemplateInsert(
              inputs_div,
              template_json,
              {text_header: '<i class="fa fa-gears fa-lg"></i>&emsp;'+Locale.tr("Custom Attributes")});

          inputs_div.data("opennebula_id", template_json.VMTEMPLATE.ID);

          capacityContext = $(".capacityContext"  + template_json.VMTEMPLATE.ID, context);
          CapacityInputs.setup(capacityContext);
          CapacityInputs.fill(capacityContext, template_json.VMTEMPLATE);

          if (template_json.VMTEMPLATE.TEMPLATE.SUNSTONE_CAPACITY_SELECT &&
              template_json.VMTEMPLATE.TEMPLATE.SUNSTONE_CAPACITY_SELECT.toUpperCase() == "NO"){

            capacityContext.hide();
          }

          idsDone += 1;
          if (idsLength == idsDone){
            Sunstone.enableFormPanelSubmit(TAB_ID);
          }
        },
        error: function(request, error_json, container) {
          Notifier.onError(request, error_json, container);
          $("#instantiate_vm_user_inputs", context).empty();
        }
      });
    });
  }

  function _onShow(context) {
    Sunstone.disableFormPanelSubmit(TAB_ID);

    var templatesContext = $(".list_of_templates", context);
    templatesContext.html("");

    Tips.setup(context);
    return false;
  }
});
