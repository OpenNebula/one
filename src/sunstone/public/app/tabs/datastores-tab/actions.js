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
  var OpenNebulaResource = require('opennebula/datastore');
  var OpenNebulaCluster = require('opennebula/cluster');
  var OpenNebulaAction = require('opennebula/action');
  var CommonActions = require('utils/common-actions');

  var RESOURCE = "Datastore";
  var XML_ROOT = "DATASTORE";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var IMPORT_DIALOG_ID = require('./form-panels/import/formPanelId');
  var CLUSTERS_DIALOG_ID = require('utils/dialogs/clusters/dialogId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("Datastore created"));

  var _actions = {
    "Datastore.create" : _commonActions.create(CREATE_DIALOG_ID),
    "Datastore.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "Datastore.import_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, IMPORT_DIALOG_ID, "import");
      }
    },
    "Datastore.list" : _commonActions.list(),
    "Datastore.show" : _commonActions.show(),
    "Datastore.refresh" : _commonActions.refresh(),
    "Datastore.delete" : _commonActions.del(),
    "Datastore.chown": _commonActions.multipleAction('chown'),
    "Datastore.chgrp": _commonActions.multipleAction('chgrp'),
    "Datastore.chmod": _commonActions.singleAction('chmod'),
    "Datastore.update" : _commonActions.updateTemplate(),
    "Datastore.update_template" : _commonActions.updateTemplate(),
    "Datastore.append_template" : _commonActions.appendTemplate(),
    "Datastore.rename": _commonActions.singleAction('rename'),
    "Datastore.enable": _commonActions.multipleAction('enable'),
    "Datastore.disable": _commonActions.multipleAction('disable'),

    "Datastore.addtocluster" : _commonActions.checkAndShow("clusters"),

    "Datastore.clusters" : {
      type: "single",
      call: OpenNebulaResource.show,
      callback: function(request, response) {
        Sunstone.getDialog(CLUSTERS_DIALOG_ID).setParams({
          element: response[XML_ROOT],
          resource:"datastore",
          resource_name: RESOURCE,
          only_update_template: false
        });

        Sunstone.getDialog(CLUSTERS_DIALOG_ID).reset();
        Sunstone.getDialog(CLUSTERS_DIALOG_ID).show();
      },
      error: Notifier.onError
    }
  };

  return _actions;
});
