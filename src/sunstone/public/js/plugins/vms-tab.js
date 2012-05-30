/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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
var INCLUDE_URI = "vendor/noVNC/include/";
var VM_HISTORY_LENGTH = 40;

function loadVNC(){
    var script = '<script src="vendor/noVNC/include/vnc.js"></script>';
    document.write(script);
}
loadVNC();

var vm_graphs = [
    { title : tr("CPU"),
      monitor_resources : "CPU",
      humanize_figures : false,
      history_length : VM_HISTORY_LENGTH
    },
    { title : tr("Memory"),
      monitor_resources : "MEMORY",
      humanize_figures : true,
      history_length : VM_HISTORY_LENGTH
    },
    { title : tr("Network transmission"),
      monitor_resources : "NET_TX",
      humanize_figures : true,
      history_length : VM_HISTORY_LENGTH
    },
    { title : tr("Network reception"),
      monitor_resources : "NET_RX",
      humanize_figures : true,
      history_length : VM_HISTORY_LENGTH
    }
];

var vms_tab_content = '\
<h2>'+tr("Virtual Machines")+'</h2>\
<form id="virtualMachine_list" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_vmachines" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">'+tr("All")+'</input></th>\
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Owner")+'</th>\
      <th>'+tr("Group")+'</th>\
      <th>'+tr("Name")+'</th>\
      <th>'+tr("Status")+'</th>\
      <th>'+tr("CPU")+'</th>\
      <th>'+tr("Memory")+'</th>\
      <th>'+tr("Hostname")+'</th>\
      <th>'+tr("IPs")+'</th>\
      <th>'+tr("Start Time")+'</th>\
      <th>'+tr("VNC Access")+'</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyvmachines">\
  </tbody>\
</table>\
<p class="legend">\
'+tr("CPU, Memory and Start time are hidden columns by default. You can get monitoring graphs by clicking on the desired VM and visiting the monitoring information tab (oneacctd needs to be running for this information to be up to date)")+'\
</p>\
<p class="legend">\
'+tr("VNC console requires previous install of the noVNC addon. Check Sunstone documentation for more information.")+'\
</p>\
</form>';

var create_vm_tmpl ='<form id="create_vm_form" action="">\
  <fieldset>\
        <div>\
           <div>\
             <label for="vm_name">'+tr("VM Name")+':</label>\
             <input type="text" name="vm_name" id="vm_name" />\
             <div class="tip">'+tr("Defaults to template name when emtpy")+'.</div>\
           </div>\
           <div>\
             <label for="template_id">'+tr("Select template")+':</label>\
             <select id="template_id">\
             </select>\
           </div>\
           <div>\
             <label for="vm_n_times">'+tr("Deploy # VMs")+':</label>\
             <input type="text" name="vm_n_times" id="vm_n_times" value="1">\
             <div class="tip">'+tr("You can use the wildcard %i. When creating several VMs, %i will be replaced with a different number starting from 0 in each of them")+'.</div>\
           </div>\
        </div>\
        </fieldset>\
        <fieldset>\
        <div class="form_buttons">\
           <button class="button" id="create_vm_proceed" value="VM.create">'+tr("Create")+'</button>\
           <button class="button" type="reset" value="reset">'+tr("Reset")+'</button>\
        </div>\
</fieldset>\
</form>';

