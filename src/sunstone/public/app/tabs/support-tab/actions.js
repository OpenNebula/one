define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var OpenNebulaSupport = require('opennebula/support');
  var SupportUtils = require('./utils/common');

  var RESOURCE = "Support";
  var TAB_ID = require('./tabId');
  //var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

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
        var tab = $('#' + TAB_ID);
        if (Sunstone.rightInfoVisible(tab)) {
          Sunstone.runAction(RESOURCE+".show", Sunstone.rightInfoResourceId(tab));
        } else {
          Sunstone.getDataTable(TAB_ID).waitingNodes();
          Sunstone.runAction(RESOURCE+".list", {force: true});
        }
      },
      error: function(request, error_json) {
        SupportUtils.showSupportConnect();
      }
    },
    "Support.show" : {
      type: "single",
      call: OpenNebulaSupport.show,
      callback: function(request, response) {
        //Sunstone.getDataTable(TAB_ID).updateElement(request, response);
        if (Sunstone.rightInfoVisible($('#'+TAB_ID))) {
          Sunstone.insertPanels(TAB_ID, response);
        }
      },
      error: function(request, error_json) {
        SupportUtils.showSupportConnect();
      }
    },
 /*TODO
    "Support.create" : {
      type: "create",
      call: OpenNebulaSupport.create,
      callback: function(request, response){
         $("a[href=back]", $("#support-tab")).trigger("click");
        popFormDialog("create_support_request_form", $("#support-tab"));

        Sunstone.runAction("Support.refresh");
        //addTemplateElement(request, response);
        //notifyCustom(tr("Request created"), " ID: " + response.VMTEMPLATE.ID, false)
      },
      error: function(request, error_json){
        popFormDialog("create_support_request_form", $("#support-tab"));
        if (error_json.error.http_status=="403") {
          notifyError(error_json.error.message);
        } else {
          $("a[href=back]", $("#support-tab")).trigger("click");
          SupportUtils.showSupportConnect();
        }
      }

    },

    "Support.create_dialog" : {
      type: "custom",
      call: function(){
        Sunstone.popUpFormPanel(
          "create_support_request_form",
          "support-tab",
          "create",
          false,
          function(context){});
      }
    },
    */
    "Support.update" : {
      type: "single",
      call: OpenNebulaSupport.update,
      callback: function(request, response){
        Sunstone.runAction("Support.refresh");
        Notifier.notifyMessage("Comment added correctly");
      },
      error: function(request, response){
        Sunstone.runAction("Support.refresh");
        //Notifier.onError(request, response);
        Notifier.notifyError("Comment failed to be added");
      }
    },
    "Support.signout" : {
      type: "single",
      call: function() {
        $.ajax({
          url: 'support/credentials',
          type: "DELETE",
          dataType: "text",
          success: function(){
            SupportUtils.showSupportConnect();
            Sunstone.runAction("Support.refresh");
          },
          error: function(response){
            if (response.status=="401") {
              Notifier.notifyError("Support credentials are incorrect");
            } else {
              Notifier.notifyError(response.responseText);
            }
          }
        });
      }
    },
/* TODO
    "Support.upload" : {
      type: "single",
      call: function() {
        $upload_support_file.foundation("reveal", "open");
      }
    }
*/
  };

  return _actions;
});