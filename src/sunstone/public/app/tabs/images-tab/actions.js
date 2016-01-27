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
  var OpenNebulaResource = require('opennebula/image');
  var CommonActions = require('utils/common-actions');

  var RESOURCE = "Image";
  var XML_ROOT = "IMAGE";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var CLONE_DIALOG_ID = require('./dialogs/clone/dialogId');
  var IMPORT_DIALOG_ID = require('./form-panels/import/formPanelId');


  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID, XML_ROOT);

  var _actions = {
    "Image.create" : _commonActions.create(CREATE_DIALOG_ID),
    "Image.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "Image.import_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, IMPORT_DIALOG_ID, "import");
      }
    },    
    "Image.list" : _commonActions.list(),
    "Image.show" : _commonActions.show(),
    "Image.refresh" : _commonActions.refresh(),
    "Image.delete" : _commonActions.del(),
    "Image.append_template" : _commonActions.appendTemplate(),
    "Image.update_template" : _commonActions.updateTemplate(),
    "Image.chown": _commonActions.multipleAction('chown'),
    "Image.chgrp": _commonActions.multipleAction('chgrp'),
    "Image.chmod": _commonActions.singleAction('chmod'),
    "Image.rename": _commonActions.singleAction('rename'),
    "Image.enable": _commonActions.multipleAction('enable'),
    "Image.disable": _commonActions.multipleAction('disable'),
    "Image.persistent": _commonActions.multipleAction('persistent'),
    "Image.nonpersistent": _commonActions.multipleAction('nonpersistent'),
    "Image.chtype": _commonActions.singleAction('chtype'),
    "Image.snapshot_flatten": _commonActions.singleAction("snapshot_flatten"),
    "Image.snapshot_revert": _commonActions.singleAction("snapshot_revert"),
    "Image.snapshot_delete": _commonActions.singleAction("snapshot_delete"),
    
    "Image.clone_dialog" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(CLONE_DIALOG_ID).show();
      }
    },
    "Image.clone" : {
      type: "single",
      call: OpenNebulaResource.clone,
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
});