var update_vm_tmpl =
   '<form action="javascript:alert(\'js error!\');">\
         <h3 style="margin-bottom:10px;">'+tr("Please, choose and modify the virtual machine you want to update")+':</h3>\
            <fieldset style="border-top:none;">\
                 <label for="vm_template_update_select">'+tr("Select a VM")+':</label>\
                 <select id="vm_template_update_select" name="vm_template_update_select"></select>\
                 <div class="clear"></div>\
                 <div>\
                   <table class="permissions_table" style="padding:0 10px;">\
                     <thead><tr>\
                         <td style="width:130px">'+tr("Permissions")+':</td>\
                         <td style="width:40px;text-align:center;">'+tr("Use")+'</td>\
                         <td style="width:40px;text-align:center;">'+tr("Manage")+'</td>\
                         <td style="width:40px;text-align:center;">'+tr("Admin")+'</td></tr></thead>\
                     <tr>\
                         <td>'+tr("Owner")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="vm_owner_u" class="owner_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vm_owner_m" class="owner_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vm_owner_a" class="owner_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Group")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="vm_group_u" class="group_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vm_group_m" class="group_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vm_group_a" class="group_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Other")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="vm_other_u" class="other_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vm_other_m" class="other_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="vm_other_a" class="other_a" /></td>\
                     </tr>\
                   </table>\
                 </div>\
<!--                 <label for="vnet_template_update_textarea">'+tr("Template")+':</label>\
                 <div class="clear"></div>\
                 <textarea id="vnet_template_update_textarea" style="width:100%; height:14em;"></textarea>\
-->\
            </fieldset>\
            <fieldset>\
                 <div class="form_buttons">\
                    <button class="button" id="vm_template_update_button" value="VM.update_template">\
                       '+tr("Update")+'\
                    </button>\
                 </div>\
            </fieldset>\
</form>';

var vmachine_list_json = {};
var dataTable_vMachines;
var $create_vm_dialog;
var $saveas_vm_dialog;
var $vnc_dialog;
var rfb;

