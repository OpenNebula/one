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
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/vmgroup');
  var CommonActions = require('utils/common-actions');
  var TemplateUtils = require('utils/template-utils');

  var CREATE_DIALOG_ID = require('tabs/vmgroup-tab/form-panels/create/formPanelId');
  var TAB_ID = require('./tabId');

  var RESOURCE = "VMGroup";
  var XML_ROOT = "VM_GROUP";

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("VM groups"));

  var _actions = {
    "VMGroup.create" : _commonActions.create(CREATE_DIALOG_ID),
    "VMGroup.update" : _commonActions.update(),
    "VMGroup.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "VMGroup.update_dialog" : _commonActions.checkAndShowUpdate(),
    "VMGroup.list" : _commonActions.list(),
    "VMGroup.show" : _commonActions.show(),
    "VMGroup.delete" : _commonActions.del(),
    "VMGroup.refresh" : _commonActions.refresh(),
    "VMGroup.update_template" : _commonActions.updateTemplate(),
    "VMGroup.show_to_update" : _commonActions.showUpdate(CREATE_DIALOG_ID),
    "VMGroup.append_template" : _commonActions.appendTemplate(),
    "VMGroup.chown": _commonActions.multipleAction('chown'),
    "VMGroup.chgrp": _commonActions.multipleAction('chgrp'),
    "VMGroup.chmod": _commonActions.singleAction('chmod'),
    "VMGroup.lockM": _commonActions.multipleAction('lock', false),
    "VMGroup.lockU": _commonActions.multipleAction('lock', false),
    "VMGroup.lockA": _commonActions.multipleAction('lock', false),
    "VMGroup.unlock": _commonActions.multipleAction('unlock', false)
  };

  return _actions;
});
