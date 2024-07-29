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
  var OpenNebulaResource = require('opennebula/cluster');
  var OpenNebulaAction = require('opennebula/action');
  var CommonActions = require('utils/common-actions');
  var Navigation = require('utils/navigation');

  var RESOURCE = "Cluster";
  var XML_ROOT = "CLUSTER";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("Cluster created"));

  var _actions = {
    "Cluster.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "Cluster.list" : _commonActions.list(),
    "Cluster.show" : _commonActions.show(),
    "Cluster.refresh" : _commonActions.refresh(),
    "Cluster.delete" : _commonActions.del(),
    "Cluster.update_template" : _commonActions.updateTemplate(),
    "Cluster.append_template" : _commonActions.appendTemplate(),
    "Cluster.update_dialog" : _commonActions.checkAndShowUpdate(),
    "Cluster.show_to_update" : _commonActions.showUpdate(CREATE_DIALOG_ID),
    "Cluster.rename": _commonActions.singleAction('rename'),

    "Cluster.create" : {
      type: "create",
      call: OpenNebulaResource.create,
      callback: function(request, response){
        for (var host in request.request.data[0].cluster.hosts)
          if (request.request.data[0].cluster.hosts[host])
            Sunstone.runAction("Cluster.addhost",response[XML_ROOT].ID,host);
        for (var vnet in request.request.data[0].cluster.vnets)
          if (request.request.data[0].cluster.vnets[vnet])
            Sunstone.runAction("Cluster.addvnet",response[XML_ROOT].ID,vnet);
        for (var datastore in request.request.data[0].cluster.datastores)
          if (request.request.data[0].cluster.datastores[datastore])
            Sunstone.runAction("Cluster.adddatastore",response[XML_ROOT].ID,datastore);

        Sunstone.resetFormPanel(TAB_ID, CREATE_DIALOG_ID);
        Sunstone.hideFormPanel(TAB_ID);
        Sunstone.runAction("Cluster.refresh");

        Notifier.notifyCustom(Locale.tr("Cluster created"),
          Navigation.link(" ID: " + response[XML_ROOT].ID, TAB_ID, response[XML_ROOT].ID),
          false);
      },
      error: function(request, response){
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.onError(request, response);
      }
    },

    "Cluster.addhost" : {
      type: "single",
      call : OpenNebulaResource.addhost,
      callback : function (req) {
        OpenNebulaAction.clear_cache("HOST");
        Sunstone.runAction('Cluster.show',req.request.data[0]);
      },
      error : Notifier.onError
    },

    "Cluster.delhost" : {
      type: "single",
      call : OpenNebulaResource.delhost,
      callback : function (req) {
        OpenNebulaAction.clear_cache("HOST");
        Sunstone.runAction('Cluster.show',req.request.data[0]);
      },
      error : Notifier.onError
    },

    "Cluster.adddatastore" : {
      type: "single",
      call : OpenNebulaResource.adddatastore,
      callback : function (req) {
        OpenNebulaAction.clear_cache("DATASTORE");
        Sunstone.runAction('Cluster.show',req.request.data[0]);
      },
      error : Notifier.onError
    },

    "Cluster.deldatastore" : {
      type: "single",
      call : OpenNebulaResource.deldatastore,
      callback : function (req) {
        OpenNebulaAction.clear_cache("DATASTORE");
        Sunstone.runAction('Cluster.show',req.request.data[0]);
      },
      error : Notifier.onError
    },

    "Cluster.addvnet" : {
      type: "single",
      call : OpenNebulaResource.addvnet,
      callback : function (req) {
        OpenNebulaAction.clear_cache("VNET");
        Sunstone.runAction('Cluster.show',req.request.data[0]);
      },
      error : Notifier.onError
    },

    "Cluster.delvnet" : {
      type: "single",
      call : OpenNebulaResource.delvnet,
      callback : function (req) {
        OpenNebulaAction.clear_cache("VNET");
        Sunstone.runAction('Cluster.show',req.request.data[0]);
      },
      error : Notifier.onError
    }
  };

  return _actions;
});
