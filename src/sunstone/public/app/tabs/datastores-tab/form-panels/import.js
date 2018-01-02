/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
  var VCenterDatastores = require('utils/vcenter/datastores');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./import/html');

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./import/formPanelId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'import': {
        'title': Locale.tr("Import vCenter Datastores"),
        'buttonText': Locale.tr("Import"),
        'resetButton': true
      }
    };

    this.vCenterDatastores = new VCenterDatastores();

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    return TemplateHTML({
      'formPanelId': this.formPanelId,
      'vCenterDatastoresHTML': this.vCenterDatastores.html()
    });
  }

  function _setup(context) {
    var that = this;

    $("form.vcenter_credentials", context)
      .off('forminvalid.zf.abide').off('formvalid.zf.abide').off("submit");

    Foundation.reInit($("form.vcenter_credentials", context));

    $("form.vcenter_credentials", context)
      .on('forminvalid.zf.abide', function(ev, frm) {
      })
      .on('formvalid.zf.abide', function(ev, frm) {
        Sunstone.enableFormPanelSubmit(TAB_ID);

        var vcenter_user = $("#vcenter_user", context).val();
        var vcenter_password = $("#vcenter_password", context).val();
        var vcenter_host = $("#vcenter_host", context).val();

        that.vCenterDatastores.insert({
          container: context,
          vcenter_user: vcenter_user,
          vcenter_password: vcenter_password,
          vcenter_host: vcenter_host
        });
      })
      .on("submit", function(ev) {
        ev.preventDefault();
      });

    return false;
  }

  function _submitWizard(context) {
    var that = this;

    Sunstone.hideFormPanelLoading(TAB_ID);

    this.vCenterDatastores.import(context.closest("#import_datastores_form_wrapper"));

    return false;
  }

  function _onShow(context) {
  }
});