var vm_actions = {
    "VM.create" : {
        type: "custom",
        call: function(id,name) {
            Sunstone.runAction("Template.instantiate",id,name);
            Sunstone.runAction("VM.list");
        },
        callback: addVMachineElement,
        error: onError
    },

    "VM.create_dialog" : {
        type: "custom",
        call: popUpCreateVMDialog,
    },

    "VM.update_dialog" : {
        type: "custom",
        call: popUpVMTemplateUpdateDialog
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
        },
    },

    "VM.autorefresh" : {
        type: "custom",
        call : function() {
            OpenNebula.VM.list({timeout: true, success: updateVMachinesView,error: onError});
        },
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

    "VM.livemigrate" : {
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

    "VM.restart" : {
        type: "multiple",
        call: OpenNebula.VM.restart,
        callback: vmShow,
        elements: vmElements,
        error: onError,
        notify: true
    },

    "VM.resubmit" : {
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

    "VM.saveasmultiple" : {
        type: "custom",
        call: function(){
            var elems = vmElements();
            popUpSaveasDialog(elems);
        }
    },

    "VM.saveas" : {
        type: "single",
        call: OpenNebula.VM.saveas,
        callback: vmShow,
        error:onError
    },

    "VM.saveas_disks" : {
        type: "single",
        call: OpenNebula.VM.show,
        callback: saveasDisksCallback,
        error: onError
    },

    "VM.shutdown" : {
        type: "multiple",
        call: OpenNebula.VM.shutdown,
        callback: vmShow,
        elements: vmElements,
        error: onError,
        notify: true
    },

    "VM.cancel" : {
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
                colored_log += line + "\n";
            }

            $('#vm_log_tab').html('<pre>'+colored_log+'</pre>')
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

    "VM.stopvnc" : {
        type: "single",
        call: OpenNebula.VM.stopvnc,
        error: onError,
        notify: true
    },

    "VM.monitor" : {
        type: "monitor",
        call : OpenNebula.VM.monitor,
        callback: function(req,response) {
            var info = req.request.data[0].monitor;
            plot_graph(response,'#vm_monitoring_tab',
                       'vm_monitor_',info);
        },
        error: vmMonitorError
    },
    "VM.monitor_all" : {
        type: "monitor_global",
        call: OpenNebula.VM.monitor_all,
        callback: function(req,response) {
            var info = req.request.data[0].monitor;
            plot_global_graph(response,info);
        },
        error: onError
    },
    "VM.chown" : {
        type: "multiple",
        call: OpenNebula.VM.chown,
        callback: vmShow,
        elements: vmElements,
        error: onError,
        notify: true
    },
    "VM.chgrp" : {
        type: "multiple",
        call: OpenNebula.VM.chgrp,
        callback: vmShow,
        elements: vmElements,
        error: onError,
        notify: true
    },
    "VM.fetch_permissions" : {
        type: "single",
        call: OpenNebula.VM.show,
        callback : function(request, vm_json){
            var dialog = $('#vm_template_update_dialog form');
            var vm = vm_json.VM;
            setPermissionsTable(vm,dialog);
        },
        error: onError
    },
    "VM.chmod" : {
        type: "single",
        call: OpenNebula.VM.chmod,
        error: onError,
        notify: true
    },
};



var vm_buttons = {
    "VM.refresh" : {
        type: "image",
        text: tr("Refresh list"),
        img: "images/Refresh-icon.png"
    },

    "VM.create_dialog" : {
        type: "action",
        text: tr("+ New"),
        alwaysActive: true
    },

    "VM.update_dialog" : {
        type: "action",
        text: tr("Update properties"),
        alwaysActive: true
    },

    "VM.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: users_sel,
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },

    "VM.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: groups_sel,
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },

    "VM.shutdown" : {
        type: "confirm",
        text: tr("Shutdown"),
        tip: tr("This will initiate the shutdown process in the selected VMs")
    },

    "action_list" : {
        type: "select",
        actions: {
            "VM.deploy" : {
                type: "confirm_with_select",
                text: tr("Deploy"),
                tip: tr("This will deploy the selected VMs on the chosen host"),
                select: hosts_sel,
                condition: mustBeAdmin
            },
            "VM.migrate" : {
                type: "confirm_with_select",
                text: tr("Migrate"),
                tip: tr("This will migrate the selected VMs to the chosen host"),
                select: hosts_sel,
                condition: mustBeAdmin

            },
            "VM.livemigrate" : {
                type: "confirm_with_select",
                text: tr("Live migrate"),
                tip: tr("This will live-migrate the selected VMs to the chosen host"),
                select: hosts_sel,
                condition: mustBeAdmin
            },
            "VM.hold" : {
                type: "confirm",
                text: tr("Hold"),
                tip: tr("This will hold selected pending VMs from being deployed")
            },
            "VM.release" : {
                type: "confirm",
                text: tr("Release"),
                tip: tr("This will release held machines")
            },
            "VM.suspend" : {
                type: "confirm",
                text: tr("Suspend"),
                tip: tr("This will suspend selected machines")
            },
            "VM.resume" : {
                type: "confirm",
                text: tr("Resume"),
                tip: tr("This will resume selected stopped or suspended VMs")
            },
            "VM.stop" : {
                type: "confirm",
                text: tr("Stop"),
                tip: "This will stop selected VMs"
            },
            "VM.restart" : {
                type: "confirm",
                text: tr("Restart"),
                tip: tr("This will redeploy selected VMs (in UNKNOWN or BOOT state)")
            },
            "VM.resubmit" : {
                type: "confirm",
                text: tr("Resubmit"),
                tip: tr("This will resubmits VMs to PENDING state")
            },
            "VM.reboot" : {
                type : "confirm",
                text: tr("Reboot"),
                tip: tr("This will send a reboot action to running VMs")
            },
            "VM.saveasmultiple" : {
                type: "action",
                text: tr("Save as")
            },
            "VM.cancel" : {
                type: "confirm",
                text: tr("Cancel"),
                tip: tr("This will cancel selected VMs")
            }
        }
    },

    "VM.delete" : {
        type: "confirm",
        text: tr("Delete"),
        tip: tr("This will delete the selected VMs from the database")
    }
}

var vm_info_panel = {
    "vm_info_tab" : {
        title: tr("Virtual Machine information"),
        content: ""
    },
    "vm_template_tab" : {
        title: tr("VM template"),
        content: ""
    },
    "vm_log_tab" : {
        title: tr("VM log"),
        content: ""
    },
    "vm_history_tab" : {
        title: tr("History information"),
        content: "",
    }
};

