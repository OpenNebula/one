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
  var OpenNebulaResource = require('opennebula/host');
  var OpenNebulaCluster = require('opennebula/cluster');
  var OpenNebulaAction = require('opennebula/action');
  var CommonActions = require('utils/common-actions');
  var OpenNebulaError  = require('../../opennebula/error');

  var TAB_ID = require('./tabId');
  var XML_ROOT = "HOST"
  var RESOURCE = "Host"
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("Host created"));

  var _actions = {
    "Host.create" : _commonActions.create(CREATE_DIALOG_ID),
    "Host.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "Host.list" : _commonActions.list(),
    "Host.show" : _commonActions.show(),
    "Host.refresh" : _commonActions.refresh(),
    "Host.delete" : _commonActions.del(),
    "Host.update_template" : _commonActions.updateTemplate(),
    "Host.append_template" : _commonActions.appendTemplate(),
    "Host.enable" : _commonActions.multipleAction('enable'),
    "Host.disable": _commonActions.multipleAction('disable'),
    "Host.offline": _commonActions.multipleAction('offline'),
    "Host.rename" : _commonActions.singleAction('rename'),
    "Host.validateCredentials": {
      call: function(params, extra_param){
        var defaultSuccess = function(response){
          Notifier.onError({}, OpenNebulaError(response));
        };
        var success = extra_param && extra_param.success && typeof extra_param.success === "function"? extra_param.success : defaultSuccess;

        $.ajax({
          url: "/nsx/auth",
          type: "POST",
          data: {NSX_MANAGER: params.nsxmngr, nsxuser: params.user, nsxpassword: params.pass, NSX_TYPE: params.nsxtype},
          success: success,
          error: function(response){
            Notifier.onError({}, {error:{message: Locale.tr("Error NSX data credentials, check and try again")}});
          }
        });
      }
    },
    "Host.addtocluster" : {
      type: "multiple",
      call: function(params){
        var cluster = params.data.extra_param;
        var host = params.data.id;

        if (cluster == -1){
          OpenNebulaResource.show({
            data : {
              id: host
            },
            success: function (request, info){
              var element = info.HOST;

              var current_cluster = element.CLUSTER_ID;

              if(current_cluster != -1){
                OpenNebulaCluster.delhost({
                  data: {
                    id: current_cluster,
                    extra_param: host
                  },
                  success: function(){
                    OpenNebulaAction.clear_cache("HOST");
                    Sunstone.runAction('Host.show',host);
                  },
                  error: Notifier.onError
                });
              } else {
                OpenNebulaAction.clear_cache("HOST");
                Sunstone.runAction('Host.show',host);
              }
            },
            error: Notifier.onError
          });
        } else {
          OpenNebulaCluster.addhost({
            data: {
              id: cluster,
              extra_param: host
            },
            success: function(){
              OpenNebulaAction.clear_cache("HOST");
              Sunstone.runAction('Host.show',host);
            },
            error: Notifier.onError
          });
        }
      },
      elements: function(opts) {
        return Sunstone.getDataTable(TAB_ID).elements(opts);
      }
    }
  };

  return _actions;
})
