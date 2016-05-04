/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

//  require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var OpenNebulaServiceTemplate = require('opennebula/servicetemplate');
  var OpenNebulaTemplate = require('opennebula/template');
  var Notifier = require('utils/notifier');
  var WizardFields = require('utils/wizard-fields');
  var TemplateUtils = require('utils/template-utils');
  var UserInputs = require('utils/user-inputs');

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
        'title': Locale.tr("Instantiate Service Template"),
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

    Tips.setup(context);
    return false;
  }

  function _onShow(context) {
  }

  function _setTemplateId(context, templateId) {
    var that = this;

    this.templateId = templateId;

    this.service_template_json = {};

    OpenNebulaServiceTemplate.show({
      data : {
        id: templateId
      },
      timeout: true,
      success: function (request, template_json){

        that.service_template_json = template_json;

        $("#instantiate_service_user_inputs", context).empty();

        UserInputs.serviceTemplateInsert(
          $("#instantiate_service_user_inputs", context),
          template_json);

        n_roles = template_json.DOCUMENT.TEMPLATE.BODY.roles.length;
        n_roles_done = 0;

        $.each(template_json.DOCUMENT.TEMPLATE.BODY.roles, function(index, role){
          var div_id = "user_input_role_"+index;

          $("#instantiate_service_role_user_inputs", context).append(
            '<div id="'+div_id+'" class="large-6 columns">\
            </div>'
            );

          OpenNebulaTemplate.show({
            data : {
              id: role.vm_template
            },
            timeout: true,
            success: function (request, vm_template_json){

              $("#"+div_id, context).empty();

              UserInputs.vmTemplateInsert(
                $("#"+div_id, context),
                vm_template_json,
                {
                  text_header: Locale.tr("Role") + " " + role.name
                }
              );

              n_roles_done += 1;

              if(n_roles_done == n_roles){
                Sunstone.enableFormPanelSubmit(TAB_ID);
              }
            },
            error: function(request,error_json, container){
              Notifier.onError(request,error_json, container);
              $("#instantiate_vm_user_inputs", context).empty();
            }
          });
        });
      },
      error: function(request,error_json, container){
        Notifier.onError(request,error_json, container);
        $("#instantiate_service_user_inputs", context).empty();
      }
    });
  }

  function _submitWizard(context) {
    var that = this;

    var service_name = $('#service_name',context).val();
    var n_times = $('#service_n_times',context).val();
    var n_times_int=1;

    if (n_times.length){
      n_times_int=parseInt(n_times,10);
    }

    var extra_msg = "";
    if (n_times_int > 1) {
      extra_msg = n_times_int+" times";
    }

    var extra_info = {
      'merge_template': {}
    };

    var tmp_json = WizardFields.retrieve($("#instantiate_service_user_inputs", context));

    extra_info.merge_template.custom_attrs_values = tmp_json;

    extra_info.merge_template.roles = [];

    $.each(that.service_template_json.DOCUMENT.TEMPLATE.BODY.roles, function(index, role){
      var div_id = "user_input_role_"+index;

      tmp_json = {};

      $.extend( tmp_json, WizardFields.retrieve($("#"+div_id, context)) );

      if (role.elasticity_policies != undefined){
        $.each(role.elasticity_policies, function(i, pol){
          pol.expression = TemplateUtils.htmlDecode(pol.expression);
        });
      }

      role.user_inputs_values = tmp_json;

      extra_info.merge_template.roles.push(role);
    });

    if (!service_name.length){ //empty name
      for (var i=0; i< n_times_int; i++){
        Sunstone.runAction("ServiceTemplate.instantiate", that.templateId, extra_info);
      }
    } else {
      if (service_name.indexOf("%i") == -1){//no wildcard, all with the same name
        extra_info['merge_template']['name'] = service_name;

        for (var i=0; i< n_times_int; i++){
          Sunstone.runAction(
              "ServiceTemplate.instantiate",
              that.templateId, extra_info);
        }
      } else { //wildcard present: replace wildcard
        for (var i=0; i< n_times_int; i++){
          extra_info['merge_template']['name'] = service_name.replace(/%i/gi,i);

          Sunstone.runAction(
              "ServiceTemplate.instantiate",
              that.templateId, extra_info);
        }
      }
    }

    return false;
  }

});
