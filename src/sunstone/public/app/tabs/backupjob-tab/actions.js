/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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
  var Locale = require('utils/locale');
  var OpenNebulaResource = require('opennebula/backupjob');
  var CommonActions = require('utils/common-actions');

  var RESOURCE = "BackupJob";
  var XML_ROOT = "BACKUPJOB";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("BackupJob created"));

  var _actions = {
    "BackupJob.create" : _commonActions.create(CREATE_DIALOG_ID),
    "BackupJob.refresh" : _commonActions.refresh(),
    "BackupJob.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "BackupJob.chown": _commonActions.multipleAction("chown"),
    "BackupJob.chgrp": _commonActions.multipleAction("chgrp"),
    "BackupJob.chmod": _commonActions.singleAction("chmod"),
    "BackupJob.rename": _commonActions.singleAction('rename'),
    "BackupJob.priority": _commonActions.singleAction('priority'),
    "BackupJob.retry": _commonActions.singleAction('retry'),
    "BackupJob.sched_action_update": _commonActions.singleAction('sched_action_update'),
    "BackupJob.sched_action_delete": _commonActions.singleAction('sched_action_delete'),
    "BackupJob.list" : _commonActions.list(),
    "BackupJob.show" : _commonActions.show(),
    "BackupJob.delete" : _commonActions.del(),
    "BackupJob.start": _commonActions.multipleAction("start"),
    "BackupJob.cancel": _commonActions.multipleAction("cancel"),
    "BackupJob.lockU": _commonActions.multipleAction('lock', false),
    "BackupJob.sched_action_add" : _commonActions.singleAction("sched_action_add"),
    "BackupJob.unlock": _commonActions.multipleAction('unlock', false),
    "BackupJob.update_template" : _commonActions.updateTemplate()
  };

  return _actions;
});
