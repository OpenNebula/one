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
  var OpenNebulaResource = require('opennebula/virtualrouter');
  var CommonActions = require('utils/common-actions');

  var RESOURCE = "VirtualRouter";
  var XML_ROOT = "VROUTER";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var INSTANTIATE_DIALOG_ID = require('./form-panels/instantiate/formPanelId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("Virtual Router created"));

  var _actions = {
    "VirtualRouter.create" : _commonActions.create(CREATE_DIALOG_ID),
    "VirtualRouter.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "VirtualRouter.lockM": _commonActions.multipleAction('lock', false),
    "VirtualRouter.lockU": _commonActions.multipleAction('lock', false),
    "VirtualRouter.lockA": _commonActions.multipleAction('lock', false),
    "VirtualRouter.unlock": _commonActions.multipleAction('unlock', false),
    "VirtualRouter.instantiate_vms" : {
      type: "custom",
      call: function() {
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();
        if (selected_nodes.length != 1) {
          Notifier.notifyMessage("Please select one (and just one) Virtual Router.");
          return false;
        }

        var vrId = "" + selected_nodes[0];

        OpenNebulaResource.show({
          data:{
            id: vrId
          },
          success: function(request, response){
            Sunstone.resetFormPanel(TAB_ID, INSTANTIATE_DIALOG_ID);
            Sunstone.showFormPanel(TAB_ID, INSTANTIATE_DIALOG_ID, "instantiate",
              function(formPanelInstance, context) {
                formPanelInstance.fill(context, response[XML_ROOT]);
              });
          },
          error: Notifier.onError
        });
      }
    },
    "VirtualRouter.list" : _commonActions.list(),
    "VirtualRouter.show" : _commonActions.show(),
    "VirtualRouter.refresh" : _commonActions.refresh(),
    "VirtualRouter.delete" : _commonActions.del(),
    "VirtualRouter.chown": _commonActions.multipleAction('chown'),
    "VirtualRouter.chgrp": _commonActions.multipleAction('chgrp'),
    "VirtualRouter.chmod": _commonActions.singleAction('chmod'),
    "VirtualRouter.rename": _commonActions.singleAction('rename'),
    "VirtualRouter.attachnic": _commonActions.singleAction('attachnic'),
    "VirtualRouter.detachnic": _commonActions.singleAction('detachnic'),
    "VirtualRouter.update" : _commonActions.update(),
    "VirtualRouter.update_template" : _commonActions.updateTemplate(),
    "VirtualRouter.update_dialog" : _commonActions.checkAndShowUpdate(),
    "VirtualRouter.show_to_update" : _commonActions.showUpdate(CREATE_DIALOG_ID),
  };

  return _actions;
});
