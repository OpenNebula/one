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
  var Sunstone = require("sunstone");
  var Notifier = require("utils/notifier");
  var Locale = require("utils/locale");
  var DataTable = require("./datatable");
  var OpenNebulaResource = require("opennebula/network");
  var OpenNebulaCluster = require("opennebula/cluster");
  var OpenNebulaAction = require("opennebula/action");
  var CommonActions = require("utils/common-actions");

  var RESOURCE = "Network";
  var XML_ROOT = "VNET";
  var TAB_ID = require("./tabId");

  var INSTANTIATE_DIALOG_ID = require("./form-panels/instantiate/formPanelId");
  var CREATE_DIALOG_ID = require("./form-panels/create/formPanelId");
  var ADD_AR_DIALOG_ID = require("./dialogs/add-ar/dialogId");
  var UPDATE_AR_DIALOG_ID = require("./dialogs/update-ar/dialogId");
  var RESERVE_DIALOG_ID = require("./dialogs/reserve/dialogId");
  var IMPORT_DIALOG_ID = require("./form-panels/import/formPanelId");
  var CLUSTERS_DIALOG_ID = require("utils/dialogs/clusters/dialogId");
  var ADD_SECGROUPS_DIALOG_ID = require("./dialogs/add-secgroups/dialogId");

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("Virtual Network created"));

  var _actions = {
    "Network.create" : _commonActions.create(CREATE_DIALOG_ID),
    "Network.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "Network.list" : _commonActions.list(),
    "Network.show" : _commonActions.show(),
    "Network.refresh" : _commonActions.refresh(),
    "Network.delete" : _commonActions.del(),
    "Network.hold": _commonActions.singleAction("hold"),
    "Network.release": _commonActions.singleAction("release"),
    "Network.chown": _commonActions.multipleAction("chown"),
    "Network.chgrp": _commonActions.multipleAction("chgrp"),
    "Network.chmod": _commonActions.singleAction("chmod"),
    "Network.rename": _commonActions.singleAction("rename"),
    "Network.update" : _commonActions.update(),
    "Network.update_template" : _commonActions.updateTemplate(),
    "Network.append_template" : _commonActions.appendTemplate(),
    "Network.update_dialog" : _commonActions.checkAndShowUpdate(),
    "Network.show_to_update" : _commonActions.showUpdate(CREATE_DIALOG_ID),
    "Network.lockM": _commonActions.multipleAction("lock", false),
    "Network.lockU": _commonActions.multipleAction("lock", false),
    "Network.lockA": _commonActions.multipleAction("lock", false),
    "Network.unlock": _commonActions.multipleAction("unlock", false),
    "Network.recover": _commonActions.multipleAction("recover"),

    "Network.import_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, IMPORT_DIALOG_ID, "import");
      }
    },

    "Network.instantiate_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, INSTANTIATE_DIALOG_ID, "instantiate");
      }
    },

    "Network.add_ar" : {
      type: "single",
      call: OpenNebulaResource.add_ar,
      callback: function(req) {
        // Reset the wizard
        Sunstone.getDialog(ADD_AR_DIALOG_ID).hide();
        Sunstone.getDialog(ADD_AR_DIALOG_ID).reset();

        Sunstone.runAction("Network.show",req.request.data[0]);
      },
      error: Notifier.onError
    },

    "Network.rm_ar" : {
      type: "single",
      call: OpenNebulaResource.rm_ar,
      callback: function(req) {
        OpenNebulaAction.clear_cache("VNET");
        Sunstone.runAction("Network.show",req.request.data[0]);
      },
      error: Notifier.onError
    },

    "Network.update_ar" : {
      type: "single",
      call: OpenNebulaResource.update_ar,
      callback: function(req) {
        // Reset the wizard
        Sunstone.getDialog(UPDATE_AR_DIALOG_ID).hide();
        Sunstone.getDialog(UPDATE_AR_DIALOG_ID).reset();

        Sunstone.runAction("Network.show",req.request.data[0]);
      },
      error: Notifier.onError
    },

    "Network.reserve_dialog" : {
      type: "custom",
      call: function() {
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();
        if (selected_nodes.length != 1) {
          Notifier.notifyMessage("Please select one (and just one) Virtual Network.");
          return false;
        }

        var resource_id = "" + selected_nodes[0];

        Sunstone.getDialog(RESERVE_DIALOG_ID).setParams({vnetId: resource_id});
        Sunstone.getDialog(RESERVE_DIALOG_ID).reset();
        Sunstone.getDialog(RESERVE_DIALOG_ID).show();
      }
    },

    "Network.reserve" : {
      type: "single",
      call: OpenNebulaResource.reserve,
      callback: function(req) {
        // Reset the wizard
        Sunstone.getDialog(RESERVE_DIALOG_ID).hide();
        Sunstone.getDialog(RESERVE_DIALOG_ID).reset();

        OpenNebulaAction.clear_cache("VNET");
        Sunstone.runAction("Network.show",req.request.data[0]);
      },
      error: Notifier.onError
    },

    "Network.addtocluster" : _commonActions.checkAndShow("clusters"),

    "Network.clusters" : {
      type: "single",
      call: OpenNebulaResource.show,
      callback: function(request, response) {
        Sunstone.getDialog(CLUSTERS_DIALOG_ID).setParams({
          element: response[XML_ROOT],
          resource:"vnet",
          resource_name: RESOURCE,
          only_update_template: false
        });

        Sunstone.getDialog(CLUSTERS_DIALOG_ID).reset();
        Sunstone.getDialog(CLUSTERS_DIALOG_ID).show();
      },
      error: Notifier.onError
    },

    "Network.add_secgroup" : {
      type: "single",
      call: OpenNebulaResource.append,
      callback: function(req) {
        // Reset the wizard
        Sunstone.getDialog(ADD_SECGROUPS_DIALOG_ID).hide();
        Sunstone.getDialog(ADD_SECGROUPS_DIALOG_ID).reset();

        Sunstone.runAction("Network.show",req.request.data[0]);
      },
      error: Notifier.onError
    },

    "Network.rm_secgroup" : {
      type: "single",
      call: OpenNebulaResource.update,
      callback: function(req) {
        // Reset the wizard
        Sunstone.getDialog(ADD_SECGROUPS_DIALOG_ID).hide();
        Sunstone.getDialog(ADD_SECGROUPS_DIALOG_ID).reset();

        Sunstone.runAction("Network.show",req.request.data[0]);
      },
      error: Notifier.onError
    }
  };

  return _actions;
});
