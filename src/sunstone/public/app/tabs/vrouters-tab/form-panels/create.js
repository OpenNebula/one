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

  var InstantiateTemplateFormPanel = require('tabs/vrouter-templates-tab/form-panels/instantiate');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var VRouterTemplatesTable = require('tabs/vrouter-templates-tab/datatable');

  /*
    TEMPLATES
   */

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
    InstantiateTemplateFormPanel.call(this);

    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'create': {
        'title': Locale.tr("Create Virtual Router"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      }
    };

    this.templatesTable = new VRouterTemplatesTable(
        'vr_create',
        { 'select': true });
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(InstantiateTemplateFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlAdvanced = _htmlAdvanced;
  FormPanel.prototype.submitAdvanced = _submitAdvanced;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({formPanelId: this.formPanelId});
  }

  function _setup(context) {
    var that = this;
    InstantiateTemplateFormPanel.prototype.setup.call(this, context);

    $(".selectTemplateTable", context).html(this.templatesTable.dataTableHTML);
    $(".table_wrapper", context).show();
    $(".no_table_wrapper", context).hide();

    this.templatesTable.initialize();

    this.templatesTable.idInput().attr("required", "");

    this.templatesTable.idInput().on("change", function(){

      var template_id = $(this).val();
      that.setTemplateId(context, template_id);
    });

    $(".vr_attributes #name", context).on("input", function(){
      $('#vm_name', context).val("vr-"+$(this).val()+"-%i");
    });

    Tips.setup(context);

    return false;
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
    InstantiateTemplateFormPanel.prototype.onShow.call(this, context);
  }
});
