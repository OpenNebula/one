define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaSecurityGroup = require('opennebula/securitygroup');

  var TAB_ID = require('./tabId');
  // TODO
  //var CREATE_DIALOG_ID = require('./dialogs/create/dialogId');

  var _actions = {
    /*
    TODO
    "SecurityGroup.create" : {
        type: "create",
        call: OpenNebulaSecurityGroup.create,
        callback: function(request, response){
            $("a[href=back]", $("#secgroups-tab")).trigger("click");
            popFormDialog("create_security_group_form", $("#secgroups-tab"));

            addSecurityGroupElement(request, response);
            notifyCustom(tr("Security Group created"), " ID: " + response.SECURITY_GROUP.ID, false);
        },
        error: function(request, response){
            popFormDialog("create_security_group_form", $("#secgroups-tab"));
            onError(request, response);
        }
    },

    "SecurityGroup.create_dialog" : {
        type: "custom",
        call: function(){
          Sunstone.popUpFormPanel("create_security_group_form", "secgroups-tab", "create", true);
        }
    },
    */

    "SecurityGroup.list" : {
      type: "list",
      call: OpenNebulaSecurityGroup.list,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateView(request, response);
      },
      error: Notifier.onError
    },

    "SecurityGroup.show" : {
      type: "single",
      call: OpenNebulaSecurityGroup.show,
      callback: function(request, response) {
        Sunstone.getDataTable(TAB_ID).updateElement(request, response);
        if (Sunstone.rightInfoVisible($('#'+TAB_ID))) {
          Sunstone.insertPanels(TAB_ID, response);
        }
      },
      error: Notifier.onError
    },

    "SecurityGroup.refresh" : {
      type: "custom",
      call: function() {
        var tab = $('#' + TAB_ID);
        if (Sunstone.rightInfoVisible(tab)) {
          Sunstone.runAction("SecurityGroup.show", Sunstone.rightInfoResourceId(tab));
        } else {
          Sunstone.getDataTable(TAB_ID).waitingNodes();
          Sunstone.runAction("SecurityGroup.list", {force: true});
        }
      },
      error: Notifier.onError
    },

    "SecurityGroup.delete" : {
      type: "multiple",
      call : OpenNebulaSecurityGroup.del,
      callback : function(request, response) {
        Sunstone.getDataTable(TAB_ID).deleteElement(request, response);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },
    /*
    TODO
    "SecurityGroup.update_dialog" : {
        type: "custom",
        call: function(){
            var selected_nodes = securityGroupElements();
            if ( selected_nodes.length != 1 ) {
                notifyMessage("Please select one (and just one) Security Group to update.");
                return false;
            }

            var resource_id = ""+selected_nodes[0];
            Sunstone.runAction("SecurityGroup.show_to_update", resource_id);
        }
    },

    "SecurityGroup.show_to_update" : {
        type: "single",
        call: OpenNebulaSecurityGroup.show,
        callback: function(request, response) {
            // TODO: global var, better use jquery .data
            sg_to_update_id = response.SECURITY_GROUP.ID;

            Sunstone.popUpFormPanel("create_security_group_form", "secgroups-tab", "create", true);

            Sunstone.popUpFormPanel("create_security_group_form", "secgroups-tab", "update", true, function(context){
                fillSecurityGroupUpdateFormPanel(response.SECURITY_GROUP, context);
            });
        },
        error: Notifier.onError
    },
    
    "SecurityGroup.update" : {
        type: "single",
        call: OpenNebulaSecurityGroup.update,
        callback: function(request, response){
            $("a[href=back]", $("#secgroups-tab")).trigger("click");
            popFormDialog("create_security_group_form", $("#secgroups-tab"));

            notifyMessage(tr("Security Group updated correctly"));
        },
        error: function(request, response){
            popFormDialog("create_security_group_form", $("#secgroups-tab"));

            onError(request, response);
        }
    },
    */

    "SecurityGroup.update_template" : {
      type: "single",
      call: OpenNebulaSecurityGroup.update,
      callback: function(request,response){
         Sunstone.runAction('SecurityGroup.show',request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "SecurityGroup.chown" : {
      type: "multiple",
      call: OpenNebulaSecurityGroup.chown,
      callback:  function (req) {
        Sunstone.runAction("SecurityGroup.show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "SecurityGroup.chgrp" : {
      type: "multiple",
      call: OpenNebulaSecurityGroup.chgrp,
      callback:  function (req) {
        Sunstone.runAction("SecurityGroup.show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    "SecurityGroup.chmod" : {
      type: "single",
      call: OpenNebulaSecurityGroup.chmod,
      callback:  function (req) {
        Sunstone.runAction("SecurityGroup.show", req.request.data[0]);
      },
      elements: function() {
        return Sunstone.getDataTable(TAB_ID).elements();
      },
      error: Notifier.onError,
      notify: true
    },

    /*
    TODO
    "SecurityGroup.clone_dialog" : {
        type: "custom",
        call: popUpSecurityGroupCloneDialog
    },
    */

    "SecurityGroup.clone" : {
      type: "single",
      call: OpenNebulaSecurityGroup.clone,
      error: Notifier.onError,
      notify: true
    },

    "SecurityGroup.rename" : {
      type: "single",
      call: OpenNebulaSecurityGroup.rename,
      callback: function(request) {
          Sunstone.runAction('SecurityGroup.show',request.request.data[0][0]);
      },
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
})
