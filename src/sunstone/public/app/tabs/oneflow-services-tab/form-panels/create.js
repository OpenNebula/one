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

  var InstantiateTemplateFormPanel = require('tabs/oneflow-templates-tab/form-panels/instantiate');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var TemplatesTable = require('tabs/oneflow-templates-tab/datatable');
  var TemplateUtils = require('utils/template-utils');

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
    this.display_vmgroups = true;
    this.actions = {
      'create': {
        'title': Locale.tr("Create Service"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      }
    };
    this.templatesTable = new TemplatesTable('service_create', {'select': true});
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
          '<br/>' + this.templatesTable.dataTableHTML + '<br/>');

    this.templatesTable.initialize();

    $(".instantiate_wrapper", context).hide();

    this.templatesTable.idInput().off("change").on("change", function(){
      $(".instantiate_wrapper", context).show();
      var template_id = $(this).val();
      that.setTemplateId(context, template_id);
    });

    Tips.setup(context);
  }

  function _onShow(context) {
    this.templatesTable.refreshResourceTableSelect();
    InstantiateTemplateFormPanel.prototype.onShow.call(this, context);
  }
});
