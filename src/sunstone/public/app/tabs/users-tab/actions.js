define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/user');
  var CommonActions = require('utils/common-actions');

  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var PASSWORD_DIALOG_ID = require('./dialogs/password/dialogId');
  var AUTH_DRIVER_DIALOG_ID = require('./dialogs/auth-driver/dialogId');
  var QUOTAS_DIALOG_ID = require('./dialogs/quotas/dialogId');

  var RESOURCE = "User";
  var XML_ROOT = "USER";

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID, XML_ROOT);

  var _actions = {
    "User.create" : _commonActions.create(CREATE_DIALOG_ID),
    "User.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "User.list" : _commonActions.list(),
    "User.show" : _commonActions.show(),
    "User.refresh" : _commonActions.refresh(),
    "User.delete" : _commonActions.del(),
    "User.chgrp": _commonActions.multipleAction('chgrp'),
    "User.addgroup": _commonActions.multipleAction('addgroup'),
    "User.delgroup": _commonActions.multipleAction('delgroup'),

    "User.update_password" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(PASSWORD_DIALOG_ID).setParams(
          {selectedElements: Sunstone.getDataTable(TAB_ID).elements()});
        Sunstone.getDialog(PASSWORD_DIALOG_ID).reset();
        Sunstone.getDialog(PASSWORD_DIALOG_ID).show();
      }
    },

    "User.passwd" : {
      type: "multiple",
      call: OpenNebulaResource.passwd,
      error: Notifier.onError
    },


    "User.change_authentication" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(AUTH_DRIVER_DIALOG_ID).show();
      }
    },

    "User.chauth" : {
      type: "multiple",
      call: OpenNebulaResource.chauth,
      error: Notifier.onError,
    },

    "User.update_template" : {
      type: "single",
      call: OpenNebulaResource.update,
      callback: function(request) {
        var reqId = request.request.data[0][0];

        Sunstone.runAction(RESOURCE+'.show',reqId);

        if (reqId == config['user_id'] || reqId == "-1") {
          Sunstone.runAction('Settings.refresh');

          $.ajax({
            url: 'config',
            type: "POST",
            dataType: "json",
            success: function() {
              return false;
            },
            error: function(response) {
            }
          });
        }
      },
      error: Notifier.onError
    },

    "User.append_template" : {
      type: "single",
      call: OpenNebulaResource.append,
      callback: function(request) {
        var reqId = request.request.data[0][0];

        Sunstone.runAction(RESOURCE+'.show',reqId);

        if (reqId == config['user_id'] || reqId == "-1") {
          Sunstone.runAction('Settings.refresh');

          $.ajax({
            url: 'config',
            type: "POST",
            dataType: "json",
            success: function() {
              return false;
            },
            error: function(response) {
            }
          });
        }
      },
      error: Notifier.onError
    },

    "User.append_template_refresh" : {
      type: "single",
      call: OpenNebulaResource.append,
      callback: function(request) {
        var reqId = request.request.data[0][0];

        if (reqId == config['user_id'] || reqId == "-1") {
          $.ajax({
            url: 'config',
            type: "POST",
            dataType: "json",
            success: function() {
              window.location.href = ".";
            },
            error: function(response) {
            }
          });
        } else {
          Sunstone.runAction(RESOURCE+'.show',reqId);
        }
      },
      error: Notifier.onError
    },

    "User.fetch_quotas" : {
      type: "single",
      call: OpenNebulaResource.show,
      callback: function (request,response) {
        Sunstone.getDialog(QUOTAS_DIALOG_ID).setParams({element: response[XML_ROOT]});
        Sunstone.getDialog(QUOTAS_DIALOG_ID).reset();
        Sunstone.getDialog(QUOTAS_DIALOG_ID).show();
      },
      error: Notifier.onError
    },

    "User.quotas_dialog" : {
      type: "custom",
      call: function() {
        var tab = $('#' + TAB_ID);
        if (Sunstone.rightInfoVisible(tab)) {
          $('a[href="#user_quotas_tab"]', tab).click();
          $('#edit_quotas_button', tab).click();
        } else {
          var sel_elems = Sunstone.getDataTable(TAB_ID).elements();
          //If only one user is selected we fecth the user's quotas
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

    "User.set_quota" : {
      type: "multiple",
      call: OpenNebulaResource.set_quota,
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      callback: function(request) {
        Sunstone.getDialog(QUOTAS_DIALOG_ID).hide();

        Sunstone.runAction(RESOURCE+'.show',request.request.data[0]);
      },
      error: Notifier.onError
    }
  };

  return _actions;
});
