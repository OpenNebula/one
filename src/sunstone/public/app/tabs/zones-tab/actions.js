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
  var OpenNebulaResource = require('opennebula/zone');
  var CommonActions = require('utils/common-actions');

  var XML_ROOT = "ZONE"
  var RESOURCE = "Zone"
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./dialogs/create/dialogId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("Zone created"));

  var _actions = {
    "Zone.create" : {
      type: "create",
      call: OpenNebulaResource.create,
      callback: function(request, response) {
        Sunstone.getDialog(CREATE_DIALOG_ID).hide();
        Sunstone.getDialog(CREATE_DIALOG_ID).reset();
        Sunstone.runAction(RESOURCE+".refresh");
      },
      error: Notifier.onError,
      notify: true
    },
    
    "Zone.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.getDialog(CREATE_DIALOG_ID).show();
      }
    },
    "Zone.list" : _commonActions.list(),
    "Zone.show" : _commonActions.show(),
    "Zone.refresh" : _commonActions.refresh(),
    "Zone.delete" : _commonActions.del(),
    "Zone.update_template" : _commonActions.updateTemplate(),
    "Zone.append_template" : _commonActions.appendTemplate(),
    "Zone.rename": _commonActions.singleAction('rename'),

    "Zone.show_to_update" : {
      type: "single",
      call: OpenNebulaResource.show,
      // TODO callback: fillPopPup,
      error: Notifier.onError
    }
  };

  return _actions;
})