var vms_tab = {
    title: tr("Virtual Machines"),
    content: vms_tab_content,
    buttons: vm_buttons,
    tabClass: 'subTab',
    parentTab: 'vres_tab'
};

Sunstone.addActions(vm_actions);
Sunstone.addMainTab('vms_tab',vms_tab);
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

    $.each(vmachine_list,function(){
        vmachine_list_array.push( vMachineElementArray(this));
    });

    updateView(vmachine_list_array,dataTable_vMachines);
    updateDashboard("vms",vmachine_list);
    updateVResDashboard("vms",vmachine_list);
};

function generateHistoryTable(vm){
    var html = ' <table id="vm_history_table" class="info_table" style="width:80%">\
                   <thead>\
                     <tr>\
                         <th>'+tr("Sequence")+'</th>\
                         <th>'+tr("Hostname")+'</th>\
                         <th>'+tr("Reason")+'</th>\
                         <th>'+tr("State change time")+'</th>\
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
                       <td style="width:20%">'+history[i].SEQ+'</td>\
                       <td style="width:20%">'+history[i].HOSTNAME+'</td>\
                       <td style="width:16%">'+OpenNebula.Helper.resource_state("VM_MIGRATE_REASON",parseInt(history[i].REASON, 10))+'</td>\
                       <td style="width:16%">'+pretty_time(history[i].STIME)+'</td>\
                       <td style="width:16%">'+pretty_time_runtime(dtime)+'</td>\
                       <td style="width:16%">'+pretty_time_runtime(dtime2)+'</td>\
                       <td></td>\
                      </tr>'
    };
    html += '</tbody>\
                </table>';
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

    var info_tab = {
        title : tr("VM information"),
        content:
        '<table id="info_vm_table" class="info_table">\
            <thead>\
              <tr><th colspan="2">'+tr("Virtual Machine information")+' - '+vm_info.NAME+'</th></tr>\
            </thead>\
            <tbody>\
              <tr>\
                 <td class="key_td">'+tr("ID")+'</td>\
                 <td class="value_td">'+vm_info.ID+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Name")+'</td>\
                 <td class="value_td">'+vm_info.NAME+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Owner")+'</td>\
                 <td class="value_td">'+vm_info.UNAME+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Group")+'</td>\
                 <td class="value_td">'+vm_info.GNAME+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("State")+'</td>\
                 <td class="value_td">'+tr(vm_state)+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("LCM State")+'</td>\
                 <td class="value_td">'+tr(OpenNebula.Helper.resource_state("vm_lcm",vm_info.LCM_STATE))+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Hostname")+'</td>\
              <td class="value_td">'+ hostname +'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Start time")+'</td>\
                 <td class="value_td">'+pretty_time(vm_info.STIME)+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Deploy ID")+'</td>\
                 <td class="value_td">'+(typeof(vm_info.DEPLOY_ID) == "object" ? "-" : vm_info.DEPLOY_ID)+'</td>\
              </tr>\
              <tr><td class="key_td">Permissions</td><td></td></tr>\
              <tr>\
                <td class="key_td">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Owner")+'</td>\
                <td class="value_td" style="font-family:monospace;">'+ownerPermStr(vm_info)+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Group")+'</td>\
                <td class="value_td" style="font-family:monospace;">'+groupPermStr(vm_info)+'</td>\
              </tr>\
              <tr>\
                <td class="key_td"> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Other")+'</td>\
                <td class="value_td" style="font-family:monospace;">'+otherPermStr(vm_info)+'</td>\
              </tr>\
                 </tbody>\
                </table>\
                <table id="vm_monitoring_table" class="info_table">\
                   <thead>\
                     <tr><th colspan="2">'+tr("Monitoring information")+'</th></tr>\
                   </thead>\
                   <tbody>\
                      <tr>\
                        <td class="key_td">'+tr("Net_TX")+'</td>\
                        <td class="value_td">'+vm_info.NET_TX+'</td>\
                      </tr>\
                      <tr>\
                        <td class="key_td">'+tr("Net_RX")+'</td>\
                        <td class="value_td">'+vm_info.NET_RX+'</td>\
                      </tr>\
                      <tr>\
                        <td class="key_td">'+tr("Used Memory")+'</td>\
                        <td class="value_td">'+humanize_size(vm_info.MEMORY)+'</td>\
                      </tr>\
                      <tr>\
                        <td class="key_td">'+tr("Used CPU")+'</td>\
                        <td class="value_td">'+vm_info.CPU+'</td>\
                      </tr>\
                      <tr>\
                        <td class="key_td">'+tr("VNC Session")+'</td>\
                        <td class="value_td">'+vncIcon(vm_info)+'</td>\
                      </tr>\
                    </tbody>\
                </table>'
    };

    var template_tab = {
        title: tr("VM Template"),
        content:
        '<table id="vm_template_table" class="info_table" style="width:80%">\
               <thead><tr><th colspan="2">'+tr("VM template")+'</th></tr></thead>'+
                prettyPrintJSON(vm_info.TEMPLATE)+
            '</table>'
    };

    var log_tab = {
        title: tr("VM log"),
        content: '<div>'+spinner+'</div>'
    };

    var monitoring_tab = {
        title: tr("Monitoring information"),
        content: generateMonitoringDivs(vm_graphs,"vm_monitor_")
    };

    var history_tab = {
        title: tr("History information"),
        content: generateHistoryTable(vm_info),
    };

    Sunstone.updateInfoPanelTab("vm_info_panel","vm_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_template_tab",template_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_log_tab",log_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_history_tab",history_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_monitoring_tab",monitoring_tab);

    //Pop up the info panel and asynchronously get vm_log and stats
    Sunstone.popUpInfoPanel("vm_info_panel");
    Sunstone.runAction("VM.log",vm_info.ID);
    for (var i=0; i<vm_graphs.length; i++){
        Sunstone.runAction("VM.monitor",vm_info.ID,vm_graphs[i]);
    };
}

