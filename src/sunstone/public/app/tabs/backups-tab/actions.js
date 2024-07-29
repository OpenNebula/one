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
  var CommonActions = require("utils/common-actions");
  var Locale = require("utils/locale");
  var OpenNebulaResource = require("opennebula/image");
  var Notifier = require('utils/notifier');
  var Sunstone = require('sunstone');

  var TEMPLATES_TAB_ID = require('../templates-tab/tabId');
  var RESTORE_DIALOG_ID = require('./dialogs/restore/dialogId');

  var RESOURCE = "Backup";
  var XML_ROOT = "IMAGE";
  var TAB_ID = require("./tabId");

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("Backup created"));

  var _actions = {
    "Backup.list" : _commonActions.list(),
    "Backup.show" : _commonActions.show(),
    "Backup.refresh" : _commonActions.refresh(),
    "Backup.delete" : _commonActions.del(),
    "Backup.chown": _commonActions.multipleAction("chown"),
    "Backup.chgrp": _commonActions.multipleAction("chgrp"),
    "Backup.chmod": _commonActions.singleAction("chmod"),
    "Backup.rename": _commonActions.singleAction("rename"),
    "Backup.chtype": _commonActions.singleAction("chtype"),
    "Backup.restore_dialog" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(RESTORE_DIALOG_ID).show();
      }
    },
    "Backup.restore" : {
      type: "single",
      call: OpenNebulaResource.restore,
      callback: function(request, response) {
        OpenNebulaAction.clear_cache("IMAGE");
        ids = response.split(' ')
        idTemplate = ids.shift()
        Notifier.notifyCustom(Locale.tr("Restored Template"),
          Navigation.link(" ID: " + idTemplate, TEMPLATES_TAB_ID, idTemplate),
          false);
        ids.forEach(id => {
          Notifier.notifyCustom(Locale.tr("Restored Disk"),
          Navigation.link(" ID: " + id, TAB_ID, id),
          false);
        });
        
      },
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
});
