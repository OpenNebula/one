define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaGroup = require('opennebula/group');

  var TAB_ID = require('./tabId');
  // TODO
  //var CREATE_DIALOG_ID = require('./dialogs/create/dialogId');

  var _actions = {
    "Group.create" : {
      type: "create",
      call: OpenNebulaGroup.create,
      callback : function(request, response) {
        Sunstone.getDialog(CREATE_DIALOG_ID).hide();
        Sunstone.getDialog(CREATE_DIALOG_ID).reset();
        DataTable.addElement(request, response);
      },
      error: Notifier.onError,
      notify: true
    },

    "Group.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.getDialog(CREATE_DIALOG_ID).show();
      }
    },

    "Group.list" : {
      type: "list",
      call: OpenNebulaGroup.list,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: Notifier.onError
    },

    "Group.show" : {
      type: "single",
      call: OpenNebulaGroup.show,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateElement(request, response);
        if (Sunstone.rightInfoVisible($('#'+TAB_ID))) {
          Sunstone.insertPanels(TAB_ID, response);
        }
      },
      error: Notifier.onError
    },

    "Group.refresh" : {
      type: "custom",
      call: function() {
        var tab = $('#' + TAB_ID);
        if (Sunstone.rightInfoVisible(tab)) {
          Sunstone.runAction("Group.show", Sunstone.rightInfoResourceId(tab));
        } else {
          Sunstone.getDataTable(TAB_ID).waitingNodes();
          Sunstone.runAction("Group.list", {force: true});
        }
      },
      error: Notifier.onError
    },

    "Group.update_template" : {
      type: "single",
      call: OpenNebulaGroup.update,
      callback: function(request) {
        Sunstone.runAction('Group.show',request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    /* TODO
    "Group.update_dialog" : {
        type: "single",
        call: initUpdateGroupDialog
    },

    "Group.show_to_update" : {
        type: "single",
        call: OpenNebula.Group.show,
        callback: function(request, response) {
            popUpUpdateGroupDialog(
                response.GROUP,
                $create_group_dialog);
        },
        error: onError
    },
    */

    "Group.delete" : {
      type: "multiple",
      call : OpenNebulaGroup.del,
      callback : function(request, response) {
        Sunstone.getDataTable(TAB_ID).deleteElement(request, response);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
    },

    /* TODO
    "Group.fetch_quotas" : {
        type: "single",
        call: OpenNebula.Group.show,
        callback: function (request,response) {
            populateQuotasDialog(
                response.GROUP,
                default_group_quotas,
                "#group_quotas_dialog",
                $group_quotas_dialog);
        },
        error: onError
    },

    "Group.quotas_dialog" : {
        type: "custom",
        call: popUpGroupQuotasDialog
    },

    "Group.set_quota" : {
        type: "multiple",
        call: OpenNebula.Group.set_quota,
        elements: groupElements,
        callback: function(request,response) {
            Sunstone.runAction('Group.show',request.request.data[0]);
        },
        error: onError
    },

    "Group.accounting" : {
        type: "monitor",
        call: OpenNebula.Group.accounting,
        callback: function(req,response) {
            var info = req.request.data[0].monitor;
            //plot_graph(response,'#group_acct_tabTab','group_acct_', info);
        },
        error: onError
    },

    "Group.add_admin" : {
        type: "single",
        call : OpenNebula.Group.add_admin,
        callback : function (req) {
            Sunstone.runAction('Group.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Group.del_admin" : {
        type: "single",
        call : OpenNebula.Group.del_admin,
        callback : function (req) {
            Sunstone.runAction('Group.show',req.request.data[0][0]);
        },
        error : onError
    }
    */
  };

  return _actions;
})
