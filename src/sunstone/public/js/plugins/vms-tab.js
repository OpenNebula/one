/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

/*Virtual Machines tab plugin*/
var INCLUDE_URI = "vendor/noVNC/";
var VM_HISTORY_LENGTH = 40;

function loadVNC(){
    var script = '<script src="vendor/noVNC/vnc.js"></script>';
    document.write(script);
}
loadVNC();

var VNCstates=["RUNNING","SHUTDOWN","SHUTDOWN_POWEROFF","UNKNOWN","HOTPLUG","CANCEL","MIGRATE", "HOTPLUG_SNAPSHOT", "HOTPLUG_NIC", "HOTPLUG_SAVEAS", "HOTPLUG_SAVEAS_POWEROFF", "HOTPLUG_SAVEAS_SUSPENDED", "SHUTDOWN_UNDEPLOY"];

//Permanent storage for last value of aggregated network usage
//Used to calculate bandwidth
var netUsage = {
    time : new Date().getTime(),
    up : 0,
    down : 0
}

var vms_tab_content = '\
<form class="custom" id="virtualMachine_list" action="">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
        <i class="icon-cloud"></i> '+tr("Virtual Machines")+'\
      </span>\
      <span class="user-login right">\
      </span>\
      <span class="header-info">\
        <span id="total_vms"/> <small>'+tr("TOTAL")+'</small>&emsp;\
        <span id="active_vms"/> <small>'+tr("ACTIVE")+'</small>&emsp;\
        <span id="off_vms"/> <small>'+tr("OFF")+'</small>&emsp;\
        <span id="pending_vms"/> <small>'+tr("PENDING")+'</small>&emsp;\
        <span id="failed_vms"/> <small>'+tr("FAILED")+'</small>\
      </span>\
    </h4>\
  </div>\
</div>\
<div class="row">\
  <div class="ten columns">\
    <div class="action_blocks">\
    </div>\
  </div>\
  <div class="two columns">\
    <input id="vms_search" type="text" placeholder="'+tr("Search")+'" />\
  </div>\
</div>\
</div>\
  <div class="row">\
    <div class="twelve columns">\
<table id="datatable_vmachines" class="datatable twelve">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Owner")+'</th>\
      <th>'+tr("Group")+'</th>\
      <th>'+tr("Name")+'</th>\
      <th>'+tr("Status")+'</th>\
      <th>'+tr("Used CPU")+'</th>\
      <th>'+tr("Used Memory")+'</th>\
      <th>'+tr("Host")+'</th>\
      <th>'+tr("IPs")+'</th>\
      <th>'+tr("Start Time")+'</th>\
      <th>'+tr("VNC")+'</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyvmachines">\
  </tbody>\
</table>\
</form>';

//var create_vm_tmpl ='\
//        <div class="panel">\
//          <h3>\
//            <small id="create_vnet_header">'+tr("Create Virtual Machine")+'</small>\
//          </h3>\
//        </div>\
//        <form id="create_vm_form" action="">\
//          <div class="row centered">\
//              <div class="four columns">\
//                  <label class="inline right" for="vm_name">'+tr("VM Name")+':</label>\
//              </div>\
//              <div class="seven columns">\
//                  <input type="text" name="vm_name" id="vm_name" />\
//              </div>\
//              <div class="one columns">\
//                  <div class="tip">'+tr("Defaults to template name when emtpy")+'.</div>\
//              </div>\
//          </div>\
//          <div class="row centered">\
//              <div class="four columns">\
//                  <label class="inline right" for="template_id">'+tr("Select template")+':</label>\
//              </div>\
//              <div class="seven columns">\
//                 <select id="template_id">\
//                 </select>\
//              </div>\
//              <div class="one columns">\
//                  <div class=""></div>\
//              </div>\
//          </div>\
//          <div class="row centered">\
//              <div class="four columns">\
//                  <label class="inline right" for="vm_n_times">'+tr("Deploy # VMs")+':</label>\
//              </div>\
//              <div class="seven columns">\
//                  <input type="text" name="vm_n_times" id="vm_n_times" value="1">\
//              </div>\
//              <div class="one columns">\
//                  <div class="tip">'+tr("You can use the wildcard &#37;i. When creating several VMs, &#37;i will be replaced with a different number starting from 0 in each of them")+'.</div>\
//              </div>\
//          </div>\
//          <hr>\
//        <div class="form_buttons">\
//           <button class="button radius right success" id="create_vm_proceed" value="VM.create">'+tr("Create")+'</button>\
//           <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
//        </div>\
//<a class="close-reveal-modal">&#215;</a>\
//</form>';

var create_vm_tmpl ='\
<div class="panel">\
  <h3>\
    <small id="create_vnet_header">'+tr("Create Virtual Machine")+'</small>\
  </h3>\
</div>\
<div class="reveal-body">\
  <form id="create_vm_form" action="">\
    <div class="row">\
      <fieldset>\
        <legend>'+tr("Step 1: Specify a name and the number of instances")+'</legend>\
        <div class="seven columns">\
          <div class="four columns">\
              <label class="inline right" for="vm_name">'+tr("VM Name")+':</label>\
          </div>\
          <div class="seven columns">\
              <input type="text" name="vm_name" id="vm_name" />\
          </div>\
          <div class="one columns">\
              <div class="tip">'+tr("Defaults to template name when emtpy. You can use the wildcard &#37;i. When creating several VMs, &#37;i will be replaced with a different number starting from 0 in each of them")+'.</div>\
          </div>\
        </div>\
        <div class="five columns">\
          <div class="six columns">\
              <label class="inline right" for="vm_n_times">'+tr("# VMs")+':</label>\
          </div>\
          <div class="five columns">\
              <input type="text" name="vm_n_times" id="vm_n_times" value="1">\
          </div>\
          <div class="one columns">\
              <div class="tip">'+tr("Number of Virtual Machines that will be created using this template")+'.</div>\
          </div>\
        </div>\
      </fieldset>\
    </div>\
    <br>\
    <br>\
    <br>\
    <div class="row">\
      <fieldset>\
        <legend>'+tr("Step 2: Select a template")+'</legend>\
        <div class="row collapse">\
          <div class="seven columns">\
             <button id="refresh_template_templates_table_button_class" type="button" class="button small radius secondary"><i class="icon-refresh" /></button>\
          </div>\
          <div class="five columns">\
            <input id="template_templates_table_search" type="text" placeholder="'+tr("Search")+'"/>\
          </div>\
        </div>\
        <table id="template_templates_table" class="datatable twelve">\
          <thead>\
            <tr>\
              <th></th>\
              <th>'+tr("ID")+'</th>\
              <th>'+tr("Owner")+'</th>\
              <th>'+tr("Group")+'</th>\
              <th>'+tr("Name")+'</th>\
              <th>'+tr("Registration time")+'</th>\
            </tr>\
          </thead>\
          <tbody id="tbodytemplates">\
          </tbody>\
        </table>\
        <div class="row hidden">\
          <div class="four columns">\
            <label class="right inline" for="TEMPLATE_ID">'+tr("TEMPLATE_ID")+':</label>\
          </div>\
          <div class="six columns">\
            <input type="text" id="TEMPLATE_ID" name="TEMPLATE_ID"/>\
          </div>\
          <div class="two columns">\
            <div class="tip">\
            </div>\
          </div>\
        </div>\
        <br>\
        <div id="selected_template" class="vm_param kvm_opt xen_opt vmware_opt">\
          <span id="select_template" class="radius secondary label">'+tr("Please select a template from the list")+'</span>\
          <span id="template_selected" class="radius secondary label hidden">'+tr("You selected the following template:")+'</span>\
          <span class="radius label" type="text" id="TEMPLATE_NAME" name="template"></span>\
        </div>\
      </fieldset>\
    </div>\
    <br>\
    <br>\
    <br>\
    <div id="select_image_step" class="row">\
      <fieldset>\
        <legend>'+tr("Step 3: Select an operating system")+'</legend>\
        <div class="row collapse">\
          <div class="seven columns">\
             <button id="refresh_template_images_table_button_class" type="button" class="button small radius secondary"><i class="icon-refresh" /></button>\
          </div>\
          <div class="five columns">\
            <input id="template_images_table_search" type="text" placeholder="'+tr("Search")+'"/>\
          </div>\
        </div>\
        <table id="template_images_table" class="datatable twelve">\
          <thead>\
            <tr>\
              <th></th>\
              <th>'+tr("ID")+'</th>\
              <th>'+tr("Owner")+'</th>\
              <th>'+tr("Group")+'</th>\
              <th>'+tr("Name")+'</th>\
              <th>'+tr("Datastore")+'</th>\
              <th>'+tr("Size")+'</th>\
              <th>'+tr("Type")+'</th>\
              <th>'+tr("Registration time")+'</th>\
              <th>'+tr("Persistent")+'</th>\
              <th>'+tr("Status")+'</th>\
              <th>'+tr("#VMS")+'</th>\
              <th>'+tr("Target")+'</th>\
            </tr>\
          </thead>\
          <tbody id="tbodyimages">\
          </tbody>\
        </table>\
        <div class="row hidden">\
          <div class="four columns">\
            <label class="right inline" for="IMAGE_ID">'+tr("IMAGE_ID")+':</label>\
          </div>\
          <div class="six columns">\
            <input type="text" id="IMAGE_ID" name="IMAGE_ID"/>\
          </div>\
          <div class="two columns">\
            <div class="tip">\
            </div>\
          </div>\
        </div>\
        <br>\
        <div id="selected_image" class="vm_param kvm_opt xen_opt vmware_opt">\
          <span id="select_image" class="radius secondary label">'+tr("Please select an image from the list")+'</span>\
          <span id="image_selected" class="radius secondary label hidden">'+tr("You selected the following image:")+'</span>\
          <span class="radius label" type="text" id="IMAGE_NAME" name="image"></span>\
        </div>\
      </fieldset>\
    </div>\
    <div class="form_buttons reveal-footer">\
      <hr>\
      <div class="form_buttons">\
         <button class="button radius right success" id="instantiate_vm_tenplate_proceed" value="Template.instantiate_vms">'+tr("Create")+'</button>\
         <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
      </div>\
    </div>\
    <a class="close-reveal-modal">&#215;</a>\
  </form>\
</div>';

var vmachine_list_json = {};
var dataTable_vMachines;
var $create_vm_dialog;
var $vnc_dialog;
var rfb;

