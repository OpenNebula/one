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
  var OpenNebulaResource = require('opennebula/group');
  var CommonActions = require('utils/common-actions');

  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var QUOTAS_DIALOG_ID = require('./dialogs/quotas/dialogId');

  var RESOURCE = "Group";
  var XML_ROOT = "GROUP";

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("Group created"));

  var _actions = {
    "Group.create" : _commonActions.create(CREATE_DIALOG_ID),
    "Group.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "Group.list" : _commonActions.list(),
    "Group.show" : _commonActions.show(),
    "Group.refresh" : _commonActions.refresh(),
    "Group.delete" : _commonActions.del(),
    "Group.update" : _commonActions.update(),
    "Group.update_template" : _commonActions.updateTemplate(),
    "Group.append_template" : _commonActions.appendTemplate(),
    "Group.update_dialog" : _commonActions.checkAndShowUpdate(),
    "Group.show_to_update" : _commonActions.showUpdate(CREATE_DIALOG_ID),

    "Group.fetch_quotas" : {
      type: "single",
      call: OpenNebulaResource.show,
      callback: function (request,response) {
        Sunstone.getDialog(QUOTAS_DIALOG_ID).setParams({element: response[XML_ROOT]});
        Sunstone.getDialog(QUOTAS_DIALOG_ID).reset();
        Sunstone.getDialog(QUOTAS_DIALOG_ID).show();
      },
      error: Notifier.onError
    },

    "Group.quotas_dialog" : {
      type: "custom",
      call: function() {
        var tab = $('#' + TAB_ID);
        if (Sunstone.rightInfoVisible(tab)) {
          $('a[href="#group_quotas_tab"]', tab).click();
          $('#edit_quotas_button', tab).click();
        } else {
          var sel_elems = Sunstone.getDataTable(TAB_ID).elements();
          //If only one group is selected we fecth the group's quotas
          if (sel_elems.length == 1){
            Sunstone.runAction(RESOURCE+'.fetch_quotas',sel_elems[0]);
          } else {
            // More than one, shows '0' usage
            Sunstone.getDialog(QUOTAS_DIALOG_ID).setParams({element: {}});
            Sunstone.getDialog(QUOTAS_DIALOG_ID).reset();
            Sunstone.getDialog(QUOTAS_DIALOG_ID).show();
          }
        }
      }
    },

    "Group.set_quota" : {
      type: "multiple",
      call: OpenNebulaResource.set_quota,
      elements: function(opts) {
        return Sunstone.getDataTable(TAB_ID).elements(opts);
      },
      callback: function(request) {
        Sunstone.getDialog(QUOTAS_DIALOG_ID).hide();

        Sunstone.runAction(RESOURCE+'.show',request.request.data[0]);
      },
      error: Notifier.onError
    },

    "Group.add_admin" : {
      type: "single",
      call : OpenNebulaResource.add_admin,
      callback : function (req) {
        Sunstone.runAction(RESOURCE+'.show',req.request.data[0]);
      },
      error: Notifier.onError
    },

    "Group.del_admin" : {
      type: "single",
      call : OpenNebulaResource.del_admin,
      callback : function (req) {
        Sunstone.runAction(RESOURCE+'.show',req.request.data[0]);
      },
      error: Notifier.onError
    }
  };

  return _actions;
});
