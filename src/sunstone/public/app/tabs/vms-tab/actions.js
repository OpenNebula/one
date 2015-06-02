define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var OpenNebulaVM = require('opennebula/vm');
  var CommonActions = require('utils/common-actions');

  var TAB_ID = require('./tabId');
  //var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  //var CLONE_DIALOG_ID = require('./dialogs/clone/dialogId');
  //var INSTANTIATE_DIALOG_ID = require('./dialogs/instantiate/dialogId');
  var XML_ROOT = "VM";
  var RESOURCE = "VM";

  var _commonActions = new CommonActions(OpenNebulaVM, RESOURCE, TAB_ID);

  var _actions = {
    "VM.list":    _commonActions.list(),
    "VM.show":    _commonActions.show(),
    "VM.refresh": _commonActions.refresh(),
    "VM.delete":  _commonActions.delete(),

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
    "VM.create_dialog" : {
      type: "custom",
      call: function(){
        //Sunstone.getDialog(CREATE_DIALOG_ID).show();
      }
    },
    "VM.deploy" : {
      type: "custom",
      call: function() {
       popUpDeployVMDialog();
     }
    },
 
    "VM.deploy_action" : {
      type: "single",
      call: OpenNebula.VM.deploy,
      callback: vmShow,
      error: onError,
      notify: true
    },
 
    "VM.silent_deploy_action" : {
      type: "single",
      call: OpenNebula.VM.deploy,
      error: onError
    },    
 
    "VM.migrate" : {
      type: "custom",
      call: function() {
       popUpMigrateVMDialog(false);
     }
    },
 
    "VM.migrate_action" : {
      type: "single",
      call: OpenNebula.VM.migrate,
      callback: vmShow,
      error: onError,
      notify: true
    },
 
    "VM.migrate_live" : {
      type: "custom",
      call: function() {
       popUpMigrateVMDialog(true);
     }
    },
 
    "VM.migrate_live_action" : {
      type: "single",
      call: OpenNebula.VM.livemigrate,
      callback: vmShow,
      error: onError,
      notify: true
    },
 
    "VM.hold" : {
      type: "multiple",
      call: OpenNebula.VM.hold,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
    },
 
    "VM.release" : {
      type: "multiple",
      call: OpenNebula.VM.release,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
    },
 
    "VM.suspend" : {
      type: "multiple",
      call: OpenNebula.VM.suspend,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
    },
 
    "VM.resume" : {
      type: "multiple",
      call: OpenNebula.VM.resume,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
    },
 
    "VM.stop" : {
      type: "multiple",
      call: OpenNebula.VM.stop,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
    },
 
    "VM.reboot_hard" : {
      type: "multiple",
      call: OpenNebula.VM.reset,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
    },
 
    "VM.delete_recreate" : {
      type: "multiple",
      call: OpenNebula.VM.resubmit,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
    },
 
    "VM.reboot" : {
      type: "multiple",
      call: OpenNebula.VM.reboot,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
    },
 
    "VM.poweroff" : {
      type: "multiple",
      call: OpenNebula.VM.poweroff,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
    },
 
    "VM.poweroff_hard" : {
      type: "multiple",
      call: OpenNebula.VM.poweroff_hard,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
    },
 
    "VM.undeploy" : {
      type: "multiple",
      call: OpenNebula.VM.undeploy,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
    },
 
    "VM.undeploy_hard" : {
      type: "multiple",
      call: OpenNebula.VM.undeploy_hard,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
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
 
    "VM.snapshot_create" : {
      type: "single",
      call: OpenNebula.VM.snapshot_create,
      callback: function(request) {
        Sunstone.runAction("VM.show", request.request.data[0]);
      },
      error:onError,
      notify: true
    },
    "VM.snapshot_revert" : {
      type: "single",
      call: OpenNebula.VM.snapshot_revert,
      callback: function(request) {
        Sunstone.runAction("VM.show", request.request.data[0]);
      },
      error:onError,
      notify: true
    },
    "VM.snapshot_delete" : {
      type: "single",
      call: OpenNebula.VM.snapshot_delete,
      callback: function(request) {
        Sunstone.runAction("VM.show", request.request.data[0]);
      },
      error:onError,
      notify: true
    },
 
    "VM.shutdown" : {
      type: "multiple",
      call: OpenNebula.VM.shutdown,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
    },
 
    "VM.shutdown_hard" : {
      type: "multiple",
      call: OpenNebula.VM.cancel,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
    },

 
    "VM.recover" : {
      type: "multiple",
      call: OpenNebula.VM.recover,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
    },
 
    "VM.resched" : {
      type: "multiple",
      call: OpenNebula.VM.resched,
      callback: vmShow,
      elements: vmElements,
      error: onError,
      notify: true
    },
 
    "VM.unresched" : {
      type: "multiple",
      call: OpenNebula.VM.unresched,
      callback: vmShow,
      elements: vmElements,
      error: onError,
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
 
    "VM.chown" : {
      type: "multiple",
      call: OpenNebula.VM.chown,
      callback: function(request) {
        Sunstone.runAction('VM.show', request.request.data[0]);
      },
      elements: vmElements,
      error: onError,
      notify: true
    },
    "VM.chgrp" : {
      type: "multiple",
      call: OpenNebula.VM.chgrp,
      callback: function(request) {
        Sunstone.runAction("VM.show", request.request.data[0]);
      },
      elements: vmElements,
      error: onError,
      notify: true
    },
 
    "VM.chmod" : {
      type: "single",
      call: OpenNebula.VM.chmod,
      error: onError,
      notify: true
    },
    "VM.attachdisk" : {
      type: "single",
      call: OpenNebula.VM.attachdisk,
      callback: function(request) {
        Sunstone.runAction("VM.show", request.request.data[0][0]);
      },
      error: onError,
      notify: true
    },
    "VM.detachdisk" : {
      type: "single",
      call: OpenNebula.VM.detachdisk,
      callback: function(request) {
        Sunstone.runAction("VM.show", request.request.data[0][0]);
      },
      error: onError,
      notify: true
    },
    "VM.attachnic" : {
      type: "single",
      call: OpenNebula.VM.attachnic,
      callback: function(request) {
        Sunstone.runAction("VM.show", request.request.data[0]);
      },
      error: onError,
      notify: true
    },
    "VM.resize" : {
      type: "single",
      call: OpenNebula.VM.resize,
      callback: function(request) {
        Sunstone.runAction("VM.show", request.request.data[0]);
      },
      error: onError,
      notify: true
    },
    "VM.detachnic" : {
      type: "single",
      call: OpenNebula.VM.detachnic,
      callback: function(request) {
        Sunstone.runAction("VM.show", request.request.data[0]);
      },
      error: onError,
      notify: true
    },
    "VM.help" : {
      type: "custom",
      call: function() {
        hideDialog();
        $('div#vms_tab div.legend_div').slideToggle();
      }
    },
 
    "VM.rename" : {
      type: "single",
      call: OpenNebula.VM.rename,
      callback: function(request) {
        notifyMessage(tr("VirtualMachine renamed correctly"));
        Sunstone.runAction('VM.show', request.request.data[0]);
      },
      error: onError,
      notify: true
    },
 
    "VM.update_template" : {  // Update template
      type: "single",
      call: OpenNebula.VM.update,
      callback: function(request, response) {
        notifyMessage(tr("VirtualMachine updated correctly"));
        Sunstone.runAction('VM.show', request.request.data[0]);
      },
      error: onError
    },
 
    "VM.update_actions" : {  // Update template
      type: "single",
      call: OpenNebula.VM.update,
      callback: function(request, response) {
        notifyMessage(tr("VirtualMachine updated correctly"));
        Sunstone.runAction("VM.show", request.request.data[0]);
      },
      error: onError
    }*/
  };

  return _actions;
});