// Sets up the create-template dialog and all the processing associated to it,
// which is a lot.
function setupCreateVMDialog(){

    dialogs_context.append('<div title=\"'+tr("Create Virtual Machine")+'\" id="create_vm_dialog"></div>');
    //Insert HTML in place
    $create_vm_dialog = $('#create_vm_dialog')
    var dialog = $create_vm_dialog;
    dialog.html(create_vm_tmpl);

    //Prepare jquery dialog
    dialog.dialog({
        autoOpen: false,
        modal: true,
        width: 400
    });

    $('button',dialog).button();
    setupTips(dialog);

    $('#create_vm_form',dialog).submit(function(){
        var vm_name = $('#vm_name',this).val();
        var template_id = $('#template_id',this).val();
        var n_times = $('#vm_n_times',this).val();
        var n_times_int=1;

        if (!template_id.length){
            notifyError(tr("You have not selected a template"));
            return false;
        };

        if (n_times.length){
            n_times_int=parseInt(n_times,10);
        };

        if (!vm_name.length){
            vm_name = $('#template_id option:selected',this).text();
        };

        if (vm_name.indexOf("%i") == -1){ //no wildcard
            for (var i=0; i< n_times_int; i++){
                Sunstone.runAction("Template.instantiate",template_id,vm_name);
            };
        } else { //wildcard present: replace wildcard
            var name = "";
            for (var i=0; i< n_times_int; i++){
                name = vm_name.replace(/%i/gi,i);
                Sunstone.runAction("Template.instantiate",template_id,name);
            };
        };

        Sunstone.runAction("VM.list");
        $create_vm_dialog.dialog('close');
        return false;
    });
}

// Open creation dialog
function popUpCreateVMDialog(){
    $create_vm_dialog.dialog('open');
}

