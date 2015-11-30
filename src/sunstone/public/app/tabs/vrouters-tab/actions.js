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
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/virtualrouter');
  var CommonActions = require('utils/common-actions');

  var RESOURCE = "VirtualRouter";
  var XML_ROOT = "VROUTER";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var CLONE_DIALOG_ID = require('./dialogs/clone/dialogId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID, XML_ROOT);

  var _actions = {
    "VirtualRouter.create" : _commonActions.create(CREATE_DIALOG_ID),
    "VirtualRouter.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "VirtualRouter.list" : _commonActions.list(),
    "VirtualRouter.show" : _commonActions.show(),
    "VirtualRouter.refresh" : _commonActions.refresh(),
    "VirtualRouter.delete" : _commonActions.del(),
    "VirtualRouter.chown": _commonActions.multipleAction('chown'),
    "VirtualRouter.chgrp": _commonActions.multipleAction('chgrp'),
    "VirtualRouter.chmod": _commonActions.singleAction('chmod'),
    "VirtualRouter.rename": _commonActions.singleAction('rename'),
    "VirtualRouter.update" : _commonActions.update(),
    "VirtualRouter.update_template" : _commonActions.updateTemplate(),
    "VirtualRouter.update_dialog" : _commonActions.checkAndShowUpdate(),
    "VirtualRouter.show_to_update" : _commonActions.showUpdate(CREATE_DIALOG_ID),

    "VirtualRouter.clone_dialog" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(CLONE_DIALOG_ID).show();
      }
    },

    "VirtualRouter.clone" : {
      type: "single",
      call: OpenNebulaResource.clone,
      callback: function(request, response) {
        Sunstone.getDialog(CLONE_DIALOG_ID).hide();
        Sunstone.getDialog(CLONE_DIALOG_ID).reset();
        Sunstone.runAction('VirtualRouter.refresh');
      },
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
});