var vm_actions = {
    "VM.create" : {
        type: "custom",
        call: function(id,name) {
            Sunstone.runAction("Template.instantiate",[id],name);
            Sunstone.runAction("VM.list");
        },
        callback: addVMachineElement,
        error: onError
    },

    "VM.create_dialog" : {
        type: "custom",
        call: function(){
          popUpCreateVMDialog(false);
        }
    },

    "VM.easy_provision" : {
        type: "custom",
        call: function(){
          popUpCreateVMDialog(true);
        }
    },

    "VM.list" : {
        type: "list",
        call: OpenNebula.VM.list,
        callback: updateVMachinesView,
        error: onError
    },

    "VM.show" : {
        type: "single",
        call: OpenNebula.VM.show,
        callback: updateVMachineElement,
        error: onError
    },

    "VM.showinfo" : {
        type: "single",
        call: OpenNebula.VM.show,
        callback: updateVMInfo,
        error: onError
    },
    "VM.refresh" : {
        type: "custom",
        call : function (){
            waitingNodes(dataTable_vMachines);
            Sunstone.runAction("VM.list");
        }
    },

    "VM.autorefresh" : {
        type: "custom",
        call : function() {
            OpenNebula.VM.list({timeout: true, success: updateVMachinesView,error: onError});
        }
    },

    "VM.deploy" : {
        type: "multiple",
        call: OpenNebula.VM.deploy,
        callback: vmShow,
        elements: vmElements,
        error: onError,
        notify: true
    },

    "VM.migrate" : {
        type: "multiple",
        call: OpenNebula.VM.migrate,
        callback: vmShow,
        elements: function() { return getSelectedNodes(dataTable_vMachines); },
        error: onError,
        notify: true
    },

    "VM.migrate_live" : {
        type: "multiple",
        call: OpenNebula.VM.livemigrate,
        callback: vmShow,
        elements: vmElements,
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

    "VM.boot" : {
        type: "multiple",
        call: OpenNebula.VM.restart,
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
            Sunstone.runAction("VM.showinfo", request.request.data[0]);
        },
        error:onError,
        notify: true
    },

    "VM.snapshot_create" : {
        type: "single",
        call: OpenNebula.VM.snapshot_create,
        callback: function(request) {
            Sunstone.runAction("VM.showinfo", request.request.data[0]);
        },
        error:onError,
        notify: true
    },
    "VM.snapshot_revert" : {
        type: "single",
        call: OpenNebula.VM.snapshot_revert,
        callback: function(request) {
            Sunstone.runAction("VM.showinfo", request.request.data[0]);
        },
        error:onError,
        notify: true
    },
    "VM.snapshot_delete" : {
        type: "single",
        call: OpenNebula.VM.snapshot_delete,
        callback: function(request) {
            Sunstone.runAction("VM.showinfo", request.request.data[0]);
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

    "VM.delete" : {
        type: "multiple",
        call: OpenNebula.VM.del,
        callback: deleteVMachineElement,
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
        callback: function(req,res) {
            //after calling VM.log we process the answer
            //update the tab and pop it up again
            res = res['vm_log'];
            var log_lines = res.split("\n");
            var colored_log = '';
            for (var i = 0; i < log_lines.length;i++){
                var line = log_lines[i];
                if (line.match(/\[E\]/)){
                    line = '<span class="vm_log_error">'+line+'</span>';
                }
                colored_log += line + "<br>";
            }

            $('#vm_log_tabTab').html('<div class="twelve columns"><div class="log-tab">'+colored_log+'</div></div>')
        },
        error: function(request,error_json){
            $("#vm_log pre").html('');
            onError(request,error_json);
        }
    },

    "VM.startvnc" : {
        type: "single",
        call: OpenNebula.VM.startvnc,
        callback: vncCallback,
        error: onError,
        notify: true
    },

    "VM.monitor" : {
        type: "monitor",
        call : OpenNebula.VM.monitor,
        callback: function(req,response) {
            var vm_graphs = [
                {
                    monitor_resources : "CPU",
                    labels : "Real CPU",
                    humanize_figures : false,
                    div_graph : $("#vm_cpu_graph")
                },
                {
                    monitor_resources : "MEMORY",
                    labels : "Real MEM",
                    humanize_figures : true,
                    div_graph : $("#vm_memory_graph")
                },
                { labels : "Network reception",
                  monitor_resources : "NET_RX",
                  humanize_figures : true,
                  convert_from_bytes : true,
                  div_graph : $("#vm_net_rx_graph")
                },
                { labels : "Network transmission",
                  monitor_resources : "NET_TX",
                  humanize_figures : true,
                  convert_from_bytes : true,
                  div_graph : $("#vm_net_tx_graph")
                },
                { labels : "Network reception speed",
                  monitor_resources : "NET_RX",
                  humanize_figures : true,
                  convert_from_bytes : true,
                  y_sufix : "B/s",
                  derivative : true,
                  div_graph : $("#vm_net_rx_speed_graph")
                },
                { labels : "Network transmission speed",
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

            for(var i=0; i<vm_graphs.length; i++) {
                plot_graph(
                    response,
                    vm_graphs[i]
                );
            }
        },
        error: vmMonitorError
    },
/*
    "VM.pool_monitor" : {
        type: "monitor_global",
        call : OpenNebula.VM.pool_monitor,
        callback: function(req,response) {
            var vm_dashboard_graphs = [
                { labels : "Network transmission",
                  monitor_resources : "NET_TX",
                  humanize_figures : true,
                  convert_from_bytes : true,
                  y_sufix : "B/s",
                  derivative : true,
                  div_graph : $("#dash_vm_net_tx_graph", $dashboard)
                },
                { labels : "Network reception",
                  monitor_resources : "NET_RX",
                  humanize_figures : true,
                  convert_from_bytes : true,
                  y_sufix : "B/s",
                  derivative : true,
                  div_graph : $("#dash_vm_net_rx_graph", $dashboard)
                }
            ];

            for(var i=0; i<vm_dashboard_graphs.length; i++) {
                plot_totals(
                    response,
                    vm_dashboard_graphs[i]
                );
            }

            // TODO: refresh individual info panel graphs with this new data?
        },

        // TODO: ignore error, or set message similar to hostMonitorError?
        error: onError
    },
*/
    "VM.chown" : {
        type: "multiple",
        call: OpenNebula.VM.chown,
        callback: function(request) {
            Sunstone.runAction('VM.showinfo',request.request.data[0]);
            Sunstone.runAction("VM.show",request.request.data[0]);
        },
        elements: vmElements,
        error: onError,
        notify: true
    },
    "VM.chgrp" : {
        type: "multiple",
        call: OpenNebula.VM.chgrp,
        callback: function(request) {
            Sunstone.runAction('VM.showinfo',request.request.data[0]);
            Sunstone.runAction("VM.show",request.request.data[0]);
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
            Sunstone.runAction("VM.showinfo", request.request.data[0]);
        },
        error: onError,
        notify: true
    },
    "VM.detachdisk" : {
        type: "single",
        call: OpenNebula.VM.detachdisk,
        callback: function(request) {
            Sunstone.runAction("VM.showinfo", request.request.data[0]);
        },
        error: onError,
        notify: true
    },
    "VM.attachnic" : {
        type: "single",
        call: OpenNebula.VM.attachnic,
        callback: function(request) {
            Sunstone.runAction("VM.showinfo", request.request.data[0]);
        },
        error: onError,
        notify: true
    },
    "VM.resize" : {
        type: "single",
        call: OpenNebula.VM.resize,
        callback: function(request) {
            Sunstone.runAction("VM.showinfo", request.request.data[0]);
        },
        error: onError,
        notify: true
    },
    "VM.detachnic" : {
        type: "single",
        call: OpenNebula.VM.detachnic,
        callback: function(request) {
            Sunstone.runAction("VM.showinfo", request.request.data[0]);
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
            notifyMessage("VirtualMachine renamed correctly");
            Sunstone.runAction('VM.showinfo',request.request.data[0]);
            Sunstone.runAction("VM.list");
        },
        error: onError,
        notify: true
    },

    "VM.update_template" : {  // Update template
        type: "single",
        call: OpenNebula.VM.update,
        callback: function(request,response){
           notifyMessage(tr("VirtualMachine updated correctly"));
           Sunstone.runAction('VM.showinfo',request.request.data[0]);
           Sunstone.runAction("VM.list");
        },
        error: onError
    },

    "VM.update_actions" : {  // Update template
        type: "single",
        call: OpenNebula.VM.update,
        callback: function(request,response){
           notifyMessage(tr("VirtualMachine updated correctly"));
           Sunstone.runAction("VM.showinfo", request.request.data[0]);
        },
        error: onError
    },
};



var vm_buttons = {
    "VM.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },

    "VM.create_dialog" : {
        type: "action",
        layout: "create",
        alwaysActive: true
    },
    "VM.easy_provision" : {
        type: "action",
        layout: "create",
        text: tr("Launch"),
        alwaysActive: true
    },
    "VM.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: users_sel,
        layout: "user_select",
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },

    "VM.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: groups_sel,
        layout: "user_select",
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
    "VM.deploy" : {
        type: "confirm_with_select",
        text: tr("Deploy"),
        tip: tr("This will deploy the selected VMs on the chosen host"),
        layout: "vmsplanification_buttons",
        select: hosts_sel,
        condition: mustBeAdmin
    },
    "VM.migrate" : {
        type: "confirm_with_select",
        text: tr("Migrate"),
        tip: tr("This will migrate the selected VMs to the chosen host"),
        layout: "vmsplanification_buttons",
        select: hosts_sel,
        condition: mustBeAdmin

    },
    "VM.migrate_live" : {
        type: "confirm_with_select",
        text: tr("Migrate") + ' <span class="label secondary radius">live</span>',
        tip: tr("This will live-migrate the selected VMs to the chosen host"),
        layout: "vmsplanification_buttons",
        select: hosts_sel,
        condition: mustBeAdmin
    },
    "VM.hold" : {
        type: "action",
        text: tr("Hold"),
        tip: tr("This will hold selected pending VMs from being deployed"),
        layout: "vmsplanification_buttons",
    },
    "VM.release" : {
        type: "action",
        text: tr("Release"),
        layout: "vmsplanification_buttons",
        tip: tr("This will release held machines")
    },
    "VM.suspend" : {
        type: "action",
        text: tr("Suspend"),
        layout: "vmspause_buttons",
        tip: tr("This will suspend selected machines")
    },
    "VM.resume" : {
        type: "action",
        text: '<i class="icon-play"/>',
        layout: "vmsplay_buttons",
        tip: tr("This will resume selected VMs")
    },
    "VM.stop" : {
        type: "action",
        text: tr("Stop"),
        layout: "vmsstop_buttons",
        tip: tr("This will stop selected VMs")
    },
    "VM.boot" : {
        type: "action",
        text: tr("Boot"),
        layout: "vmsplanification_buttons",
        tip: tr("This will force the hypervisor boot action of VMs stuck in UNKNOWN or BOOT state")
    },
    "VM.reboot" : {
        type: "action",
        text: tr("Reboot"),
        layout: "vmsrepeat_buttons",
        tip: tr("This will send a reboot action to running VMs")
    },
    "VM.reboot_hard" : {
        type: "action",
        text: tr("Reboot") + ' <span class="label secondary radius">hard</span>',
        layout: "vmsrepeat_buttons",
        tip: tr("This will perform a hard reboot on selected VMs")
    },
    "VM.poweroff" : {
        type: "action",
        text: tr("Power Off"),
        layout: "vmspause_buttons",
        tip: tr("This will send a power off signal to running VMs. They can be resumed later.")
    },
    "VM.poweroff_hard" : {
        type: "action",
        text: tr("Power Off") + ' <span class="label secondary radius">hard</span>',
        layout: "vmspause_buttons",
        tip: tr("This will send a forced power off signal to running VMs. They can be resumed later.")
    },
    "VM.undeploy" : {
        type: "action",
        text: tr("Undeploy"),
        layout: "vmsstop_buttons",
        tip: tr("Shuts down the given VM. The VM is saved in the system Datastore.")
    },
    "VM.undeploy_hard" : {
        type: "action",
        text: tr("Undeploy") + ' <span class="label secondary radius">hard</span>',
        layout: "vmsstop_buttons",
        tip: tr("Shuts down the given VM. The VM is saved in the system Datastore.")
    },
    "VM.shutdown" : {
        type: "confirm",
        text: tr("Shutdown"),
        layout: "vmsdelete_buttons",
        tip: tr("This will initiate the shutdown process in the selected VMs")
    },
    "VM.shutdown_hard" : {
        type: "confirm",
        text: tr("Shutdown") + ' <span class="label secondary radius">hard</span>',
        layout: "vmsdelete_buttons",
        tip: tr("This will initiate the shutdown-hard (forced) process in the selected VMs")
    },

    "VM.delete" : {
        type: "confirm",
        text: tr("Delete"),
        layout: "vmsdelete_buttons",
        tip: tr("This will delete the selected VMs from the database")
    },
    "VM.delete_recreate" : {
        type: "confirm",
        text: tr("Delete") + ' <span class="label secondary radius">recreate</span>',
        layout: "vmsrepeat_buttons",
        tip: tr("This will delete and recreate VMs to PENDING state")
    },
    "VM.resched" : {
        type: "action",
        text: tr("Reschedule"),
        layout: "vmsplanification_buttons",
        tip: tr("This will reschedule selected VMs")
    },
    "VM.unresched" : {
        type: "action",
        text: tr("Un-Reschedule"),
        layout: "vmsplanification_buttons",
        tip: tr("This will cancel the rescheduling for the selected VMs")
    },
    "VM.recover" : {
        type: "confirm_with_select",
        text: tr("Recover"),
        layout: "vmsplanification_buttons",
        select: function(){ return '<option value="success">' + tr("success") + '</option>\
                 <option value="failure">' + tr("failure") + '</option>'},
        tip: tr("Recovers a stuck VM that is waiting for a driver operation. \
                The recovery may be done by failing or succeeding the pending operation. \
                YOU NEED TO MANUALLY CHECK THE VM STATUS ON THE HOST, to decide if the operation \
                was successful or not.")
    }

    //"VM.help" : {
    //    type: "action",
    //    text: '?',
    //    alwaysActive: true
    //}
}

var vm_info_panel = {

};

var vms_tab = {
    title: tr("Virtual Machines"),
    content: vms_tab_content,
    buttons: vm_buttons,
    tabClass: 'subTab',
    parentTab: 'vresources-tab'
};

Sunstone.addActions(vm_actions);
Sunstone.addMainTab('vms-tab',vms_tab);
Sunstone.addInfoPanel('vm_info_panel',vm_info_panel);


function vmElements() {
    return getSelectedNodes(dataTable_vMachines);
};

function vmShow(req) {
    Sunstone.runAction("VM.show",req.request.data[0]);
};

// Returns a human readable running time for a VM
function str_start_time(vm){
    return pretty_time(vm.STIME);
};


// Return the IP or several IPs of a VM
function ip_str(vm){
    var nic = vm.TEMPLATE.NIC;
    var ip = '--';
    if ($.isArray(nic)) {
        ip = '';
        $.each(nic, function(index,value){
            ip += value.IP+'<br />';
        });
    } else if (nic && nic.IP) {
        ip = nic.IP;
    };
    return ip;
};

// Returns an array formed by the information contained in the vm_json
// and ready to be introduced in a dataTable
function vMachineElementArray(vm_json){
    var vm = vm_json.VM;
    var state = OpenNebula.Helper.resource_state("vm",vm.STATE);
    var hostname = "--";

    if (state == tr("ACTIVE") || state == tr("SUSPENDED")){
        if (vm.HISTORY_RECORDS.HISTORY.constructor == Array){
            hostname = vm.HISTORY_RECORDS.HISTORY[vm.HISTORY_RECORDS.HISTORY.length-1].HOSTNAME;
        } else {
            hostname = vm.HISTORY_RECORDS.HISTORY.HOSTNAME;
        };
    };


    switch (state) {
      case tr("INIT"):
      case tr("PENDING"):
      case tr("HOLD"):
        pending_vms++;
        break;
      case tr("FAILED"):
        failed_vms++;
        break;
      case tr("ACTIVE"):
        active_vms++;
        break;
      case tr("STOPPED"):
      case tr("SUSPENDED"):
      case tr("POWEROFF"):
        off_vms++;
        break;
      default:
        break;
    }

    if (state == tr("ACTIVE")) {
        state = OpenNebula.Helper.resource_state("vm_lcm",vm.LCM_STATE);
    };


    return [
        '<input class="check_item" type="checkbox" id="vm_'+vm.ID+'" name="selected_items" value="'+vm.ID+'"/>',
        vm.ID,
        vm.UNAME,
        vm.GNAME,
        vm.NAME,
        state,
        vm.CPU,
        humanize_size(vm.MEMORY),
        hostname,
        ip_str(vm),
        str_start_time(vm),
        vncIcon(vm)
    ];
};


// Callback to refresh a single element from the list
function updateVMachineElement(request, vm_json){
    var id = vm_json.VM.ID;
    var element = vMachineElementArray(vm_json);
    updateSingleElement(element,dataTable_vMachines,'#vm_'+id)
}

// Callback to delete a single element from the list
function deleteVMachineElement(request){
    deleteElement(dataTable_vMachines,'#vm_'+request.request.data);
}

// Callback to add an element to the list
function addVMachineElement(request,vm_json){
    var id = vm_json.VM.ID;
    var element = vMachineElementArray(vm_json);
    addElement(element,dataTable_vMachines);
}


// Callback to refresh the list of Virtual Machines
function updateVMachinesView(request, vmachine_list){
    var vmachine_list_array = [];

    active_vms = 0;
    pending_vms = 0;
    failed_vms = 0;
    off_vms = 0;


    var do_vm_monitoring_graphs = true;

    if (!do_vm_monitoring_graphs){

        $.each(vmachine_list,function(){
            vmachine_list_array.push( vMachineElementArray(this));
        });

    } else {
        if (typeof (vm_monitoring_data) == 'undefined'){
            vm_monitoring_data = {};
        }

        var metrics = ["NET_TX", "NET_RX"];

        $.each(vmachine_list,function(){
            vmachine_list_array.push( vMachineElementArray(this));

            var empty = false;
            var time = this.VM.LAST_POLL;

            if (time != "0"){

                if (vm_monitoring_data[this.VM.ID] === undefined){
                    empty = true;

                    vm_monitoring_data[this.VM.ID] = {};

                    for (var i=0; i<metrics.length; i++) {
                        vm_monitoring_data[this.VM.ID][metrics[i]] = [];
                    }
                }

                for (var i=0; i<metrics.length; i++) {
                    var last_time = "0";

                    var mon_data = vm_monitoring_data[this.VM.ID][metrics[i]];

                    if (!empty){
                        last_time = mon_data[ mon_data.length-1 ][0];
                    }

                    if (last_time != time){
                        mon_data.push( [time, this.VM[metrics[i]]] );
                    }
                }
            }
        });
    }

    updateView(vmachine_list_array,dataTable_vMachines);

    $("#total_vms", $dashboard).text(vmachine_list.length);
    $("#active_vms", $dashboard).text(active_vms);
    $("#pending_vms", $dashboard).text(pending_vms);
    $("#failed_vms", $dashboard).text(failed_vms);
    $("#off_vms", $dashboard).text(off_vms);

    var form = $("#virtualMachine_list");

    $("#total_vms", form).text(vmachine_list.length);
    $("#active_vms", form).text(active_vms);
    $("#pending_vms", form).text(pending_vms);
    $("#failed_vms", form).text(failed_vms);
    $("#off_vms", form).text(off_vms);


    if (do_vm_monitoring_graphs){
        var vm_dashboard_graphs = [
            { labels : "Network transmission",
              monitor_resources : "NET_TX",
              humanize_figures : true,
              convert_from_bytes : true,
              y_sufix : "B/s",
              derivative : true,
              div_graph : $("#dash_vm_net_tx_graph", $dashboard)
            },
            { labels : "Network reception",
              monitor_resources : "NET_RX",
              humanize_figures : true,
              convert_from_bytes : true,
              y_sufix : "B/s",
              derivative : true,
              div_graph : $("#dash_vm_net_rx_graph", $dashboard)
            }
        ];

        var t0 = new Date().getTime();

        var vm_monitoring_data_copy = jQuery.extend(true, {}, vm_monitoring_data);

        // TODO: plot only when the dashboard is visible
        for(var i=0; i<vm_dashboard_graphs.length; i++) {
            plot_totals(
                vm_monitoring_data_copy,
                vm_dashboard_graphs[i]
            );
        }

        var t1 = new Date().getTime();

        // If plot takes more than 3 seconds, clear the monitoring data
        if (t1 - t0 > 3000) {
            vm_monitoring_data = {};
        }
    }
};


// Returns the html code for a nice formatted VM history
// Some calculations are performed, inspired from what is done
// in the CLI
function generatePlacementTable(vm){
   var requirements_str = "-";
   var rank_str         = "-";

   if (vm.USER_TEMPLATE.SCHED_REQUIREMENTS)
   {
     requirements_str = vm.USER_TEMPLATE.SCHED_REQUIREMENTS;
   }

  if (vm.USER_TEMPLATE.SCHED_RANK)
   {
     rank_str         = vm.USER_TEMPLATE.SCHED_RANK;
   }

    var html = '<div class=""><div class="six columns">\
          <table id="vm_placement_table" class="extended_table twelve">\
                   <thead>\
                     <tr>\
                         <th colspan="2" align="center">'+tr("Placement")+'</th>\
                     </tr>\
                   </thead>\
                   <tbody>\
                      <tr>\
                       <td>REQUIREMENTS</td>\
                       <td>'+requirements_str+'</td>\
                     </tr>\
                      <tr>\
                       <td>RANK</td>\
                       <td>'+rank_str+'</td>\
                     </tr>\
                   </tbody>\
          </table>\
          </div></div>\
          <div class="twelve columns">\
          <table id="vm_history_table" class="extended_table twelve">\
                   <thead>\
                     <tr>\
                         <th>'+tr("#")+'</th>\
                         <th>'+tr("Host")+'</th>\
                         <th>'+tr("Action")+'</th>\
                         <th>'+tr("Reason")+'</th>\
                         <th>'+tr("Chg time")+'</th>\
                         <th>'+tr("Total time")+'</th>\
                         <th colspan="2">'+tr("Prolog time")+'</th>\
                     </tr>\
                   </thead>\
                   <tbody>';

    var history = [];
    if (vm.HISTORY_RECORDS.HISTORY){
        if ($.isArray(vm.HISTORY_RECORDS.HISTORY))
            history = vm.HISTORY_RECORDS.HISTORY;
        else if (vm.HISTORY_RECORDS.HISTORY.SEQ)
            history = [vm.HISTORY_RECORDS.HISTORY];
    };

    var now = Math.round(new Date().getTime() / 1000);

    for (var i=0; i < history.length; i++){
        // :TIME time calculations copied from onevm_helper.rb
        var stime = parseInt(history[i].STIME, 10);

        var etime = parseInt(history[i].ETIME, 10)
        etime = etime == 0 ? now : etime;

        var dtime = etime - stime;
        // end :TIME

        //:PTIME
        var stime2 = parseInt(history[i].PSTIME, 10);
        var etime2;
        var ptime2 = parseInt(history[i].PETIME, 10);
        if (stime2 == 0)
            etime2 = 0;
        else
            etime2 = ptime2 == 0 ? now : ptime2;
        var dtime2 = etime2 - stime2;

        //end :PTIME


        html += '     <tr>\
                       <td style="width:5%">'+history[i].SEQ+'</td>\
                       <td style="width:20%">'+history[i].HOSTNAME+'</td>\
                       <td style="width:16%">'+OpenNebula.Helper.resource_state("VM_MIGRATE_ACTION",parseInt(history[i].ACTION, 10))+'</td>\
                       <td style="width:10%">'+OpenNebula.Helper.resource_state("VM_MIGRATE_REASON",parseInt(history[i].REASON, 10))+'</td>\
                       <td style="width:16%">'+pretty_time(history[i].STIME)+'</td>\
                       <td style="width:16%">'+pretty_time_runtime(dtime)+'</td>\
                       <td style="width:16%">'+pretty_time_runtime(dtime2)+'</td>\
                       <td></td>\
                      </tr>'
    };
    html += '</tbody>\
                </table>\
          </div>\
        </div>';
    return html;

};


// Refreshes the information panel for a VM
function updateVMInfo(request,vm){
    var vm_info = vm.VM;
    var vm_state = OpenNebula.Helper.resource_state("vm",vm_info.STATE);
    var hostname = "--"
    if (vm_state == tr("ACTIVE") || vm_state == tr("SUSPENDED")) {
        if (vm_info.HISTORY_RECORDS.HISTORY.constructor == Array){
            hostname = vm_info.HISTORY_RECORDS.HISTORY[vm_info.HISTORY_RECORDS.HISTORY.length-1].HOSTNAME
        } else {
            hostname = vm_info.HISTORY_RECORDS.HISTORY.HOSTNAME;
        };
    };

    // Get rid of the unwanted (for show) SCHED_* keys
    var stripped_vm_template = {};
    var unshown_values       = {};

    for (key in vm_info.USER_TEMPLATE)
        if(!key.match(/^SCHED_*/))
            stripped_vm_template[key]=vm_info.USER_TEMPLATE[key];
        else
            unshown_values[key]=vm_info.USER_TEMPLATE[key];


    var info_tab = {
        title : tr("Information"),
        content:
        '<div class="">\
        <div class="six columns">\
        <table id="info_vm_table" class="twelve datatable extended_table">\
            <thead>\
              <tr><th colspan="3">'+tr("Virtual Machine")+' - '+vm_info.NAME+'</th></tr>\
            </thead>\
            <tbody>\
              <tr>\
                 <td class="key_td">'+tr("ID")+'</td>\
                 <td class="value_td">'+vm_info.ID+'</td>\
                 <td></td>\
              </tr>\
            <tr>\
              <td class="key_td">'+tr("Name")+'</td>\
              <td class="value_td_rename">'+vm_info.NAME+'</td>\
              <td><div id="div_edit_rename">\
                     <a id="div_edit_rename_link" class="edit_e" href="#"><i class="icon-edit right"/></a>\
                  </div>\
              </td>\
            </tr>\
              <tr>\
                 <td class="key_td">'+tr("State")+'</td>\
                 <td class="value_td">'+tr(vm_state)+'</td>\
                 <td></td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("LCM State")+'</td>\
                 <td class="value_td">'+tr(OpenNebula.Helper.resource_state("vm_lcm",vm_info.LCM_STATE))+'</td>\
                 <td></td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Host")+'</td>\
              <td class="value_td">'+ hostname +'</td>\
                 <td></td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Start time")+'</td>\
                 <td class="value_td">'+pretty_time(vm_info.STIME)+'</td>\
                 <td></td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Deploy ID")+'</td>\
                 <td class="value_td">'+(typeof(vm_info.DEPLOY_ID) == "object" ? "-" : vm_info.DEPLOY_ID)+'</td>\
                 <td></td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Reschedule")+'</td>\
                 <td class="value_td">'+(parseInt(vm_info.RESCHED) ? tr("yes") : tr("no"))+'</td>\
                 <td></td>\
              </tr>\
              </tbody>\
               </table>\
            </div>\
            <div class="six columns">' +
               insert_permissions_table('vms-tab',
                                        "VM",
                                        vm_info.ID,
                                        vm_info.UNAME,
                                        vm_info.GNAME,
                                        vm_info.UID,
                                        vm_info.GID) +
               insert_extended_template_table(stripped_vm_template,
                                              "VM",
                                              vm_info.ID,
                                              "Tags",
                                              unshown_values) +

            '</div>\
        </div>'
    };

    var hotplugging_tab = {
        title: tr("Storage"),
        content: printDisks(vm_info)
    };

    var network_tab = {
        title: tr("Network"),
        content: printNics(vm_info)
    };

    var capacity_tab = {
        title: tr("Capacity"),
        content: printCapacity(vm_info)
    };

    var snapshot_tab = {
        title: tr("Snapshots"),
        content: printSnapshots(vm_info)
    };

    var template_tab = {
        title: tr("Template"),
        content:
        '<div class="twelve columns">\
            <table id="vm_template_table" class="info_table transparent_table" style="width:80%">'+
                prettyPrintJSON(vm_info.TEMPLATE)+
            '</table>\
        </div>'
    };

    var log_tab = {
        title: tr("Log"),
        content: '<div>'+spinner+'</div>'
    };

    var actions_tab = {
        title: tr("Actions"),
        content: printActionsTable(vm_info)
    };


    var placement_tab = {
        title: tr("Placement"),
        content: generatePlacementTable(vm_info)
    };

    $("#div_edit_rename_link").die();
    $(".input_edit_value_rename").die();

    // Listener for key,value pair edit action
    $("#div_edit_rename_link").live("click", function() {
        var value_str = $(".value_td_rename").text();
        $(".value_td_rename").html('<input class="input_edit_value_rename" type="text" value="'+value_str+'"/>');
    });

    $(".input_edit_value_rename").live("change", function() {
        var value_str = $(".input_edit_value_rename").val();
        if(value_str!="")
        {
            // Let OpenNebula know
            var name_template = {"name": value_str};
            Sunstone.runAction("VM.rename",vm_info.ID,name_template);
        }
    });

    Sunstone.updateInfoPanelTab("vm_info_panel","vm_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_capacity_tab",capacity_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_hotplugging_tab",hotplugging_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_network_tab",network_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_snapshot_tab",snapshot_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_placement_tab",placement_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_actions_tab",actions_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_template_tab",template_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_log_tab",log_tab);

    // TODO: re-use pool_monitor data?

    //Pop up the info panel and asynchronously get vm_log and stats
    Sunstone.popUpInfoPanel("vm_info_panel", "vms-tab");
    Sunstone.runAction("VM.log",vm_info.ID);
    Sunstone.runAction("VM.monitor",vm_info.ID,
        { monitor_resources : "CPU,MEMORY,NET_TX,NET_RX"});

    var $info_panel = $('div#vm_info_panel');
    var $hotplugging_tab = $('div#vm_hotplugging_tab', $info_panel);
    $('tr.at_volatile',$hotplugging_tab).hide();
    $('tr.at_image',$hotplugging_tab).show();

    // Populate permissions grid
    setPermissionsTable(vm_info,'');

    $("#vm_info_panel_refresh", $("#vm_info_panel")).click(function(){
      $(this).html(spinner);
      Sunstone.runAction('VM.showinfo', vm_info.ID);
    })
}

function updateVMDisksInfo(request,vm){
  $("li#vm_hotplugging_tabTab").html(printDisks(vm.VM));
}

// Create the  actions table (with listeners)
function printActionsTable(vm_info)
{

    var str = '<div class="twelve columns">\
                  <button id="add_scheduling_action" class="button small secondary radius" >' + tr("Schedule action") +'</button>\
                <br><br></div>\
                <div class="twelve columns">\
                <table id="scheduling_actions_table" class="info_table twelve datatable extended_table">\
                 <thead>\
                   <tr>\
                      <th>'+tr("ID")+'</th>\
                      <th>'+tr("ACTION")+'</th>\
                      <th>'+tr("TIME")+'</th>\
                      <th>'+tr("DONE")+'</th>\
                      <th>'+tr("MESSAGE")+'</th>\
                      <th colspan="">'+tr("Actions")+'</th>\
                   </tr>\
                  </thead>' +
                    fromJSONtoActionsTable(
                                      vm_info.USER_TEMPLATE.SCHED_ACTION) +
                 '</table>\
                </div>'

    // Remove previous listeners
    $(".remove_action_x").die();
    $(".edit_action_e").die();
    $('#add_scheduling_action').die();
    $("#submit_scheduling_action").die();
    $(".select_action").die();
    $(".input_edit_time").die();


    $('#add_scheduling_action').live('click', function(){

        $("#add_scheduling_action").attr("disabled", "disabled");

        //$("#scheduling_actions_table").append('<tr><td></td>\
        //     <td class="action_row"><select id="select_new_action" class="select_new_action" name="select_action">\
        //                        <option value="shutdown">' + tr("shutdown") + '</option>\
        //                        <option value="hold">' + tr("hold") + '</option>\
        //                        <option value="release">' + tr("release") + '</option>\
        //                        <option value="stop">' + tr("stop") + '</option>\
        //                        <option value="cancel">' + tr("cancel") + '</option>\
        //                        <option value="suspend">' + tr("suspend") + '</option>\
        //                        <option value="resume">' + tr("resume") + '</option>\
        //                        <option value="restart">' + tr("restart") + '</option>\
        //                        <option value="resubmit">' + tr("resubmit") + '</option>\
        //                        <option value="reboot">' + tr("reboot") + '</option>\
        //                        <option value="reset">' + tr("reset") + '</option>\
        //                        <option value="poweroff">' + tr("poweroff") + '</option>\
        //                        <option value="snapshot-create">' + tr("snapshot-create") + '</option>\
        //                      </select>\
        //      </td>\
        //     <td class="time_row"><input id="date_time_input"><a class="date_time_picker_add_link">t</a></td>\
        //     <td>\
        //        <button id="submit_scheduling_action" class="button small secondary radius" >' + tr("Add") +'</button>\
        //     </td>\
        //   </tr>');

        $("#scheduling_actions_table").append('<tr><td></td>\
             <td class="columns"><select id="select_new_action" class="select_new_action" name="select_action">\
                                <option value="shutdown">' + tr("shutdown") + '</option>\
                                <option value="shutdown-hard">' + tr("shutdown-hard") + '</option>\
                                <option value="hold">' + tr("hold") + '</option>\
                                <option value="release">' + tr("release") + '</option>\
                                <option value="stop">' + tr("stop") + '</option>\
                                <option value="suspend">' + tr("suspend") + '</option>\
                                <option value="resume">' + tr("resume") + '</option>\
                                <option value="boot">' + tr("boot") + '</option>\
                                <option value="delete">' + tr("delete") + '</option>\
                                <option value="delete-recreate">' + tr("delete-recreate") + '</option>\
                                <option value="reboot">' + tr("reboot") + '</option>\
                                <option value="reboot-hard">' + tr("reboot-hard") + '</option>\
                                <option value="poweroff">' + tr("poweroff") + '</option>\
                                <option value="poweroff-hard">' + tr("poweroff-hard") + '</option>\
                                <option value="undeploy">' + tr("undeploy") + '</option>\
                                <option value="undeploy-hard">' + tr("undeploy-hard") + '</option>\
                                <option value="snapshot-create">' + tr("snapshot-create") + '</option>\
                              </select>\
              </td>\
             <td>\
                <input id="date_input" class="jdpicker" type="text" placeholder="2013/12/30"/>\
                <input id="time_input" class="timepicker" type="text" placeholder="12:30"/>\
             </td>\
             <td>\
                <button id="submit_scheduling_action" class="button small secondary radius" >' + tr("Add") +'</button>\
             </td>\
             <td colspan=2></td>\
           </tr>');

        $("#date_input").jdPicker();
        $("#time_input").timePicker();

        return false;
    });

    $("#submit_scheduling_action").live("click", function() {
        var date_input_value = $("#date_input").val();
        var time_input_value = $("#time_input").val();

        if (date_input_value=="" || time_input_value=="")
          return false;

        var time_value = date_input_value + ' ' + time_input_value


        // Calculate MAX_ID
        var max_id = -1;

        if (vm_info.USER_TEMPLATE.SCHED_ACTION)
        {
          if (!vm_info.USER_TEMPLATE.SCHED_ACTION.length)
          {
            var tmp_element = vm_info.USER_TEMPLATE.SCHED_ACTION;
            vm_info.USER_TEMPLATE.SCHED_ACTION = new Array();
            vm_info.USER_TEMPLATE.SCHED_ACTION.push(tmp_element);
          }

          $.each(vm_info.USER_TEMPLATE.SCHED_ACTION, function(i,element){
              if (max_id<element.ID)
                max_id=element.ID
          })
        }
        else
        {
          vm_info.USER_TEMPLATE.SCHED_ACTION = new Array();
        }


        var new_action = {};
        new_action.ID  = parseInt(max_id) + 1;
        new_action.ACTION = $("#select_new_action").val();
        var epoch_str   = new Date(time_value);

        new_action.TIME = parseInt(epoch_str.getTime())/1000;

        vm_info.USER_TEMPLATE.SCHED_ACTION.push(new_action);

        // Let OpenNebula know
        var template_str = convert_template_to_string(vm_info.USER_TEMPLATE);
        Sunstone.runAction("VM.update_actions",vm_info.ID,template_str);

        $("#add_scheduling_action").removeAttr("disabled");
        return false;
    });

    // Listener for key,value pair remove action
    $(".remove_action_x").live("click", function() {
        var index = this.id.substring(6,this.id.length);
        var tmp_tmpl = new Array();

        $.each(vm_info.USER_TEMPLATE.SCHED_ACTION, function(i,element){
            if(element.ID!=index)
              tmp_tmpl[i] = element
        })

        vm_info.USER_TEMPLATE.SCHED_ACTION = tmp_tmpl;
        var template_str = convert_template_to_string(vm_info.USER_TEMPLATE);

        // Let OpenNebula know
        Sunstone.runAction("VM.update_actions",vm_info.ID,template_str);
    });

    //// Listener for key,value pair edit action
    //$(".edit_e").live("click", function() {
    //    // Action
    //    $("#add_scheduling_action").attr("disabled", "disabled");
//
    //    var index=this.id.substring(5,this.id.length);
//
    //    var value_str = $(".tr_action_"+index+" .action_row").text();
    //    $(".tr_action_"+index+" .action_row").html('<select id="select_action_'+index+'" class="select_action" name="select_action">\
    //                            <option value="shutdown">' + tr("shutdown") + '</option>\
    //                            <option value="hold">' + tr("hold") + '</option>\
    //                            <option value="release">' + tr("release") + '</option>\
    //                            <option value="stop">' + tr("stop") + '</option>\
    //                            <option value="cancel">' + tr("cancel") + '</option>\
    //                            <option value="suspend">' + tr("suspend") + '</option>\
    //                            <option value="resume">' + tr("resume") + '</option>\
    //                            <option value="restart">' + tr("restart") + '</option>\
    //                            <option value="resubmit">' + tr("resubmit") + '</option>\
    //                            <option value="reboot">' + tr("reboot") + '</option>\
    //                            <option value="reset">' + tr("reset") + '</option>\
    //                            <option value="poweroff">' + tr("poweroff") + '</option>\
    //                            <option value="snapshot-create">' + tr("snapshot-create") + '</option>\
    //                          </select>')
    //    $(".select_action").val(value_str);
//
    //    // Time
    //    var time_value_str = $(".tr_action_"+index+" .time_row").text();
    //    $(".tr_action_"+index+" .time_row").html('<div><input style="width:90%;" class="input_edit_time" id="input_edit_time_'+
    //                    index+'" type="text" value="'+time_value_str+'">\
    //                    <a class="date_time_picker_link">t</a></div>');
//
    //    $(".date_time_picker_link").die();
    //    $(".date_time_picker_link").live("click", function() {
    //        setupDateTimePicker('#input_edit_time_'+index, time_value_str);
    //    });
    //});
//
    // $(".select_action").live("change", function() {
    //    var index     = $.trim(this.id.substring(14,this.id.length));
    //    var tmp_tmpl  = new Array();
    //    var value_str = $(this).val();
//
    //    if(vm_info.USER_TEMPLATE.SCHED_ACTION.length)
    //    {
    //      $.each(vm_info.USER_TEMPLATE.SCHED_ACTION, function(i,element){
    //          tmp_tmpl[i] = element;
    //          if(element.ID==index)
    //            tmp_tmpl[i].ACTION = value_str;
    //      })
    //      vm_info.USER_TEMPLATE.SCHED_ACTION = tmp_tmpl;
    //    }
    //    else
    //    {
    //        vm_info.USER_TEMPLATE.SCHED_ACTION.ACTION = value_str;
    //    }
//
    //    var template_str = convert_template_to_string(vm_info.USER_TEMPLATE);
//
    //    // Let OpenNebula know
    //    Sunstone.runAction("VM.update_template",vm_info.ID,template_str);
    //    $("#add_scheduling_action").removeAttr("disabled");
    //});
//
    //$(".input_edit_time").live("change", function() {
    //    var index     = $.trim(this.id.substring(16,this.id.length));
    //    var tmp_tmpl  = new Array();
    //    var epoch_str  = new Date($(this).val());
//
    //    if(vm_info.USER_TEMPLATE.SCHED_ACTION.length)
    //    {
    //      $.each(vm_info.USER_TEMPLATE.SCHED_ACTION, function(i,element){
    //          if(element.ID==index)
    //          {
    //            element.TIME = parseInt(epoch_str.getTime())/1000;
    //          }
    //          tmp_tmpl.push(element);
    //      })
    //      vm_info.USER_TEMPLATE.SCHED_ACTION = tmp_tmpl;
    //    }
    //    else
    //    {
    //        vm_info.USER_TEMPLATE.SCHED_ACTION.TIME = parseInt(epoch_str.getTime())/1000;
    //    }
//
    //    var template_str = convert_template_to_string(vm_info.USER_TEMPLATE);
//
    //    // Let OpenNebula know
    //    Sunstone.runAction("VM.update_template",vm_info.ID,template_str);
    //    $("#add_scheduling_action").removeAttr("disabled");
    //});

    return str;
}

// Returns an HTML string with the json keys and values
function fromJSONtoActionsTable(actions_array){
    var str = ""
    if (!actions_array){ return "";}
    if (!$.isArray(actions_array))
    {
      var tmp_array = new Array();
      tmp_array[0]  = actions_array;
      actions_array = tmp_array;
    }

    $.each(actions_array, function(index, scheduling_action){
       str += fromJSONtoActionRow(scheduling_action);
    });

    return str;
}


// Helper for fromJSONtoHTMLTable function
function fromJSONtoActionRow(scheduling_action){
    var str = "";

    var done_str    = scheduling_action.DONE ? (new Date(scheduling_action.DONE*1000).toLocaleString()) : "";
    var message_str = scheduling_action.MESSAGE ? scheduling_action.MESSAGE : "";
    var time_str    = new Date(scheduling_action.TIME*1000).toLocaleString();

    str += '<tr class="tr_action_'+scheduling_action.ID+'">\
             <td class="id_row">'+scheduling_action.ID+'</td>\
             <td class="action_row">'+scheduling_action.ACTION+'</td>\
             <td nowrap class="time_row">'+time_str+'</td>\
             <td class="done_row">'+done_str+'</td>\
             <td class="message_row">'+message_str+'</td>\
             <td>\
               <div>\
                 <a id="minus_'+scheduling_action.ID+'" class="remove_action_x" href="#"><i class="icon-trash"/></a>\
               </div>\
             </td>\
           </tr>';

    return str;
}

function setupDateTimePicker(input_to_fill, time_str){
    dialogs_context.append('<div id="date_time_picker_dialog"></div>');
    $date_time_picker_dialog = $('#date_time_picker_dialog',dialogs_context);
    var dialog = $date_time_picker_dialog;

    dialog.html( '<div class="panel">\
                  <h3>\
                    <small id="">'+tr("Date Time Picker")+'</small>\
                  </h3>\
                  <form id="date_time_form" action="">\
                    </div>\
                    <input type="text" name="date" value="2012/01/01 10:00">\
                    <script type="text/javascript">\
                      $(function(){\
                        $("*[name=date]").appendDtpicker({"inline": true, "current": "'+time_str+'"});\
                      });\
                    </script>\
                    <div class="form_buttons">\
                      <button class="button radius right success" id="date_time_form" type="submit">'+tr("Done")+'</button>\
                    </div>\
                    <a class="close-reveal-modal">&#215;</a>\
                  </form>');

    dialog.addClass("reveal-modal large");
    dialog.reveal();

    $("*[name=date]").val(time_str)
    $('#date_time_form',dialog).die();

    $('#date_time_form',dialog).live('click', function(){
        var date_str = $('*[name=date]').val();
        $(input_to_fill).val(date_str);
        $(input_to_fill).trigger("change");

        $date_time_picker_dialog.trigger("reveal:close")
        return false;
    });
};

function updateActionsInfo(request,vm){
  $("li#vm_actions_tabTab").html(printActionsTable(vm.VM));
}

// Generates the HTML for the hotplugging tab
// This is a list of disks with the save_as, detach options.
// And a form to attach a new disk to the VM, if it is running.
function printDisks(vm_info){
   var html ='\
     <div class="">\
        <div id="datatable_cluster_vnets_info_div columns twelve">\
           <form id="hotplugging_form" vmid="'+vm_info.ID+'" >\
              <div class="twelve columns">'

    if (Config.isTabActionEnabled("vms-tab", "VM.attachdisk")) {
      // If VM is not RUNNING, then we forget about the attach disk form.
      if (vm_info.STATE == "3" && vm_info.LCM_STATE == "3"){
        html += '\
           <button id="attach_disk" class="button small secondary radius" >' + tr("Attach new disk") +'</button>'
      } else {
        html += '\
           <button id="attach_disk" class="button small secondary radius" disabled="disabled">' + tr("Attach new disk") +'</button>'
      }
    }

    html += '\
      <br/>\
      <br/>\
      </div>'

    html += '\
      <div class="twelve columns">\
         <table class="info_table twelve extended_table">\
           <thead>\
             <tr>\
                <th>'+tr("ID")+'</th>\
                <th>'+tr("Target")+'</th>\
                <th>'+tr("Image / Format-Size")+'</th>\
                <th>'+tr("Persistent")+'</th>\
                <th>'+tr("Save as")+'</th>\
                <th colspan="">'+tr("Actions")+'</th>\
              </tr>\
           </thead>\
           <tbody>';


    var disks = []
    if ($.isArray(vm_info.TEMPLATE.DISK))
        disks = vm_info.TEMPLATE.DISK
    else if (!$.isEmptyObject(vm_info.TEMPLATE.DISK))
        disks = [vm_info.TEMPLATE.DISK]

    if (!disks.length){
        html += '\
          <tr id="no_disks_tr">\
            <td colspan="6">' + tr("No disks to show") + '</td>\
          </tr>';
    }
    else {

        for (var i = 0; i < disks.length; i++){
            var disk = disks[i];

            var save_as;
            // Snapshot deferred
            if (
               ( // ACTIVE
                vm_info.STATE == "3") &&
               ( // HOTPLUG_SAVEAS HOTPLUG_SAVEAS_POWEROFF HOTPLUG_SAVEAS_SUSPENDED
                vm_info.LCM_STATE == "26" || vm_info.LCM_STATE == "27" || vm_info.LCM_STATE == "28") &&
               ( //
                disk.SAVE_AS_ACTIVE == "YES")
               ) {
              save_as = tr("in progress");
              actions = tr('deferred snapshot in progress');
            }
            // Snapshot Hot
            else if (
               ( // ACTIVE
                vm_info.STATE == "3") &&
               ( // HOTPLUG_SAVEAS HOTPLUG_SAVEAS_POWEROFF HOTPLUG_SAVEAS_SUSPENDED
                vm_info.LCM_STATE == "26" || vm_info.LCM_STATE == "27" || vm_info.LCM_STATE == "28") &&
               ( //
                disk.HOTPLUG_SAVE_AS_ACTIVE == "YES")
               ) {
              save_as = (disk.SAVE_AS ? disk.SAVE_AS : '-');
              actions = tr('hot snapshot in progress');
            }
            // Attach / Detach
            else if (
               ( // ACTIVE
                vm_info.STATE == "3") &&
               ( // HOTPLUG_SAVEAS HOTPLUG_SAVEAS_POWEROFF HOTPLUG_SAVEAS_SUSPENDED
                vm_info.LCM_STATE == "17") &&
               ( //
                disk.ATTACH = "YES")
               ) {
              save_as = (disk.SAVE_AS ? disk.SAVE_AS : '-');
              actions = tr('attach/detach in progress');
            }
            else {
              save_as = (disk.SAVE_AS ? disk.SAVE_AS : '-');

              actions = '';

              if (Config.isTabActionEnabled("vms-tab", "VM.saveas")) {
                // Check if its volatie
                if (disk.IMAGE_ID) {
                  if ((vm_info.STATE == "3" && vm_info.LCM_STATE == "3") || vm_info.STATE == "5" || vm_info.STATE == "8") {
                    actions += '<a href="VM.saveas" class="saveas" ><i class="icon-save"/>'+tr("Snapshot")+'</a> &emsp;'
                  }
                }
              }

              if (Config.isTabActionEnabled("vms-tab", "VM.detachdisk")) {
                if (vm_info.STATE == "3" && vm_info.LCM_STATE == "3") {
                  actions += '<a href="VM.detachdisk" class="detachdisk" ><i class="icon-remove"/>'+tr("Detach")+'</a>'
                }
              }
            }

            html += '\
              <tr disk_id="'+(disk.DISK_ID)+'">\
                <td>' + disk.DISK_ID + '</td>\
                <td>' + disk.TARGET + '</td>\
                <td>' + (disk.IMAGE ? disk.IMAGE : (humanize_size_from_mb(disk.SIZE) + (disk.FORMAT ? (' - ' + disk.FORMAT) : '') )) + '</td>\
                <td>' + ((disk.SAVE && disk.SAVE == 'YES' )? tr('YES') : tr('NO')) + '</td>\
                <td>' + save_as + '</td>\
                <td>' + actions + '</td>\
            </tr>';
        }
    }

    html += '\
            </tbody>\
          </table>\
        </div>\
      </form>';

    return html;
}

function setupSaveAsDialog(){
    dialogs_context.append('<div id="save_as_dialog"></div>');
    $save_as_dialog = $('#save_as_dialog',dialogs_context);
    var dialog = $save_as_dialog;

    dialog.html('<div class="panel">\
  <h3>\
    <small id="">'+tr("Snapshot")+'</small>\
  </h3>\
</div>\
<form id="save_as_form" action="">\
      <div class="row centered">\
          <div class="four columns">\
              <label class="inline right" for="vm_id">'+tr("Virtual Machine ID")+':</label>\
          </div>\
          <div class="seven columns">\
              <input type="text" name="vm_id" id="vm_id" disabled/>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
      </div>\
      <div class="row centered">\
          <div class="four columns">\
              <label class="inline right" for="disk_id">'+tr("Disk ID")+':</label>\
          </div>\
          <div class="seven columns">\
              <input type="text" name="disk_id" id="disk_id" disabled/>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
      </div>\
      <div class="row centered">\
          <div class="four columns">\
              <label class="inline right" for="image_name">'+tr("Image name")+':</label>\
          </div>\
          <div class="seven columns">\
              <input type="text" name="image_name" id="image_name" />\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
      </div>\
      <div class="row centered">\
          <div class="four columns">\
              <label class="inline right" for="snapshot_type">'+tr("Snapshot type")+':</label>\
          </div>\
          <div class="seven columns">\
            <select name="snapshot_type" id="snapshot_type">\
                 <option value="false" selected="selected">'+tr("Deferred")+'</option>\
                 <option value="true">'+tr("Hot")+'</option>\
            </select>\
          </div>\
          <div class="one columns">\
              <div class="tip">'+tr("Sets the specified VM disk to be saved in a new Image.")+'<br><br>\
        '+tr("Deferred: The Image is created immediately, but the contents are saved only if the VM is shut down gracefully (i.e., using Shutdown; not Delete)")+'<br><br>\
        '+tr("Hot: The Image will be saved immediately.")+'</div>\
          </div>\
      </div>\
      <hr>\
      <div class="form_buttons">\
          <button class="button radius right success" id="snapshot_live_button" type="submit" value="VM.saveas">'+tr("Take snapshot")+'</button>\
          <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
      </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>')

    dialog.addClass("reveal-modal");
    setupTips(dialog);

    $('#save_as_form',dialog).submit(function(){
        var vm_id = $('#vm_id', this).val();
        var image_name = $('#image_name', this).val();
        var snapshot_type = $('#snapshot_type', this).val();

        if (!image_name.length){
            notifyError(tr('Please provide a name for the new image'));
            return false;
        }

        var obj = {
            disk_id : $('#disk_id', this).val(),
            image_name : image_name,
            type: "",
            hot: (snapshot_type == "true" ? true : false)
        };

        Sunstone.runAction('VM.saveas', vm_id, obj);

        $save_as_dialog.trigger("reveal:close")
        return false;
    });
};

function popUpSaveAsDialog(vm_id, disk_id){
    $('#vm_id',$save_as_dialog).val(vm_id);
    $('#disk_id',$save_as_dialog).val(disk_id);
    $save_as_dialog.reveal();
}




function setupAttachDiskDialog(){
    dialogs_context.append('<div id="attach_disk_dialog"></div>');
    $attach_disk_dialog = $('#attach_disk_dialog',dialogs_context);
    var dialog = $attach_disk_dialog;

    dialog.html('<div class="panel">\
      <h3>\
        <small id="">'+tr("Attach new disk")+'</small>\
      </h3>\
    </div>\
        <div class="reveal-body">\
    <form id="attach_disk_form" action="">\
          <div class="row centered">\
              <div class="four columns">\
                  <label class="inline right" for="vm_id">'+tr("Virtual Machine ID")+':</label>\
              </div>\
              <div class="seven columns">\
                  <input type="text" name="vm_id" id="vm_id" disabled/>\
              </div>\
              <div class="one columns">\
                  <div class=""></div>\
              </div>\
          </div>' +
          generate_disk_tab_content("attach_disk", "attach_disk") +
          '<div class="reveal-footer">\
          <hr>\
          <div class="form_buttons">\
              <button class="button radius right success" id="attach_disk_button" type="submit" value="VM.attachdisk">'+tr("Attach")+'</button>\
              <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
          </div>\
          </div>\
      <a class="close-reveal-modal">&#215;</a>\
    </form></div>')

    dialog.addClass("reveal-modal large max-height");
    setupTips(dialog);

    setup_disk_tab_content(dialog, "attach_disk", "attach_disk")

    $('#attach_disk_form',dialog).submit(function(){
        var vm_id = $('#vm_id', this).val();

        var data  = {};
        addSectionJSON(data, this);

        var obj = {DISK: data}
        Sunstone.runAction('VM.attachdisk', vm_id, obj);

        $attach_disk_dialog.trigger("reveal:close")
        return false;
    });
};

function popUpAttachDiskDialog(vm_id){
    $('#vm_id',$attach_disk_dialog).val(vm_id);
    $attach_disk_dialog.reveal();
}


// Listeners to the disks operations (detach, saveas, attach)
function hotpluggingOps(){
    if (Config.isTabActionEnabled("vms-tab", "VM.saveas")) {
      setupSaveAsDialog();

      $('a.saveas').live('click', function(){
          var b = $(this);
          var vm_id = b.parents('form').attr('vmid');
          var disk_id = b.parents('tr').attr('disk_id');

          popUpSaveAsDialog(vm_id, disk_id);

          //b.html(spinner);
          return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.attachdisk")) {
      setupAttachDiskDialog();

      $('#attach_disk').live('click', function(){
          var b = $(this);
          var vm_id = b.parents('form').attr('vmid');

          popUpAttachDiskDialog(vm_id);

          //b.html(spinner);
          return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.detachdisk")) {
      $('a.detachdisk').live('click', function(){
          var b = $(this);
          var vm_id = b.parents('form').attr('vmid');
          var disk_id = b.parents('tr').attr('disk_id');

          Sunstone.runAction('VM.detachdisk', vm_id, disk_id);

          //b.html(spinner);
          return false;
      });
    }
}

function printNics(vm_info){
   var html ='\
     <div class="">\
        <div>\
           <form id="tab_network_form" vmid="'+vm_info.ID+'" >\
              <div class="twelve columns">'

    if (Config.isTabActionEnabled("vms-tab", "VM.attachnic")) {
      // If VM is not RUNNING, then we forget about the attach nic form.
      if (vm_info.STATE == "3" && vm_info.LCM_STATE == "3"){
        html += '\
           <button id="attach_nic" class="button small secondary radius" >' + tr("Attach new nic") +'</button>'
      } else {
        html += '\
           <button id="attach_nic" class="button small secondary radius" disabled="disabled">' + tr("Attach new nic") +'</button>'
      }
    }

    html += '<br>\
      <br>\
      </div>'

    html += '\
      <div class="twelve columns">\
         <table class="info_table twelve extended_table">\
           <thead>\
             <tr>\
                <th>'+tr("ID")+'</th>\
                <th>'+tr("Network")+'</th>\
                <th>'+tr("IP")+'</th>\
                <th>'+tr("MAC")+'</th>\
                <th>'+tr("IPv6 Site")+'</th>\
                <th>'+tr("IPv6 Global")+'</th>\
                <th colspan="">'+tr("Actions")+'</th>\
              </tr>\
           </thead>\
           <tbody>';


    var nics = []
    if ($.isArray(vm_info.TEMPLATE.NIC))
        nics = vm_info.TEMPLATE.NIC
    else if (!$.isEmptyObject(vm_info.TEMPLATE.NIC))
        nics = [vm_info.TEMPLATE.NIC]

    if (!nics.length){
        html += '\
          <tr id="no_nics_tr">\
            <td colspan="7">' + tr("No nics to show") + '</td>\
          </tr>';
    }
    else {

        for (var i = 0; i < nics.length; i++){
            var nic = nics[i];

            var actions;
            // Attach / Detach
            if (
               ( // ACTIVE
                vm_info.STATE == "3") &&
               ( // HOTPLUG_NIC
                vm_info.LCM_STATE == "25") &&
               ( //
                nic.ATTACH == "YES")
               ) {
              actions = 'attach/detach in progress'
            }
            else {
              actions = '';

              if (Config.isTabActionEnabled("vms-tab", "VM.detachnic")) {
                if (vm_info.STATE == "3" && vm_info.LCM_STATE == "3") {
                  actions += '<a href="VM.detachnic" class="detachnic" ><i class="icon-remove"/>'+tr("Detach")+'</a>'
                }
              }
            }

            html += '\
              <tr nic_id="'+(nic.NIC_ID)+'">\
                <td>' + nic.NIC_ID + '</td>\
                <td>' + nic.NETWORK + '</td>\
                <td>' + nic.IP + '</td>\
                <td>' + nic.MAC + '</td>\
                <td>' + (nic.IP6_SITE ? nic.IP6_SITE : "--") +'</td>\
                <td>' + (nic.IP6_GLOBAL ? nic.IP6_GLOBAL : "--") +'</td>\
                <td>' + actions + '</td>\
            </tr>';
        }
    }

    html += '\
            </tbody>\
          </table>\
        </div>\
        <div class="">\
            <div class="six columns">\
              <div class="row graph_legend">\
                <h3 class="subheader"><small>'+tr("NET RX")+'</small></h3>\
              </div>\
              <div class="row">\
                <div class="ten columns centered graph" id="vm_net_rx_graph" style="height: 100px;">\
                </div>\
              </div>\
              <div class="row graph_legend">\
                <div class="ten columns centered" id="vm_net_rx_legend">\
                </div>\
              </div>\
            </div>\
            <div class="six columns">\
              <div class="row graph_legend">\
                <h3 class="subheader"><small>'+tr("NET TX")+'</small></h3>\
              </div>\
              <div class="row">\
                <div class="ten columns centered graph" id="vm_net_tx_graph" style="height: 100px;">\
                </div>\
              </div>\
              <div class="row graph_legend">\
                <div class="ten columns centered" id="vm_net_tx_legend">\
                </div>\
              </div>\
            </div>\
            <div class="six columns">\
              <div class="row graph_legend">\
                <h3 class="subheader"><small>'+tr("NET DOWNLOAD SPEED")+'</small></h3>\
              </div>\
              <div class="row">\
                <div class="ten columns centered graph" id="vm_net_rx_speed_graph" style="height: 100px;">\
                </div>\
              </div>\
              <div class="row graph_legend">\
                <div class="ten columns centered" id="vm_net_rx_speed_legend">\
                </div>\
              </div>\
            </div>\
            <div class="six columns">\
              <div class="row graph_legend">\
                <h3 class="subheader"><small>'+tr("NET UPLOAD SPEED")+'</small></h3>\
              </div>\
              <div class="row">\
                <div class="ten columns centered graph" id="vm_net_tx_speed_graph" style="height: 100px;">\
                </div>\
              </div>\
              <div class="row graph_legend">\
                <div class="ten columns centered" id="vm_net_tx_speed_legend">\
                </div>\
              </div>\
            </div>\
        </div>\
      </form>';

    return html;
}

function setupAttachNicDialog(){
    dialogs_context.append('<div id="attach_nic_dialog"></div>');
    $attach_nic_dialog = $('#attach_nic_dialog',dialogs_context);
    var dialog = $attach_nic_dialog;

    dialog.html('<div class="panel">\
      <h3>\
        <small id="">'+tr("Attach new nic")+'</small>\
      </h3>\
    </div>\
        <div class="reveal-body">\
    <form id="attach_nic_form" action="">\
          <div class="row centered">\
              <div class="four columns">\
                  <label class="inline right" for="vm_id">'+tr("Virtual Machine ID")+':</label>\
              </div>\
              <div class="seven columns">\
                  <input type="text" name="vm_id" id="vm_id" disabled/>\
              </div>\
              <div class="one columns">\
                  <div class=""></div>\
              </div>\
          </div>' +
          generate_nic_tab_content("attach_nic", "attach_nic") +
          '<div class="reveal-footer">\
          <hr>\
          <div class="form_buttons">\
              <button class="button radius right success" id="attach_nic_button" type="submit" value="VM.attachnic">'+tr("Attach")+'</button>\
              <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
          </div>\
          </div>\
      <a class="close-reveal-modal">&#215;</a>\
    </form></div>')

    dialog.addClass("reveal-modal large max-height");
    setupTips(dialog);

    setup_nic_tab_content(dialog, "attach_nic", "attach_nic")

    $('#attach_nic_form',dialog).submit(function(){
        var vm_id = $('#vm_id', this).val();

        var data  = {};
        addSectionJSON(data, this);

        var obj = {NIC: data}
        Sunstone.runAction('VM.attachnic', vm_id, obj);

        $attach_nic_dialog.trigger("reveal:close")
        return false;
    });
};

function popUpAttachNicDialog(vm_id){
    $('#vm_id',$attach_nic_dialog).val(vm_id);
    $attach_nic_dialog.reveal();
}


// Listeners to the nics operations (detach, saveas, attach)
function setup_vm_network_tab(){
    if (Config.isTabActionEnabled("vms-tab", "VM.attachnic")) {
      setupAttachNicDialog();

      $('#attach_nic').live('click', function(){
          var b = $(this);
          var vm_id = b.parents('form').attr('vmid');

          popUpAttachNicDialog(vm_id);

          //b.html(spinner);
          return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.detachnic")) {
      $('a.detachnic').live('click', function(){
          var b = $(this);
          var vm_id = b.parents('form').attr('vmid');
          var nic_id = b.parents('tr').attr('nic_id');

          Sunstone.runAction('VM.detachnic', vm_id, nic_id);

          //b.html(spinner);
          return false;
      });
    }
}

function printCapacity(vm_info){
   var html ='\
     <div class="">\
        <div>\
           <form id="tab_capacity_form" vmid="'+vm_info.ID+'" >\
              <div class="twelve columns">'

    if (Config.isTabActionEnabled("vms-tab", "VM.resize")) {
      // If VM is not INIT, PENDING, HOLD, FAILED, POWEROFF, UNDEPLOYED, then we forget about the resize form.
      if (vm_info.STATE == "0" || vm_info.STATE == "1" || vm_info.STATE == "2" || vm_info.STATE == "7" || vm_info.STATE == "8" || vm_info.STATE == "9"){
        html += '\
          <button id="resize_capacity" class="button small secondary radius" >' + tr("Resize VM capacity") +'</button>'
      } else {
        html += '\
          <button id="resize_capacity" class="button small secondary radius" disabled="disabled">' + tr("Resize VM capacity") +'</button>'
      }
    }

    html += '<br>\
      <br>\
      </div>'

    html += '\
      <div class="twelve columns">\
         <table class="info_table twelve extended_table">\
           <thead>\
             <tr>\
                <th>'+tr("CPU")+'</th>\
                <th>'+tr("VCPU")+'</th>\
                <th>'+tr("MEMORY")+'</th>\
              </tr>\
           </thead>\
           <tbody>\
              <tr>\
                <td>' + vm_info.TEMPLATE.CPU + '</td>\
                <td>' + (vm_info.TEMPLATE.VCPU ? vm_info.TEMPLATE.VCPU : '-') + '</td>\
                <td>' + humanize_size_from_mb(vm_info.TEMPLATE.MEMORY) + '</td>\
            </tr>\
            </tbody>\
          </table>\
        </div>\
            <div class="six columns">\
              <div class="row graph_legend">\
                <h3 class="subheader"><small>'+tr("REAL CPU")+'</small></h3>\
              </div>\
              <div class="row">\
                <div class="ten columns centered graph" id="vm_cpu_graph" style="height: 100px;">\
                </div>\
              </div>\
              <div class="row graph_legend">\
                <div class="ten columns centered" id="vm_cpu_legend">\
                </div>\
              </div>\
            </div>\
            <div class="six columns">\
              <div class="row graph_legend">\
                <h3 class="subheader"><small>'+tr("REAL MEMORY")+'</small></h3>\
              </div>\
              <div class="row">\
                <div class="ten columns centered graph" id="vm_memory_graph" style="height: 100px;">\
                </div>\
              </div>\
              <div class="row graph_legend">\
                <div class="ten columns centered" id="vm_memory_legend">\
                </div>\
              </div>\
            </div>\
      </form>';

    return html;
}

function setupResizeCapacityDialog(){
    dialogs_context.append('<div id="resize_capacity_dialog"></div>');
    $resize_capacity_dialog = $('#resize_capacity_dialog',dialogs_context);
    var dialog = $resize_capacity_dialog;

    dialog.html('<div class="panel">\
      <h3>\
        <small id="">'+tr("Resize VM capacity")+'</small>\
      </h3>\
    </div>\
    <div class="reveal-body">\
    <form id="resize_capacity_form" action="">\
          <div class="row centered">\
          <div class="eight columns">\
              <div class="four columns">\
                  <label class="inline right" for="vm_id">'+tr("Virtual Machine ID")+':</label>\
              </div>\
              <div class="seven columns">\
                  <input type="text" name="vm_id" id="vm_id" disabled/>\
              </div>\
              <div class="one columns">\
              </div>\
          </div>\
          <div class="four columns">\
              <div class="four columns">\
                  <label class="inline right" for="vm_id">'+tr("Enforce")+':</label>\
              </div>\
              <div class="two columns">\
                  <input type="checkbox" name="enforce" id="enforce"/>\
              </div>\
              <div class="one columns pull-five">\
                  <div class="tip">'
                    + tr("If it is set to true, the host capacity will be checked. This will only affect oneadmin requests, regular users resize requests will always be enforced") +
                  '</div>\
              </div>\
          </div>\
          </div>' +
          generate_capacity_tab_content() +
          '<div class="reveal-footer">\
          <hr>\
          <div class="form_buttons">\
              <button class="button radius right success" id="resize_capacity_button" type="submit" value="VM.resize">'+tr("Resize")+'</button>\
              <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
          </div>\
          </div>\
      <a class="close-reveal-modal">&#215;</a>\
    </form></div>')

    dialog.addClass("reveal-modal large max-height");
    setupTips(dialog);

    $("#template_name_form", dialog).hide();

    setup_capacity_tab_content(dialog);

    $('#resize_capacity_form',dialog).submit(function(){
        var vm_id = $('#vm_id', this).val();

        var enforce = false;
        if ($("#enforce", this).is(":checked")) {
          enforce = true;
        }

        var data  = {};
        addSectionJSON(data, this);

        var obj = {
          "vm_template": data,
          "enforce": enforce,
        }

        Sunstone.runAction('VM.resize', vm_id, obj);

        $resize_capacity_dialog.trigger("reveal:close")
        return false;
    });
};

function popUpResizeCapacityDialog(vm_id){
    $('#vm_id',$resize_capacity_dialog).val(vm_id);
    $resize_capacity_dialog.reveal();
}


// Listeners to the nics operations (detach, saveas, attach)
function setup_vm_capacity_tab(){
    //setupSaveAsDialog();
    if (Config.isTabActionEnabled("vms-tab", "VM.resize")) {
      setupResizeCapacityDialog();


      $('#resize_capacity').live('click', function(){
          var b = $(this);
          var vm_id = b.parents('form').attr('vmid');

          popUpResizeCapacityDialog(vm_id);

          //b.html(spinner);
          return false;
      });
    }
}


function updateVMSnapshotsInfo(request,vm){
  $("li#vm_snapshot_tabTab").html(printSnapshots(vm.VM));
}

// Generates the HTML for the snapshot tab
// This is a list of disks with the save_as, detach options.
// And a form to attach a new disk to the VM, if it is running.
function printSnapshots(vm_info){
   var html ='\
     <div class="">\
        <div id="columns twelve">\
           <form id="snapshot_form" vmid="'+vm_info.ID+'" >\
              <div class="twelve columns">'

    if (Config.isTabActionEnabled("vms-tab", "VM.snapshot_create")) {
      // If VM is not RUNNING, then we forget about the attach disk form.
      if (vm_info.STATE == "3" && vm_info.LCM_STATE == "3"){
        html += '\
           <button id="take_snapshot" class="button small secondary radius" >' + tr("Take snapshot") +'</button>'
      } else {
        html += '\
           <button id="take_snapshot" class="button small secondary radius" disabled="disabled">' + tr("Take snapshot") +'</button>'
      }
    }

    html += '<br>\
      <br>\
      </div>'

    html += '\
      <div class="twelve columns">\
         <table class="info_table twelve extended_table">\
           <thead>\
             <tr>\
                <th>'+tr("ID")+'</th>\
                <th>'+tr("Name")+'</th>\
                <th>'+tr("Timestamp")+'</th>\
                <th>'+tr("Actions")+'</th>\
              </tr>\
           </thead>\
           <tbody>';


    var snapshots = []
    if ($.isArray(vm_info.TEMPLATE.SNAPSHOT))
        snapshots = vm_info.TEMPLATE.SNAPSHOT
    else if (!$.isEmptyObject(vm_info.TEMPLATE.SNAPSHOT))
        snapshots = [vm_info.TEMPLATE.SNAPSHOT]

    if (!snapshots.length){
        html += '\
          <tr id="no_snapshots_tr">\
            <td colspan="6">' + tr("No snapshots to show") + '</td>\
          </tr>';
    }
    else {

        for (var i = 0; i < snapshots.length; i++){
            var snapshot = snapshots[i];

            if (
               ( // ACTIVE
                vm_info.STATE == "3") &&
               ( // HOTPLUG_SNAPSHOT
                vm_info.LCM_STATE == "24"))  {
              actions = 'snapshot in progress'
            }
            else {
              actions = '';

              if ((vm_info.STATE == "3" && vm_info.LCM_STATE == "3")) {
                if (Config.isTabActionEnabled("vms-tab", "VM.snapshot_revert")) {
                  actions += '<a href="VM.snapshot_revert" class="snapshot_revert" ><i class="icon-reply"/>'+tr("Revert")+'</a> &emsp;'
                }

                if (Config.isTabActionEnabled("vms-tab", "VM.snapshot_delete")) {
                  actions += '<a href="VM.snapshot_delete" class="snapshot_delete" ><i class="icon-remove"/>'+tr("Delete")+'</a>'
                }
              }
            }

            html += '\
              <tr snapshot_id="'+(snapshot.SNAPSHOT_ID)+'">\
                <td>' + snapshot.SNAPSHOT_ID + '</td>\
                <td>' + snapshot.NAME + '</td>\
                <td>' + pretty_time(snapshot.TIME) + '</td>\
                <td>' + actions + '</td>\
            </tr>';
        }
    }

    html += '\
            </tbody>\
          </table>\
        </div>\
      </form>';

    return html;
}

function setupSnapshotDialog(){
    dialogs_context.append('<div id="snapshot_dialog"></div>');
    $snapshot_dialog = $('#snapshot_dialog',dialogs_context);
    var dialog = $snapshot_dialog;

    dialog.html('<div class="panel">\
  <h3>\
    <small id="">'+tr("Snapshot")+'</small>\
  </h3>\
</div>\
<form id="snapshot_form" action="">\
      <div class="row centered">\
          <div class="four columns">\
              <label class="inline right" for="vm_id">'+tr("Virtual Machine ID")+':</label>\
          </div>\
          <div class="seven columns">\
              <input type="text" name="vm_id" id="vm_id" disabled/>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
      </div>\
      <div class="row centered">\
          <div class="four columns">\
              <label class="inline right" for="snapshot_name">'+tr("Snapshot name")+':</label>\
          </div>\
          <div class="seven columns">\
              <input type="text" name="snapshot_name" id="snapshot_name" />\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
      </div>\
      <hr>\
      <div class="form_buttons">\
          <button class="button radius right success" id="snapshot_live_button" type="submit" value="VM.saveas">'+tr("Take snapshot")+'</button>\
          <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
      </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>')

    dialog.addClass("reveal-modal");
    setupTips(dialog);

    $('#snapshot_form',dialog).submit(function(){
        var vm_id = $('#vm_id', this).val();
        var snapshot_name = $('#snapshot_name', this).val();

        var obj = {
            snapshot_name : snapshot_name
        };

        Sunstone.runAction('VM.snapshot_create', vm_id, obj);

        $snapshot_dialog.trigger("reveal:close")
        return false;
    });
};

function popUpSnapshotDialog(vm_id){
    $('#vm_id',$snapshot_dialog).val(vm_id);
    $snapshot_dialog.reveal();
}




// Listeners to the disks operations (detach, saveas, attach)
function setup_vm_snapshot_tab(){
    if (Config.isTabActionEnabled("vms-tab", "VM.snapshot_create")) {
      setupSnapshotDialog();

      $('#take_snapshot').live('click', function(){
          var b = $(this);
          var vm_id = b.parents('form').attr('vmid');

          popUpSnapshotDialog(vm_id);

          //b.html(spinner);
          return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.snapshot_revert")) {
      $('a.snapshot_revert').live('click', function(){
          var b = $(this);
          var vm_id = b.parents('form').attr('vmid');
          var snapshot_id = b.parents('tr').attr('snapshot_id');

          Sunstone.runAction('VM.snapshot_revert', vm_id, {"snapshot_id": snapshot_id});

          //b.html(spinner);
          return false;
      });
    }


    if (Config.isTabActionEnabled("vms-tab", "VM.snapshot_delete")) {
      $('a.snapshot_delete').live('click', function(){
          var b = $(this);
          var vm_id = b.parents('form').attr('vmid');
          var snapshot_id = b.parents('tr').attr('snapshot_id');

          Sunstone.runAction('VM.snapshot_delete', vm_id, {"snapshot_id": snapshot_id});

          //b.html(spinner);
          return false;
      });
    }
}


// Sets up the create-template dialog and all the processing associated to it,
// which is a lot.
function setupCreateVMDialog(include_select_image){

    dialogs_context.append('<div title=\"'+tr("Create Virtual Machine")+'\" id="create_vm_dialog"></div>');
    //Insert HTML in place
    $create_vm_dialog = $('#create_vm_dialog')
    var dialog = $create_vm_dialog;
    dialog.html(create_vm_tmpl);
    dialog.addClass("reveal-modal large max-height");

    var dataTable_template_templates = $('#template_templates_table', dialog).dataTable({
        "iDisplayLength": 4,
        "bAutoWidth":false,
        "sDom" : '<"H">t<"F"p>',
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0,1] },
            { "bVisible": false, "aTargets": [1,2,3,5]}
        ],
          "fnDrawCallback": function(oSettings) {
            var nodes = this.fnGetNodes();
            $.each(nodes, function(){
                if ($(this).find("td:eq(1)").html() == $('#TEMPLATE_ID', dialog).val()) {
                    $("td", this).addClass('markrow');
                    $('input.check_item', this).attr('checked','checked');
                }
            })
          }
    });

    // Retrieve the images to fill the datatable
    update_datatable_template_templates(dataTable_template_templates);

    $('#template_templates_table_search', dialog).keyup(function(){
      dataTable_template_templates.fnFilter( $(this).val() );
    })

    $('#template_templates_table tbody', dialog).delegate("tr", "click", function(e){
        var aData = dataTable_template_templates.fnGetData(this);

        $("td.markrow", dataTable_template_templates).removeClass('markrow');
        $('tbody input.check_item', dataTable_template_templates).removeAttr('checked');

        $('#template_selected', dialog).show();
        $('#select_template', dialog).hide();
        $('.alert-box', dialog).hide();

        $("td", this).addClass('markrow');
        $('input.check_item', this).attr('checked','checked');

        $('#TEMPLATE_NAME', dialog).text(aData[4]);
        $('#TEMPLATE_ID', dialog).val(aData[1]);
        return true;
    });

    $("#refresh_template_templates_table_button_class").die();
    $("#refresh_template_templates_table_button_class").live('click', function(){
        update_datatable_template_templates($('#template_templates_table').dataTable());
    }); 

    if (include_select_image) {
      $("#select_image_step", dialog).show();
      var dataTable_template_images = $('#template_images_table', dialog).dataTable({
          "iDisplayLength": 4,
          "bAutoWidth":false,
          "sDom" : '<"H">t<"F"p>',
          "aoColumnDefs": [
              { "sWidth": "35px", "aTargets": [0,1] },
              { "bVisible": false, "aTargets": [2,3,7,8,5,9,12]}
          ],
            "fnDrawCallback": function(oSettings) {
              var nodes = this.fnGetNodes();
              $.each(nodes, function(){
                  if ($(this).find("td:eq(1)").html() == $('#IMAGE_ID', dialog).val()) {
                      $("td", this).addClass('markrow');
                      $('input.check_item', this).attr('checked','checked');
                  }
              })
            }
      });

      // Retrieve the images to fill the datatable
      update_datatable_template_images(dataTable_template_images);

      $('#template_images_table_search', dialog).keyup(function(){
        dataTable_template_images.fnFilter( $(this).val() );
      })

      $('#template_images_table tbody', dialog).delegate("tr", "click", function(e){
          var aData = dataTable_template_images.fnGetData(this);

          $("td.markrow", dataTable_template_images).removeClass('markrow');
          $('tbody input.check_item', dataTable_template_images).removeAttr('checked');

          $('#image_selected', dialog).show();
          $('#select_image', dialog).hide();
          $('.alert-box', dialog).hide();

          $("td", this).addClass('markrow');
          $('input.check_item', this).attr('checked','checked');

          $('#IMAGE_NAME', dialog).text(aData[4]);
          $('#IMAGE_ID', dialog).val(aData[1]);
          return true;
      });

      $("#refresh_template_images_table_button_class").die();
      $("#refresh_template_images_table_button_class").live('click', function(){
          update_datatable_template_images($('#template_images_table').dataTable());
      });
    } else {
      $("#select_image_step", dialog).hide();
    }

    setupTips(dialog);

    $('#create_vm_form',dialog).submit(function(){
        var vm_name = $('#vm_name',this).val();
        var template_id = $('#TEMPLATE_ID',this).val();
        var n_times = $('#vm_n_times',this).val();
        var n_times_int=1;

        if (!template_id.length){
            notifyError(tr("You have not selected a template"));
            return false;
        };

        if (n_times.length){
            n_times_int=parseInt(n_times,10);
        };

        var extra_msg = "";
        if (n_times_int > 1) {
            extra_msg = n_times_int+" times";
        }

        notifySubmit("Template.instantiate",template_id, extra_msg);

        var extra_info = {};
        if ($("#IMAGE_ID", this).val()) {
          image_id = $("#IMAGE_ID", this).val();
          extra_info['template'] = {
            'disk': {
              'image_id': image_id
            }
          }
        } 

        if (!vm_name.length){ //empty name use OpenNebula core default
            for (var i=0; i< n_times_int; i++){
                extra_info['vm_name'] = "";
                Sunstone.runAction("Template.instantiate_quiet", template_id, extra_info);
            };
        }
        else
        {
          if (vm_name.indexOf("%i") == -1){//no wildcard, all with the same name
              for (var i=0; i< n_times_int; i++){
                extra_info['vm_name'] = vm_name;
                Sunstone.runAction("Template.instantiate_quiet", template_id, extra_info);
              };
          } else { //wildcard present: replace wildcard
              for (var i=0; i< n_times_int; i++){
                  extra_info['vm_name'] = vm_name.replace(/%i/gi,i);
                  Sunstone.runAction("Template.instantiate_quiet", template_id, extra_info);
              };
          };
        }

        setTimeout(function(){
            Sunstone.runAction("VM.list");
        },1500);
        $create_vm_dialog.trigger("reveal:close")
        return false;
    });
}

// Open creation dialog
function popUpCreateVMDialog(include_select_image){
    setupCreateVMDialog(include_select_image);
    $create_vm_dialog.reveal();
}

//Prepares autorefresh
function setVMAutorefresh(){
     setInterval(function(){
         var checked = $('input.check_item:checked',dataTable_vMachines);
         var filter = $("#vms_search").attr('value');
         if ((checked.length==0) && !filter){
             Sunstone.runAction("VM.autorefresh");
         };
     },INTERVAL+someTime());
}

//This is taken from noVNC examples
function updateVNCState(rfb, state, oldstate, msg) {
    var s, sb, cad, klass;
    s = $D('VNC_status');
    sb = $D('VNC_status_bar');
    cad = $D('sendCtrlAltDelButton');
    switch (state) {
    case 'failed':
    case 'fatal':
        klass = "VNC_status_error";
        break;
    case 'normal':
        klass = "VNC_status_normal";
        break;
    case 'disconnected':
    case 'loaded':
        klass = "VNC_status_normal";
        break;
    case 'password':
        klass = "VNC_status_warn";
        break;
    default:
        klass = "VNC_status_warn";
    }

    if (state === "normal") { cad.disabled = false; }
    else                    { cad.disabled = true; }

    if (typeof(msg) !== 'undefined') {
        sb.setAttribute("class", klass);
        s.innerHTML = msg;
    }
}

//setups VNC application
function setupVNC(){

    //Append to DOM
    dialogs_context.append('<div id="vnc_dialog" style="width:auto; max-width:70%" title=\"'+tr("VNC connection")+'\"></div>');
    $vnc_dialog = $('#vnc_dialog',dialogs_context);
    var dialog = $vnc_dialog;

    dialog.html('\
  <div class="panel">\
    <h3>\
      <small id="vnc_dialog">'+tr("VNC")+' \
        <span id="VNC_status">'+tr("Loading")+'</span>\
        <span id="VNC_buttons">\
          <input type=button value="Send CtrlAltDel" id="sendCtrlAltDelButton">\
          <a id="open_in_a_new_window" href="" target="_blank" title="'+tr("Open in a new window")+'">\
            <i class="icon-external-link detach-vnc-icon"/>\
          </a>\
        </span>\
      </small>\
    </h3>\
  </div>\
  <div class="reveal-body" style="width:100%; overflow-x:overlay">\
    <canvas id="VNC_canvas" width="640px">\
        '+tr("Canvas not supported.")+'\
    </canvas>\
    <div id="VNC_status_bar" class="VNC_status_bar">\
    </div>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>\
');

    //dialog.dialog({
    //    autoOpen:false,
    //    width:750,
    //    modal:true,
    //    height:500,
    //    resizable:true,
    //    closeOnEscape: false
    //});
    dialog.addClass("reveal-modal large max-height");

    $('#sendCtrlAltDelButton',dialog).click(function(){
        rfb.sendCtrlAltDel();
        return false;
    });


    $('.vnc').live("click",function(){
        var id = $(this).attr('vm_id');

        //Ask server for connection params
        Sunstone.runAction("VM.startvnc",id);
        return false;
    });
}

function vncCallback(request,response){
    rfb = new RFB({'target':       $D('VNC_canvas'),
                   'encrypt':      config['user_config']['vnc_wss'] == "yes",
                   'true_color':   true,
                   'local_cursor': true,
                   'shared':       true,
                   'updateState':  updateVNCState});

    var proxy_host = window.location.hostname;
    var proxy_port = config['system_config']['vnc_proxy_port'];
    var pw = response["password"];
    var token = response["token"];
    var vm_name = response["vm_name"];
    var path = '?token='+token;

    var url = "vnc?";
    url += "host=" + proxy_host;
    url += "&port=" + proxy_port;
    url += "&token=" + token;
    url += "&password=" + pw;
    url += "&encrypt=" + config['user_config']['vnc_wss'];
    url += "&title=" + vm_name;

    $("#open_in_a_new_window").attr('href', url)
    rfb.connect(proxy_host, proxy_port, pw, path);
    $vnc_dialog.reveal({"closed": function () {
      rfb.disconnect();
    }});
}

function vncIcon(vm){
    var graphics = vm.TEMPLATE.GRAPHICS;
    var state = OpenNebula.Helper.resource_state("vm_lcm",vm.LCM_STATE);
    var gr_icon;

    if (graphics && graphics.TYPE.toLowerCase() == "vnc" && $.inArray(state, VNCstates)!=-1){
        gr_icon = '<a class="vnc" href="#" vm_id="'+vm.ID+'">';
        gr_icon += '<i class="icon-desktop" style="color: rgb(111, 111, 111)"/>';
    }
    else {
        gr_icon = '';
    }

    gr_icon += '</a>'
    return gr_icon;
}


// Special error callback in case historical monitoring of VM fails
function vmMonitorError(req,error_json){
    var message = error_json.error.message;
    var info = req.request.data[0].monitor;
    var labels = info.monitor_resources;
    var id_suffix = labels.replace(/,/g,'_');
    var id = '#vm_monitor_'+id_suffix;
    $('#vm_monitoring_tab '+id).html('<div style="padding-left:20px;">'+message+'</div>');
}

// At this point the DOM is ready and the sunstone.js ready() has been run.
$(document).ready(function(){
    var tab_name = 'vms-tab';

    if (Config.isTabEnabled(tab_name)) {
      dataTable_vMachines = $("#datatable_vmachines",main_tabs_context).dataTable({
          "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check",6,7,9,11] },
              { "sWidth": "35px", "aTargets": [0] },
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ]
      });

      $('#vms_search').keyup(function(){
        dataTable_vMachines.fnFilter( $(this).val() );
      })

      dataTable_vMachines.on('draw', function(){
        recountCheckboxes(dataTable_vMachines);
      })



      //addElement([
      //    spinner,
      //    '','','','','','','','','','',''],dataTable_vMachines);
      Sunstone.runAction("VM.list");

      //setupCreateVMDialog();
      setVMAutorefresh();
      setupVNC();
      hotpluggingOps();
      setup_vm_network_tab();
      setup_vm_capacity_tab();
      setup_vm_snapshot_tab();

      initCheckAllBoxes(dataTable_vMachines);
      tableCheckboxesListener(dataTable_vMachines);
      infoListener(dataTable_vMachines,'VM.showinfo');

      $('div#vms_tab div.legend_div').hide();
    }
})