//Prepares a dialog to saveas a VM
function setupSaveasDialog(){
    //Append to DOM
    dialogs_context.append('<div id="saveas_vm_dialog" title=\"'+tr("VM Save As")+'\"></div>');
    $saveas_vm_dialog = $('#saveas_vm_dialog',dialogs_context);
    var dialog = $saveas_vm_dialog;

    //Put HTML in place
    dialog.html('\
        <form id="saveas_vm_form" action="javascript:alert(\'js error!\');">\
            <div id="saveas_tabs">\
            </div>\
            <div class="form_buttons">\
                <button id="vm_saveas_proceed" value="">'+tr("OK")+'</button>\
                <button id="vm_saveas_cancel" value="">'+tr("Cancel")+'</button>\
            </div>\
            </fieldset>\
       </form>');

    dialog.dialog({
        autoOpen:false,
        width:600,
        modal:true,
        height:350,
        resizable:true,
    });

    $('#saveas_vm_form',dialog).submit(function(){
        var elems = $('#saveas_tabs div.saveas_tab',this);
        var args = [];
        $.each(elems,function(){
            var id = $('#vm_id',this).text();
            var disk_id = $('#vm_disk_id',this).val();
            var image_name = $('#image_name',this).val();
            var type = $('#image_type',this).val();

            if (!id.length || !disk_id.length || !image_name.length) {
                notifyError(tr("Skipping VM ")+id+". "+
                            tr("No disk id or image name specified"));
            }
            else {
                var obj = {
                    disk_id : disk_id,
                    image_name : image_name,
                    type: type
                };
                args.push(id);
                Sunstone.runAction("VM.saveas",id,obj);
            }
        });
        if (args.length > 0){
            notifySubmit("VM.saveas",args);
        }

        $saveas_vm_dialog.dialog('close');
        return false;
    });

    $('#vm_saveas_cancel',dialog).click(function(){
        $saveas_vm_dialog.dialog('close');
        return false;
    });

}

function popUpSaveasDialog(elems){
    var dialog = $saveas_vm_dialog;
    $('#saveas_tabs',dialog).tabs('destroy');
    $('#saveas_tabs',dialog).empty();
    $('#saveas_tabs',dialog).html('<ul></ul>');

    $.each(elems,function(){
        var li = '<li><a href="#saveas_tab_'+this+'">VM '+this+'</a></li>'
        $('#saveas_tabs ul',dialog).append(li);
        var tab = '<div class="saveas_tab" id="saveas_tab_'+this+'">\
        <div id="vm_id_text">'+tr("Saveas for VM with ID")+' <span id="vm_id">'+this+'</span></div>\
            <fieldset>\
            <div>\
                <label for="vm_disk_id">'+tr("Select disk")+':</label>\
                <select id="vm_disk_id" name="vm_disk_id">\
                    <option value="">'+tr("Retrieving")+'...</option>\
                </select>\
            </div>\
            <div>\
                <label for="image_name">'+tr("Image name")+':</label>\
                <input type="text" id="image_name" name="image_name" value="" />\
            </div>\
            <div>\
                <label for="img_attr_value">'+tr("Type")+':</label>\
                <select id="image_type" name="image_type">\
                    <option value="">'+tr("Default (current image type)")+'</option>\
                    <option value="os">'+tr("OS")+'</option>\
                    <option value="datablock">'+tr("Datablock")+'</option>\
                    <option value="cdrom">'+tr("CD-ROM")+'</option>\
                </select>\
            </div>\
            </fieldset>\
        </div>';
        $('#saveas_tabs',dialog).append(tab);
        Sunstone.runAction("VM.saveas_disks",this);
    });
    $('#saveas_tabs',dialog).tabs();
    $('button',dialog).button();
    dialog.dialog('open');
}

