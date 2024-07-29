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
  var OpenNebulaResource = require('opennebula/vdc');
  var CommonActions = require('utils/common-actions');
  var Navigation = require('utils/navigation');

  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var RESOURCE = "Vdc";
  var XML_ROOT = "VDC";

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("VDC created"));

  var _actions = {
    "Vdc.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "Vdc.list" : _commonActions.list(),
    "Vdc.show" : _commonActions.show(),
    "Vdc.refresh" : _commonActions.refresh(),
    "Vdc.delete" : _commonActions.del(),
    "Vdc.update" : _commonActions.update(),
    "Vdc.update_template" : _commonActions.updateTemplate(),
    "Vdc.append_template" : _commonActions.appendTemplate(),
    "Vdc.update_dialog" : _commonActions.checkAndShowUpdate(),
    "Vdc.show_to_update" : _commonActions.showUpdate(CREATE_DIALOG_ID),
    "Vdc.rename": _commonActions.singleAction('rename'),

    "Vdc.create" : {
      type: "create",
      call: OpenNebulaResource.create,
      callback: function(request, response) {
        var group_ids = request.request.data[0].group_ids;
        if(group_ids !=undefined){
          $.each(group_ids,function(){
            Sunstone.runAction(RESOURCE+".add_group",
              response.VDC.ID,
              { group_id : parseInt(this)});
          });
        }

        var clusters = request.request.data[0].clusters;
        if(clusters !=undefined){
          $.each(clusters,function(){
            Sunstone.runAction(RESOURCE+".add_cluster",
              response.VDC.ID,
              this);
          });
        }

        var hosts = request.request.data[0].hosts;
        if(hosts !=undefined){
          $.each(hosts,function(){
            Sunstone.runAction(RESOURCE+".add_host",
              response.VDC.ID,
              this);
          });
        }

        var vnets = request.request.data[0].vnets;
        if(vnets !=undefined){
          $.each(vnets,function(){
            Sunstone.runAction(RESOURCE+".add_vnet",
              response.VDC.ID,
              this);
          });
        }

        var datastores = request.request.data[0].datastores;
        if(datastores !=undefined){
          $.each(datastores,function(){
            Sunstone.runAction(RESOURCE+".add_datastore",
              response.VDC.ID,
              this);
          });
        }

        Sunstone.resetFormPanel(TAB_ID, CREATE_DIALOG_ID);
        Sunstone.hideFormPanel(TAB_ID);

        // TODO: this vdc.show may get the information before the add/del
        // actions end, showing "outdated" information

        Sunstone.runAction(RESOURCE+'.refresh');
        Notifier.notifyCustom(Locale.tr("VDC created"),
          Navigation.link(" ID: " + response.VDC.ID, "vdcs-tab", response.VDC.ID),
          false);
      },
      error: function(request, response){
        Sunstone.hideFormPanelLoading(TAB_ID);
        Notifier.onError(request, response);
      }
    },

    "Vdc.add_group" : {
      type: "single",
      call : OpenNebulaResource.add_group,
      error : Notifier.onError
    },

    "Vdc.del_group" : {
      type: "single",
      call : OpenNebulaResource.del_group,
      error : Notifier.onError
    },

    "Vdc.add_cluster" : {
      type: "single",
      call : OpenNebulaResource.add_cluster,
      error : Notifier.onError
    },

    "Vdc.del_cluster" : {
      type: "single",
      call : OpenNebulaResource.del_cluster,
      error : Notifier.onError
    },

    "Vdc.add_host" : {
      type: "single",
      call : OpenNebulaResource.add_host,
      error : Notifier.onError
    },

    "Vdc.del_host" : {
      type: "single",
      call : OpenNebulaResource.del_host,
      error : Notifier.onError
    },

    "Vdc.add_vnet" : {
      type: "single",
      call : OpenNebulaResource.add_vnet,
      error : Notifier.onError
    },

    "Vdc.del_vnet" : {
      type: "single",
      call : OpenNebulaResource.del_vnet,
      error : Notifier.onError
    },

    "Vdc.add_datastore" : {
      type: "single",
      call : OpenNebulaResource.add_datastore,
      error : Notifier.onError
    },

    "Vdc.del_datastore" : {
      type: "single",
      call : OpenNebulaResource.del_datastore,
      error : Notifier.onError
    }
  };

  return _actions;
})
