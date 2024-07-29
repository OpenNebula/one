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

//  require('foundation.tab');
  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var WizardFields = require('utils/wizard-fields');
  var UniqueId = require('utils/unique-id');
  var vmgroupSection = require('utils/vmgroup-section');
  var VMGroupsTable = require('tabs/vmgroup-tab/datatable');


  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./vmgroup/wizardTabId');

  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, 'vmgroup')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = 'fa-folder-open';
    this.title = Locale.tr("VM Group");
    this.classes = "hypervisor"

  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;

  return WizardTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    this.vmGroupTable = new VMGroupsTable('vmgroups_table'+UniqueId.id(), { 'select': true });
    return vmgroupSection.html(this.vmGroupTable);
  }

  function _onShow(context, panelForm) {
    vmgroupSection.onShow(context,this.vmGroupTable);
  }

  function _setup(context) {
    this.vmGroupTable.initialize();
    this.vmGroupTable.refreshResourceTableSelect();
    vmgroupSection.setup(context, this.vmGroupTable);
  }

  function _retrieve(context) {
    return vmgroupSection.retrieve(context, this.vmGroupTable);
  }

  function _fill(context, templateJSON) {
    vmgroupSection.fill(context, templateJSON, this.vmGroupTable);
    if (templateJSON.VMGROUP) {
      delete templateJSON.VMGROUP;
    }
  }
});