function saveasDisksCallback(req,response){
    var vm_info = response.VM;
    var id=vm_info.ID;
    var select="";

    var gen_option = function(id, name, source){
        if (name){
            return '<option value="'+id+'">'+name+" ("+tr("disk id")+"): "+id+')</option>';
        }
        else {
            return '<option value="'+id+'">'+source+" ("+tr("disk id")+"): "+id+')</option>';
        }
    }

    var disks = vm_info.TEMPLATE.DISK;
    if (!disks) { select = '<option value="">'+tr("No disks defined")+'</option>';}
    else if (disks.constructor == Array) //several disks
    {
        for (var i=0;i<disks.length;i++){
            select += gen_option(disks[i].DISK_ID,disks[i].IMAGE,disks[i].SOURCE);
        }
    } else {
        select+= gen_option(disks.DISK_ID,disks.IMAGE,disks.SOURCE);
    }
    //introduce options in the right tab
    $('#saveas_tabs #saveas_tab_'+id+' #vm_disk_id',$saveas_vm_dialog).html(select);

};


function setupVMTemplateUpdateDialog(){
    //Append to DOM
    dialogs_context.append('<div id="vm_template_update_dialog" title="'+tr("Update VM properties")+'"></div>');
    var dialog = $('#vm_template_update_dialog',dialogs_context);

    //Put HTML in place
    dialog.html(update_vm_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    //Convert into jQuery
    dialog.dialog({
        autoOpen:false,
        width:500,
        modal:true,
        height:height,
        resizable:true,
    });

    $('button',dialog).button();

    $('#vm_template_update_select',dialog).change(function(){
        var id = $(this).val();
        $('.permissions_table input',dialog).removeAttr('checked');
        $('.permissions_table',dialog).removeAttr('update');
        if (id && id.length){
            var dialog = $('#vm_template_update_dialog');
            Sunstone.runAction("VM.fetch_permissions",id);
        };
    });

    $('.permissions_table input',dialog).change(function(){
        $(this).parents('table').attr('update','update');
    });

    $('form',dialog).submit(function(){
        var dialog = $(this);
        var id = $('#vm_template_update_select',dialog).val();
        if (!id || !id.length) {
            $(this).parents('#vm_template_update_dialog').dialog('close');
            return false;
        };

        var permissions = $('.permissions_table',dialog);
        if (permissions.attr('update')){
            var perms = {
                octet : buildOctet(permissions)
            };
            Sunstone.runAction("VM.chmod",id,perms);
        };

        $(this).parents('#vm_template_update_dialog').dialog('close');
        return false;
    });
};

function popUpVMTemplateUpdateDialog(){
    var select = makeSelectOptions(dataTable_vMachines,
                                   1,//id_col
                                   4,//name_col
                                   [],
                                   []
                                  );
    var sel_elems = getSelectedNodes(dataTable_vMachines);


    var dialog =  $('#vm_template_update_dialog');
    $('#vm_template_update_select',dialog).html(select);
    $('#vm_template_update_textarea',dialog).val("");
    $('.permissions_table input',dialog).removeAttr('checked');
    $('.permissions_table',dialog).removeAttr('update');

    if (sel_elems.length >= 1){ //several items in the list are selected
        //grep them
        var new_select= sel_elems.length > 1? '<option value="">Please select</option>' : "";
        $('option','<select>'+select+'</select>').each(function(){
            var val = $(this).val();
            if ($.inArray(val,sel_elems) >= 0){
                new_select+='<option value="'+val+'">'+$(this).text()+'</option>';
            };
        });
        $('#vm_template_update_select',dialog).html(new_select);
        if (sel_elems.length == 1) {
            $('#vm_template_update_select option',dialog).attr('selected','selected');
            $('#vm_template_update_select',dialog).trigger("change");
        };
    };

    dialog.dialog('open');
    return false;
};

//Prepares autorefresh
function setVMAutorefresh(){
     setInterval(function(){
         var checked = $('input.check_item:checked',dataTable_vMachines);
         var filter = $("#datatable_vmachines_filter input",
                        dataTable_vMachines.parents('#datatable_vmachines_wrapper')).attr('value');
         if (!checked.length && !filter.length){
             Sunstone.runAction("VM.autorefresh");
         };
     },INTERVAL+someTime());
}


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
    dialogs_context.append('<div id="vnc_dialog" title=\"'+tr("VNC connection")+'\"></div>');
    $vnc_dialog = $('#vnc_dialog',dialogs_context);
    var dialog = $vnc_dialog;

    dialog.html('\
      <div id="VNC_status_bar" class="VNC_status_bar" style="margin-top: 0px;">\
         <table border=0 width="100%"><tr>\
            <td><div id="VNC_status">'+tr("Loading")+'</div></td>\
            <td width="1%"><div id="VNC_buttons">\
            <input type=button value="Send CtrlAltDel"\
                   id="sendCtrlAltDelButton">\
            </div></td>\
          </tr></table>\
        </div>\
        <canvas id="VNC_canvas" width="640px" height="20px">\
            '+tr("Canvas not supported.")+'\
        </canvas>\
');

    dialog.dialog({
        autoOpen:false,
        width:750,
        modal:true,
        height:500,
        resizable:true,
        closeOnEscape: false
    });

    $('#sendCtrlAltDelButton',dialog).click(function(){
        rfb.sendCtrlAltDel();
        return false;
    });

    dialog.bind( "dialogclose", function(event, ui) {
        var id = $vnc_dialog.attr('vm_id');
        rfb.disconnect();
        Sunstone.runAction("VM.stopvnc",id);
    });

    $('.vnc').live("click",function(){
        //Which VM is it?
        var id = $(this).attr('vm_id');
        //Set attribute to dialog
        $vnc_dialog.attr('vm_id',id);
        //Request proxy server start
        Sunstone.runAction("VM.startvnc",id);
        return false;
    });
}

