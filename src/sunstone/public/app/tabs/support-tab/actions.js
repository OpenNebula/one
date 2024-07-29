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
  var OpenNebulaSupport = require("opennebula/support");
  var SupportUtils = require("./utils/common");

  var RESOURCE = "Support";
  var TAB_ID = require("./tabId");
  var CREATE_DIALOG_ID = require("./form-panels/create/formPanelId");
  var UPLOAD_DIALOG_ID = require("./dialogs/upload/dialogId");

  var _actions = {
    "Support.list" : {
      type: "list",
      call: OpenNebulaSupport.list,
      callback: function(req, list, res){
        SupportUtils.showSupportList();
        $(".support_open_value").text(res.open_requests);
        $(".support_pending_value").text(res.pending_requests);
        var elements = [];
        if(res.REQUEST_POOL.REQUEST){
          elements = res.REQUEST_POOL.REQUEST;
        }
        Sunstone.getDataTable(TAB_ID).updateView(req, elements);
      },
      error: function(request, error_json) {
        if (error_json.error.http_status=="401") {
          SupportUtils.stopIntervalRefresh();
        }
        SupportUtils.showSupportConnect();
      }
    },
    "Support.refresh" : {
      type: "custom",
      call: function() {
        var tab = $("#" + TAB_ID);
        if (Sunstone.rightInfoVisible(tab)) {
          Sunstone.runAction(RESOURCE+".show", Sunstone.rightInfoResourceId(tab));
        } else {
          Sunstone.getDataTable(TAB_ID).waitingNodes();
          Sunstone.runAction(RESOURCE+".list", {force: true});
        }
      },
      error: function() {
        SupportUtils.showSupportConnect();
      }
    },
    "Support.show" : {
      type: "single",
      call: OpenNebulaSupport.show,
      callback: function(request, response) {
        //Sunstone.getDataTable(TAB_ID).updateElement(request, response);
        if (Sunstone.rightInfoVisible($("#"+TAB_ID))) {
          Sunstone.insertPanels(TAB_ID, response);
        }
      },
      error: function() {
        SupportUtils.showSupportConnect();
      }
    },
    "Support.create" : {
      type: "create",
      call: OpenNebulaSupport.create,
      callback: function(){
        Sunstone.resetFormPanel(TAB_ID, CREATE_DIALOG_ID);
        Sunstone.hideFormPanel(TAB_ID);
        Sunstone.runAction("Support.refresh");
      },
      error: function(request, error_json){
        if (error_json.error.http_status=="403") {
          Sunstone.hideFormPanelLoading(TAB_ID);
          Notifier.notifyError(error_json.error.message);
        } else {
          Sunstone.hideFormPanel(TAB_ID);
          SupportUtils.showSupportConnect();
        }
      }
    },
    "Support.create_dialog" : {
      type: "custom",
      call: function(){
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },
    "Support.update" : {
      type: "single",
      call: OpenNebulaSupport.update,
      callback: function(){
        Sunstone.runAction("Support.refresh");
        Notifier.notifyMessage("Comment added correctly");
      },
      error: function(){
        Sunstone.runAction("Support.refresh");
        Notifier.notifyError("Comment failed to be added");
      }
    },
    "Support.signout" : {
      type: "single",
      call: function() {
        $.ajax({
          url: "support/credentials",
          type: "DELETE",
          dataType: "text",
          success: function(){
            SupportUtils.showSupportConnect();
            Sunstone.runAction("Support.refresh");
          },
          error: function(response){
            if (response.status === "401") {
              Notifier.notifyError("Support credentials are incorrect");
            } else {
              Notifier.notifyError(response.responseText);
            }
          }
        });
      }
    },
    "Support.upload" : {
      type: "single",
      call: function() {
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();
        var resource_id = "" + selected_nodes[0];

        Sunstone.getDialog(UPLOAD_DIALOG_ID).setParams({requestId: resource_id});
        Sunstone.getDialog(UPLOAD_DIALOG_ID).reset();
        Sunstone.getDialog(UPLOAD_DIALOG_ID).show();
      }
    }
  };

  return _actions;
});
