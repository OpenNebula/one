define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var OpenNebulaVM = require('opennebula/vm');
  var CommonActions = require('utils/common-actions');

  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var DEPLOY_DIALOG_ID = require('./dialogs/deploy/dialogId');
  var MIGRATE_DIALOG_ID = require('./dialogs/migrate/dialogId');
  
  var XML_ROOT = "VM";
  var RESOURCE = "VM";

  var _commonActions = new CommonActions(OpenNebulaVM, RESOURCE, TAB_ID);

  var _actions = {
    "VM.list":    _commonActions.list(),
    "VM.show":    _commonActions.show(),
    "VM.refresh": _commonActions.refresh(),
    "VM.delete":  _commonActions.delete(),
    "VM.chown": _commonActions.multipleAction('chown'),
    "VM.chgrp": _commonActions.multipleAction('chgrp'),

    "VM.hold":    _commonActions.multipleAction('hold'),
    "VM.release": _commonActions.multipleAction('release'),
    "VM.suspend": _commonActions.multipleAction('suspend'),
    "VM.resume": _commonActions.multipleAction('resume'),
    "VM.stop": _commonActions.multipleAction('stop'),
    "VM.reboot_hard": _commonActions.multipleAction('reset'),
    "VM.delete_recreate": _commonActions.multipleAction('resubmit'),
    "VM.reboot": _commonActions.multipleAction('reboot'),
    "VM.poweroff": _commonActions.multipleAction('poweroff'),
    "VM.poweroff_hard": _commonActions.multipleAction('poweroff_hard'),
    "VM.undeploy": _commonActions.multipleAction('undeploy'),
    "VM.undeploy_hard": _commonActions.multipleAction('undeploy_hard'),
    "VM.shutdown": _commonActions.multipleAction('shutdown'),
    "VM.shutdown_hard": _commonActions.multipleAction('shutdown_hard'),
    "VM.recover": _commonActions.multipleAction('recover'),
    "VM.resched": _commonActions.multipleAction('resched'),
    "VM.unresched": _commonActions.multipleAction('unresched'),

    "VM.chmod": _commonActions.singleAction('chmod'),
    "VM.rename": _commonActions.singleAction('rename'),
    "VM.update_template": _commonActions.singleAction('update'),
    "VM.update_actions": _commonActions.singleAction('update'),
    "VM.deploy_action": _commonActions.singleAction('deploy'),
    "VM.migrate_action": _commonActions.singleAction('migrate'),
    "VM.migrate_live_action": _commonActions.singleAction('livemigrate'),
    "VM.attachdisk": _commonActions.singleAction('attachdisk'),
    "VM.detachdisk": _commonActions.singleAction('detachdisk'),
    "VM.attachnic": _commonActions.singleAction('attachnic'),
    "VM.detachnic": _commonActions.singleAction('detachnic'),
    "VM.resize": _commonActions.singleAction('resize'),
    "VM.snapshot_create": _commonActions.singleAction('snapshot_create'),
    "VM.snapshot_revert": _commonActions.singleAction('snapshot_revert'),
    "VM.snapshot_delete": _commonActions.singleAction('snapshot_delete'),
    
    "VM.create_dialog" : {
      type: "custom",
      call: function(){
        Sunstone.showFormPanel(TAB_ID, CREATE_DIALOG_ID, "create");
      }
    },
    "VM.deploy" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(DEPLOY_DIALOG_ID).show();
      }
    },
    "VM.migrate" : {
      type: "custom",
      call: function() {
       var dialog = Sunstone.getDialog(MIGRATE_DIALOG_ID);
       dialog.setLive(false);
       dialog.show();
     }
    },
    "VM.migrate_live" : {
      type: "custom",
      call: function() {
       var dialog = Sunstone.getDialog(MIGRATE_DIALOG_ID);
       dialog.setLive(true);
       dialog.show();
     }
    },
    /*"VM.create" : {
      type: "custom",
      call: function(id, name) {
        Sunstone.runAction("Template.instantiate", [id], name);
        Sunstone.runAction("VM.list");
      },
      callback: function(request, response) {
        //Sunstone.resetFormPanel(TAB_ID, CREATE_DIALOG_ID);
        //Sunstone.hideFormPanel(TAB_ID);
        Sunstone.getDataTable(TAB_ID).addElement(request, response);
      },
      error: onError
    },
    "VM.deploy" : {
      type: "custom",
      call: function() {
       popUpDeployVMDialog();
     }
    },
 
 
    "VM.silent_deploy_action" : {
      type: "single",
      call: OpenNebula.VM.deploy,
      error: onError
    },    
 
 
 
    "VM.saveas" : {
      type: "single",
      call: OpenNebula.VM.saveas,
      callback: function(request) {
        Sunstone.runAction("VM.show", request.request.data[0]);
        OpenNebula.Helper.clear_cache("IMAGE");
      },
      error:onError,
      notify: true
    },
 
    "VM.disk_snapshot_cancel" : {
      type: "single",
      call: OpenNebula.VM.disk_snapshot_cancel,
      callback: function(request) {
        Sunstone.runAction("VM.show", request.request.data[0]);
        OpenNebula.Helper.clear_cache("IMAGE");
      },
      error:onError,
      notify: true
    },
  
    "VM.log" : {
      type: "single",
      call: OpenNebula.VM.log,
      callback: function(req, res) {
        //after calling VM.log we process the answer
        //update the tab and pop it up again
        res = res['vm_log'];
        var log_lines = res.split("\n");
        var colored_log = '';
        for (var i = 0; i < log_lines.length; i++) {
          var line = log_lines[i];
          if (line.match(/\[E\]/)) {
            line = '<span class="vm_log_error">' + line + '</span>';
          }
          colored_log += line + "<br>";
        }
 
        $('#vm_log_tab').html('<div class="row"><div class="large-11 small-centered columns log-tab">' + colored_log + '</div></div>')
      },
      error: function(request, error_json) {
        $("#vm_log pre").html('');
        onError(request, error_json);
      }
    },
 
    "VM.startvnc" : {
      type: "custom",
      call: function() {
       popUpVnc();
     }
    },
 
    "VM.startspice" : {
      type: "custom",
      call: function() {
       popUpSPICE();
     }
    },
 
    "VM.startvnc_action" : {
      type: "single",
      call: OpenNebula.VM.startvnc,
      callback: vncCallback,
      error: function(req, resp) {
        onError(req, resp);
        vnc_lock = false;
      },
      notify: true
    },
 
    "VM.startspice_action" : {
      type: "single",
      call: OpenNebula.VM.startvnc,
      callback: spiceCallback,
      error: function(req, resp) {
        onError(req, resp);
        spice_lock = false;
      },
      notify: true
    },
 
    "VM.monitor" : {
      type: "monitor",
      call : OpenNebula.VM.monitor,
      callback: function(req, response) {
        var vm_graphs = [
             {
               monitor_resources : "CPU",
               labels : "Real CPU",
               humanize_figures : false,
               div_graph : $(".vm_cpu_graph")
             },
             {
               monitor_resources : "MEMORY",
               labels : "Real MEM",
               humanize_figures : true,
               div_graph : $(".vm_memory_graph")
             },
             {labels : "Network reception",
               monitor_resources : "NET_RX",
               humanize_figures : true,
               convert_from_bytes : true,
               div_graph : $("#vm_net_rx_graph")
             },
             {labels : "Network transmission",
               monitor_resources : "NET_TX",
               humanize_figures : true,
               convert_from_bytes : true,
               div_graph : $("#vm_net_tx_graph")
             },
             {labels : "Network reception speed",
               monitor_resources : "NET_RX",
               humanize_figures : true,
               convert_from_bytes : true,
               y_sufix : "B/s",
               derivative : true,
               div_graph : $("#vm_net_rx_speed_graph")
             },
             {labels : "Network transmission speed",
               monitor_resources : "NET_TX",
               humanize_figures : true,
               convert_from_bytes : true,
               y_sufix : "B/s",
               derivative : true,
               div_graph : $("#vm_net_tx_speed_graph")
             }
         ];
 
        // The network speed graphs require the derivative of the data,
        // and this process is done in place. They must be the last
        // graphs to be processed
 
        for (var i = 0; i < vm_graphs.length; i++) {
          plot_graph(
              response,
              vm_graphs[i]
          );
        }
      },
      error: vmMonitorError
    },
 */
  };

  return _actions;
});