function vncCallback(request,response){
    rfb = new RFB({'target':       $D('VNC_canvas'),
                   'encrypt':      $('#config_table #wss_checkbox').is(':checked'),
                   'true_color':   true,
                   'local_cursor': true,
                   'shared':       true,
                   'updateState':  updateVNCState});
    //fetch things from clicked element host - port - password
    vnc_port = response["port"];

    //Hopefully this is returning sunstone server address, where
    //the proxy is running
    vnc_host = window.location.hostname;
    vnc_pw = response["password"];

    setTimeout(function(){
        rfb.connect(vnc_host, vnc_port, vnc_pw);
        $vnc_dialog.dialog('open');
    },4000);

}

function vncIcon(vm){
    var graphics = vm.TEMPLATE.GRAPHICS;
    var state = OpenNebula.Helper.resource_state("vm_lcm",vm.LCM_STATE);
    var gr_icon;
    if (graphics && graphics.TYPE == "vnc" && state == tr("RUNNING")){
        gr_icon = '<a class="vnc" href="#" vm_id="'+vm.ID+'">';
        gr_icon += '<img src="images/vnc_on.png" alt=\"'+tr("Open VNC Session")+'\" /></a>';
    }
    else {
        gr_icon = '<img src="images/vnc_off.png" alt=\"'+tr("VNC Disabled")+'\" />';
    }
    return gr_icon;
}

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

    dataTable_vMachines = $("#datatable_vmachines",main_tabs_context).dataTable({
        "bJQueryUI": true,
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "bSortClasses": false,
        "sPaginationType": "full_numbers",
        "bAutoWidth":false,
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0,6,7] },
            { "sWidth": "35px", "aTargets": [1,11] },
            { "sWidth": "150px", "aTargets": [5,10] },
            { "sWidth": "100px", "aTargets": [2,3,9] },
            { "bVisible": false, "aTargets": [6,7,10]}
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    dataTable_vMachines.fnClearTable();
    addElement([
        spinner,
        '','','','','','','','','','',''],dataTable_vMachines);
    Sunstone.runAction("VM.list");

    setupCreateVMDialog();
    setupVMTemplateUpdateDialog();
    setupSaveasDialog();
    setVMAutorefresh();
    setupVNC();

    initCheckAllBoxes(dataTable_vMachines);
    tableCheckboxesListener(dataTable_vMachines);
    infoListener(dataTable_vMachines,'VM.showinfo');
})