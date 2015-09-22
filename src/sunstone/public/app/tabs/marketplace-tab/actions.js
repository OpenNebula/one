/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
  var OpenNebulaResource = require('opennebula/marketplace');

  var RESOURCE = "Marketplace";
  var TAB_ID = require('./tabId');
  var IMPORT_DIALOG_ID = require('./dialogs/import/dialogId');

  var _actions = {
    "Marketplace.list" : {
      type: "list",
      call: OpenNebulaResource.list,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateView(request, response.appliances);
      }
    },

    "Marketplace.refresh" : {
      type: "custom",
      call: function() {
        var tab = $('#' + TAB_ID);
        if (Sunstone.rightInfoVisible(tab)) {
          Sunstone.runAction(RESOURCE+".show", Sunstone.rightInfoResourceId(tab));
        } else {
          Sunstone.getDataTable(TAB_ID).waitingNodes();
          Sunstone.runAction(RESOURCE+".list", {force: true});
        }
      },
    },

    "Marketplace.import" : {
      type: "multiple",
      call: OpenNebulaResource.show,
      callback: function(request, response) {
        if (response['status'] && response['status'] != 'ready') {
            Notifier.notifyError(Locale.tr("The appliance is not ready"));
            return;
        }

        Sunstone.getDialog(IMPORT_DIALOG_ID).setParams({element: response});
        Sunstone.getDialog(IMPORT_DIALOG_ID).reset();
        Sunstone.getDialog(IMPORT_DIALOG_ID).show();
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError
    },

    "Marketplace.show" : {
      type: "single",
      call: OpenNebulaResource.show,
      callback: function(request, response) {
        if (Sunstone.rightInfoVisible($('#'+TAB_ID))) {
          Sunstone.insertPanels(TAB_ID, response);
        }
      },
      error: Notifier.onError
    }
  };

  return _actions;
});
