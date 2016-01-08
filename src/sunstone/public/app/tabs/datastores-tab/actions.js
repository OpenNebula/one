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
  var OpenNebulaResource = require('opennebula/datastore');
  var OpenNebulaCluster = require('opennebula/cluster');
  var OpenNebulaAction = require('opennebula/action');
  var CommonActions = require('utils/common-actions');

  var RESOURCE = "Datastore";
  var XML_ROOT = "DATASTORE";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID, XML_ROOT);

  var _actions = {
    "Datastore.create" : _commonActions.create(CREATE_DIALOG_ID),
    "Datastore.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
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

    "Datastore.addtocluster" : {
      type: "multiple",
      call: function(params, success) {
        var cluster = params.data.extra_param;
        var ds = params.data.id;

        if (cluster == -1) {
          OpenNebulaResource.show({
            data : {
              id: ds
            },
            success: function (request, ds_info) {
              var current_cluster = ds_info.DATASTORE.CLUSTER_ID;

              if (current_cluster != -1) {
                OpenNebulaCluster.deldatastore({
                  data: {
                    id: current_cluster,
                    extra_param: ds
                  },
                  success: function() {
                    OpenNebulaAction.clear_cache("DATASTORE");
                    Sunstone.runAction('Datastore.show', ds);
                  },
                  error: Notifier.onError
                });
              } else {
                OpenNebulaAction.clear_cache("DATASTORE");
                Sunstone.runAction('Datastore.show', ds);
              }
            },
            error: Notifier.onError
          });
        } else {
          OpenNebulaCluster.adddatastore({
            data: {
              id: cluster,
              extra_param: ds
            },
            success: function() {
              OpenNebulaAction.clear_cache("DATASTORE");
              Sunstone.runAction('Datastore.show', ds);
            },
            error: Notifier.onError
          });
        }
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      }
    }
  };

  return _actions;
});
