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
//var VM_HISTORY_LENGTH = 40;


function loadVNC(){
    var script = '<script src="vendor/noVNC/include/vnc.js"></script>';
    document.write(script);
}
loadVNC();
var vnc_enable=false;
var use_wss=false;

/*
var vm_graphs = [
    { title : tr("CPU"),
      monitor_resources : "cpu_usage",
      humanize_figures : false,
      history_length : VM_HISTORY_LENGTH
    },
    { title : tr("Memory"),
      monitor_resources : "mem_usage",
      humanize_figures : true,
      history_length : VM_HISTORY_LENGTH
    },
    { title : tr("Network transmission"),
      monitor_resources : "net_tx",
      humanize_figures : true,
      history_length : VM_HISTORY_LENGTH
    },
    { title : tr("Network reception"),
      monitor_resources : "net_rx",
      humanize_figures : true,
      history_length : VM_HISTORY_LENGTH
    }
];
*/


var vms_tab_content =
'<form id="virtualMachine_list" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_vmachines" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">'+tr("All")+'</input></th>\
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Name")+' / '+tr("State")+'</th>\
      <th>'+tr("IP")+'</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyvmachines">\
  </tbody>\
</table>\
</form>';

var create_vm_tmpl ='<form id="create_vm_form" action="">\
        <fieldset>\
           <label for="vm_name">'+tr("VM Name")+':</label>\
           <input type="text" name="vm_name" id="vm_name" /><br />\
        </fieldset>\
        <fieldset>\
           <label for="instance_type">'+tr("Instance type")+':</label>\
           <select id="instance_type">\
             <option value="">'+tr("Loading")+'...</option>\
           </select><br />\
        </fieldset>\
        <fieldset>\
           <label for="disk">'+tr("Images")+':</label>\
           <select type="text" id="disk_box" name="disk" multiple>\
           </select>\
        </fieldset>\
        <fieldset>\
           <label for="network">'+tr("Networks")+':</label>\
           <select type="text" id="network_box" name="network" multiple>\
           </select>\
        </fieldset>\
        <fieldset>\
           <div>\
             <label for="vm_n_times">'+tr("Create # VMs")+':</label>\
             <input type="text" name="vm_n_times" id="vm_n_times" value="1">\
             <div class="tip">'+tr("You can use the wildcard &#37;i. When creating several VMs, &#37;i will be replaced with a different number starting from 0 in each of them")+'.</div>\
           </div>\
        </fieldset>\
          <div class="form_buttons">\
            <button type="button" class="vm_close_dialog_link">'+tr("Close")+'</button>\
            <button type="submit" class="button" id="create_vm" value="VM.create">'+tr("Create")+'</button>\
            <!--<button class="button" type="reset" id="reset_vm" value="reset">Reset</button>-->\
          </div>\
        </div>\
</form>';

var vm_dashboard = '<div class="dashboard_p">\
<img src="images/one-compute.png" alt="one-compute" />'
+ compute_dashboard_html +
'</div>';


var dataTable_vMachines;
var $create_vm_dialog;
var $saveas_vm_dialog;
var $vnc_dialog;
var rfb;

var vm_actions = {
    "VM.create" : {
        type: "create",
        call: OCCI.VM.create,
        callback: addVMachineElement,
        error: onError,
        notify: true
    },

    "VM.create_dialog" : {
        type: "custom",
        call: popUpCreateVMDialog
    },

    "VM.list" : {
        type: "list",
        call: OCCI.VM.list,
        callback: updateVMachinesView,
        error: onError
    },

    "VM.show" : {
        type: "single",
        call: OCCI.VM.show,
        callback: updateVMachineElement,
        error: onError
    },

    "VM.showinfo" : {
        type: "single",
        call: OCCI.VM.show,
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
            OCCI.VM.list({timeout: true, success: updateVMachinesView,error: onError});
        }
    },

    "VM.suspend" : {
        type: "multiple",
        call: OCCI.VM.suspend,
        callback: updateVMachineElement,
        elements: vmElements,
        error: onError,
        notify: true
    },

    "VM.resume" : {
        type: "multiple",
        call: OCCI.VM.resume,
        callback: updateVMachineElement,
        elements: vmElements,
        error: onError,
        notify: true
    },

    "VM.stop" : {
        type: "multiple",
        call: OCCI.VM.stop,
        callback: updateVMachineElement,
        elements: vmElements,
        error: onError,
        notify: true
    },

    "VM.done" : {
        type: "multiple",
        call: OCCI.VM.done,
        callback: deleteVMachineElement,
        elements: vmElements,
        error: onError,
        notify: true
    },

    "VM.shutdown" : {
        type: "multiple",
        call: OCCI.VM.shutdown,
        callback: updateVMachineElement,
        elements: vmElements,
        error: onError,
        notify: true
    },

    "VM.reboot" : {
        type: "multiple",
        call: OCCI.VM.reboot,
        callback: updateVMachineElement,
        elements: vmElements,
        error: onError,
        notify: true
    },

    "VM.reset" : {
        type: "multiple",
        call: OCCI.VM.reset,
        callback: updateVMachineElement,
        elements: vmElements,
        error: onError,
        notify: true
    },

    "VM.cancel" : {
        type: "multiple",
        call: OCCI.VM.cancel,
        callback: updateVMachineElement,
        elements: vmElements,
        error: onError,
        notify: true
    },

    "VM.saveas" : {
        type: "single",
        call: OCCI.VM.saveas,
        callback: updateVMachineElement,
        error:onError
    },

    "VM.getInstanceTypes" : {
        type: "list",
        call: OCCI.Instance_type.list,
        callback: function(request,response){
            if (response.constructor != Array){
                response = [response];
            };
            var options = "";
            for (var i = 0; i<response.length; i++){
                var type = response[i].INSTANCE_TYPE.name;
                options += '<option value="'+type+'">'+type+'</option>';
            };
            $('#dialog select#instance_type').html(options);
        },
        error: onError
    },

    "VM.startvnc" : {
        type: "single",
        call: OCCI.VM.startvnc,
        callback: vncCallback,
        error: onError,
        notify: true
    },

    "VM.attachdisk" : {
        type: "single",
        call: OCCI.VM.attachdisk,
        callback: updateVMachineElement,
        error: onError,
        notify: true
    },

    "VM.detachdisk" : {
        type: "single",
        call: OCCI.VM.detachdisk,
        callback: function(req,res){
            setTimeout(function(req,res){
                Sunstone.runAction("VM.show", req.request.data[0][0])
            },1000,req);
        },
        error: onError,
        notify: true
    },

    "VM.restart" : {
        type: "multiple",
        call: OCCI.VM.restart,
        callback: updateVMachineElement,
        elements: vmElements,
        error: onError,
        notify: true
    },

    "VM.resubmit" : {
        type: "multiple",
        call: OCCI.VM.resubmit,
        callback: updateVMachineElement,
        elements: vmElements,
        error: onError,
        notify: true
    },

    "VM.poweron" : { //restart alias
        type: "multiple",
        call: OCCI.VM.restart,
        callback: updateVMachineElement,
        elements: vmElements,
        error: onError,
        notify: true
    },

    "VM.poweroff" : {
        type: "multiple",
        call: OCCI.VM.poweroff,
        callback: updateVMachineElement,
        elements: vmElements,
        error: onError,
        notify: true
    }

/*
    "VM.monitor" : {
        type: "monitor",
        call : OCCI.VM.monitor,
        callback: function(req,response) {
            var info = req.request.data[0].monitor;
            plot_graph(response,'#vm_monitoring_tab',
                       'vm_monitor_',info);
        },
        error: vmMonitorError
    },
    "VM.monitor_all" : {
        type: "monitor_global",
        call: OCCI.VM.monitor_all,
        callback: function(req,response) {
            var info = req.request.data[0].monitor;
            plot_global_graph(response,info);
        },
        error: onError
    },
    */
}

var vm_buttons = {
    "VM.refresh" : {
        type: "action",
        text: '<i class="icon-refresh icon-large">',
        alwaysActive: true
    },

    "VM.create_dialog" : {
        type: "action",
        text: tr("+ New"),
        alwaysActive: true
    },

    "VM.shutdown" : {
        type: "confirm",
        text: tr("Shutdown"),
        tip: tr("This will shutdown the selected VMs")
    },

    "action_list" : {
        type: "select",
        actions: {
            "VM.suspend" : {
                type: "confirm",
                text: tr("Suspend"),
                tip: tr("This will suspend the selected VMs")
            },
            "VM.resume" : {
                type: "confirm",
                text: tr("Resume"),
                tip: tr("This will resume the selected VMs in stopped or suspended states")
            },
            "VM.stop" : {
                type: "confirm",
                text: tr("Stop"),
                tip: "This will stop selected VMs"
            },
            "VM.reboot" : {
                type: "confirm",
                text: tr("Reboot"),
                tip: "This will reboot [via acpi] selected VMs"
            },
            "VM.reset" : {
                type: "confirm",
                text: tr("Reset"),
                tip: "This will perform a hard reset on selected VMs"
            },
            "VM.restart" : {
                type: "confirm",
                text: tr("Restart"),
                tip: tr("This will redeploy selected VMs")
            },
            "VM.resubmit" : {
                type: "confirm",
                text: tr("Resubmit"),
                tip: tr("This will resubmits VMs to PENDING state")
            },
            "VM.poweron" : {
                type : "confirm",
                text: tr("Power On"),
                tip: tr("This will start on powered off machines")
            },
            "VM.poweroff" : {
                type : "confirm",
                text: tr("Power Off"),
                tip: tr("This will send a power off signal to running VMs. They can be powered on later.")
            },
            "VM.cancel" : {
                type: "confirm",
                text: tr("Cancel"),
                tip: tr("This will cancel selected VMs")
            },
            "VM.saveasmultiple" : {
                type: "action",
                text: tr("Take snapshot")
            }
        }
    },

    "VM.done" : {
        type: "confirm",
        text: tr("Delete"),
        tip: tr("This will delete the selected VMs from the database")
    }
}

var vm_info_panel = {
    "vm_info_tab" : {
        title: tr("Compute resource"),
        content: ""
    },
    "vm_hotplugging_tab" : {
        title: tr("Disks & Hotplugging"),
        content: ""
    },
    "vm_networks_tab" : {
        title: tr("Networks"),
        content: ""
    }
}

var vm_create_panel = {
    "vm_create_panel" : {
        title: tr("Create Virtual Machine"),
        content: create_vm_tmpl
    }
};

var vms_tab = {
    title: '<i class="icon-cloud"></i>'+tr("Compute"),
    content: vms_tab_content,
    buttons: vm_buttons
}

Sunstone.addActions(vm_actions);
Sunstone.addMainTab('vms_tab',vms_tab);
Sunstone.addInfoPanel('vm_info_panel',vm_info_panel);
Sunstone.addInfoPanel('vm_create_panel',vm_create_panel);


function vmElements() {
    return getSelectedNodes(dataTable_vMachines);
}

// Returns a human readable running time for a VM
function str_start_time(vm){
    return pretty_time(vm.STIME);
}

function ip_str(vm){
    var nic = vm.NIC;
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
    var vm = vm_json.COMPUTE;
    var id,name;

    if (vm.name){
        id = vm.href.split("/");
        id = id[id.length-1];
        name = vm.name;
    }
    else {
        id = vm.ID;
        name = vm.NAME;
    };

    return [
        '<input class="check_item" type="checkbox" id="vm_'+id+'" name="selected_items" value="'+id+'"/>',
        id,
        VMStateBulletStr(vm_json) + name,
        ip_str(vm)
    ];
}


// Callback to refresh a single element from the list
function updateVMachineElement(request, vm_json){
    var id = vm_json.COMPUTE.ID;
    var element = vMachineElementArray(vm_json);
    updateSingleElement(element,dataTable_vMachines,'#vm_'+id)

    //we update this too, even if it is not shown.
    var $hotplugging_tab = $('div#vm_info_panel div#vm_hotplugging_tab');
    $('#hotplugging_form',
      $hotplugging_tab).replaceWith(printDisks(vm_json.COMPUTE));
}

// Callback to delete a single element from the list
function deleteVMachineElement(request){
    deleteElement(dataTable_vMachines,'#vm_'+request.request.data);
}

// Callback to add an element to the list
function addVMachineElement(request,vm_json){
    var id = vm_json.COMPUTE.ID;
    var element = vMachineElementArray(vm_json);
    addElement(element,dataTable_vMachines);
    Sunstone.runAction("VM.show",id);
}


// Callback to refresh the list of Virtual Machines
function updateVMachinesView(request, vmachine_list){
    var vmachine_list_array = [];
    var el_array;

    $.each(vmachine_list,function(){
        el_array = vMachineElementArray(this);
        vmachine_list_array.push(el_array);
    });

    updateView(vmachine_list_array,dataTable_vMachines);
    updateDashboard("vms",vmachine_list);
};

function VMStateBulletStr(vm){
    var vm_state = vm.COMPUTE.STATE;
    var state_html = "";
    switch (vm_state) {
    case "INIT":
    case "PENDING":
    case "HOLD":
    case "STOPPED":
    case "SUSPENDED":
    case "POWEROFF":
        state_html = '<img style="display:inline-block;margin-right:5px;;" src="images/yellow_bullet.png" alt="'+vm_state+'" title="'+vm_state+'" />';
        break;
    case "ACTIVE":
    case "DONE":
        state_html = '<img style="display:inline-block;margin-right:5px;" src="images/green_bullet.png" alt="'+vm_state+'" title="'+vm_state+'"/>';
        break;
    case "FAILED":
        state_html = '<img style="display:inline-block;margin-right:5px;" src="images/red_bullet.png" alt="'+vm_state+'" title="'+vm_state+'"/>';
        break;
    };
    return state_html;
}

// Refreshes the information panel for a VM
function updateVMInfo(request,vm){
    var vm_info = vm.COMPUTE;

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
                 <td class="key_td">'+tr("Instance type")+'</td>\
                 <td class="value_td">'+(vm_info.INSTANCE_TYPE ? vm_info.INSTANCE_TYPE : "--")+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("State")+'</td>\
                 <td class="value_td">'+tr(vm_info.STATE)+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Used CPU")+'</td>\
                 <td class="value_td">'+vm_info.CPU+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Used Memory")+'</td>\
                 <td class="value_td">'+vm_info.MEMORY+'</td>\
              </tr>\
              <tr>\
                 <td class="key_td">'+tr("Launch VNC session")+'</td>\
                 <td class="value_td">'+vncIcon(vm_info)+'</td>\
              </tr>\
            </tbody>\
          </table>\
        <div class="form_buttons">\
           <button class="vm_close_dialog_link"/></div>'
    };

    var hotplugging_tab = {
        title : tr("Disks & Hotplugging"),
        content : printDisks(vm_info)
    };

    var networks_str = '<table class="info_table">\
<thead>\
<tr><th colspan="2">'+tr("Networks information")+'</th></tr>\
</thead><tbody>';

    var networks = vm_info.NIC;
    if (networks){
        if (networks.constructor != Array) // 1lease
            networks = [networks];

        for (var i=0;i<networks.length; i++){
            var net_id = networks[i].NETWORK.href;
            net_id = net_id[net_id.length-1]
            networks_str += '<tr>\
<td class="key_td">'+tr("ID")+'</td>\
<td class="value_td">'+net_id+'</td>\
</tr>\
<tr>\
<td class="key_td">'+tr("Name")+'</td>\
<td class="value_td">'+networks[i].NETWORK.name+'</td>\
</tr>\
<tr>\
<td class="key_td">'+tr("IP")+'</td>\
<td class="value_td">'+networks[i].IP+'</td>\
</tr>\
<tr>\
<td class="key_td">'+tr("MAC")+'</td>\
<td class="value_td">'+networks[i].MAC+'</td>\
</tr><tr><td></td><td></td></tr>';
        };

    } else {
        networks_str += '<tr><td class="key_td">'+
            tr("No networks defined")+'</td><td></td></tr>';
    };

    networks_str += '</tbody></table>\
<div class="form_buttons">\
<button class="vm_close_dialog_link"/></div>';

    var networks_tab = {
        title : tr("Networks"),
        content : networks_str
    };

    /*
    var monitoring_tab = {
        title: tr("Monitoring information"),
        content: generateMonitoringDivs(vm_graphs,"vm_monitor_")
    }
    */

    Sunstone.updateInfoPanelTab("vm_info_panel","vm_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_hotplugging_tab",hotplugging_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_networks_tab",networks_tab);
    //Sunstone.updateInfoPanelTab("vm_info_panel","vm_monitoring_tab",monitoring_tab);

    //Pop up the info panel and asynchronously get vm_log and stats
    Sunstone.popUpInfoPanel("vm_info_panel");
    $('#dialog .vm_close_dialog_link').button({
        text:false,
        icons: { primary: "ui-icon-closethick" }
    });

//    Sunstone.runAction("VM.log",vm_info.ID);
//    for (var i=0; i<vm_graphs.length; i++){
//        Sunstone.runAction("VM.monitor",vm_info.ID,vm_graphs[i]);
//    };
}


// Generates the HTML for the hotplugging tab
// This is a list of disks with the save_as, detach options.
// And a form to attach a new disk to the VM, if it is running.
function printDisks(vm_info){
    var im_sel = makeSelectOptions(dataTable_images,
                                   1, //id col
                                   2, //name col
                                   [],
                                   []
                                  );
    var html ='\
   <form style="display:inline-block;width:100%" id="hotplugging_form" vmid="'+vm_info.ID+'">\
     <table class="info_table">\
       <thead>\
         <tr><th colspan="2">'+tr("Disks information - Save As and Detach")+'</th></tr>\
       </thead>\
       <tbody>\
       ';


    var disks = []
    if ($.isArray(vm_info.DISK))
        disks = vm_info.DISK
    else if (!$.isEmptyObject(vm_info.DISK))
        disks = [vm_info.DISK]

    if (!disks.length){
        html += '<tr id="no_disks_tr"><td class="key_td">\
                   '+tr("No disks to show")+'\
                   </td><td class="value_td"></td></tr>';
    }
    else {

        for (var i = 0; i < disks.length; i++){
            var disk = disks[i];
            html += '<tr disk_id="'+(disk.id)+'"><td class="key_td">';
            html += disk.STORAGE.name + '</td>';
            html += '<td class="value_td">\
'+(vm_info.STATE == "ACTIVE" ? '\
                       <button value="VM.detachdisk" class="detachdisk" style="float:right;color:#555555;height:26px;">'+tr("Detach")+' <i class="icon-remove icon-large"></i></button>\
' : '')+'\
                       <button value="VM.saveas" class="saveas" style="float:right;margin-right:10px;color:#555555;height:26px;">'+tr("Save")+' <i class="icon-download icon-large"></i></button>\
                       <input style="float:right;width:9em;margin-right:10px;margin-top:3px;" type="text" value="saveas_'+vm_info.ID+'_'+disk.STORAGE.name+'" name="saveas_name"></input>\
            <label style="float:right;margin-top:4px;">'+tr("Save_as name")+':</label>'
                +'\
</td>';
        }
    }

    html += '</tbody>\
          </table>';

    // If VM is not RUNNING, then we forget about the attach disk form.
    if (vm_info.STATE != "ACTIVE"){
        html +='</form>';
        return html;
    }

    // Attach disk form
    html += '<table class="info_table">\
       <thead>\
         <tr><th colspan="2">'+tr("Attach disk to running VM")+'</th></tr>\
       </thead>\
       <tbody>\
         <tr><td class="key_td"><label>'+tr("Select image")+':</label></td>\
             <td class="value_td">\
                   <select name="IMAGE_ID" style="width:12em;">\
                   '+im_sel+'\
                   </select>\
             </td>\
         </tr>\
         <tr><td class="key_td"><label>'+tr("Target")+':</label></td>\
             <td class="value_td">\
                <input type="text" name="TARGET" style="width:8em;"></input>\
             </td>\
         </tr>\
        <tr><td class="key_td"></td>\
             <td class="value_td">\
                   <button type="submit" value="VM.attachdisk">'+tr("Attach")+'</button>\
             </td>\
        </tr>\
       </tbody>\
     </table></form>';

    return html;
}

// Listeners to the disks operations (detach, saveas, attach)
function hotpluggingOps(){
    $('button.detachdisk').live('click', function(){
        var b = $(this);
        var vm_id = b.parents('form').attr('vmid');
        var disk_id = b.parents('tr').attr('disk_id');

        Sunstone.runAction('VM.detachdisk', vm_id, disk_id);

        b.html(spinner);
        return false;
    });

    $('button.saveas').live('click', function(){
        var b = $(this);
        var vm_id = b.parents('form').attr('vmid');
        var disk_id = b.parents('tr').attr('disk_id');
        var parent = b.parent();
        var image_name = $('input[name="saveas_name"]',parent).val();
        if (!image_name){
            notifyError('Please provide a name for the new image');
            return false;
        }

        var obj = {
            disk_id : disk_id,
            image_name : image_name,
        };

        Sunstone.runAction('VM.saveas', vm_id, obj);

        b.html(spinner);
        return false;
    });

    $('#hotplugging_form').live('submit',function(){
        var vm_id = $(this).attr('vmid');
        var disk_obj = {};
        var im_id = $('select[name="IMAGE_ID"]',this).val();
        if (!im_id) {
            notifyError(tr("Please select an image to attach"));
            return false;
        }
        var image_id = $('select[name="IMAGE_ID"]',this).val();
        var url = location.protocol + "//" + location.host;
        var href = url + '/storage/' + image_id
        var target = $('input[name="TARGET"]',this).val();

        var str = '<STORAGE href="'+href+'" />';
        if (target) str += '<TARGET>'+target+'</TARGET>';

        Sunstone.runAction("VM.attachdisk", vm_id, str);
        return false;
    });
}

// Open creation dialog
function popUpCreateVMDialog(){
    Sunstone.popUpInfoPanel("vm_create_panel");
    Sunstone.runAction("VM.getInstanceTypes");
    var dialog = $('#dialog');
    $create_vm_dialog = dialog;

    $('button',dialog).button();

    $('#create_vm',dialog).button({
        icons: {
            primary: "ui-icon-check"
        },
        text: true
    });
/*
    $('#reset_vm',dialog).button({
        icons: {
            primary: "ui-icon-scissors"
        },
        text: true
    });
*/
    $('.vm_close_dialog_link',dialog).button({
        icons: {
            primary: "ui-icon-closethick"
        },
        text: true
    });

    setupTips(dialog);

    var net_select = makeSelectOptions(dataTable_vNetworks,
                                       1,//id_col
                                       2,//name_col
                                       [],
                                       [],
                                       true
                                  );

    $('#network_box',dialog).html(net_select);
    $('#network_box option',dialog).each(function(){
        $(this).text('☐ '+$(this).text());
    });


    var image_select = makeSelectOptions(dataTable_images,
                                         1,//id_col
                                         2,//name_col
                                         [],
                                         [],
                                         true);

    $('#disk_box',dialog).html(image_select);
    $('#disk_box option',dialog).each(function(){
        $(this).text('☐ '+$(this).text());
    });


    $('#network_box,#disk_box',dialog).change(function(){
        $(this).val("");
        return false;
    });

    $('#network_box option,#disk_box option',dialog).click(function(){
        var clicked = $(this).attr('clicked');
        if (clicked){//unbold, unmark
            $(this).text($(this).text().replace(/☒/g,'☐'));
            $(this).removeAttr('clicked');
        }
        else {//bold,mark
            $(this).text($(this).text().replace(/☐/g,'☒'));
            $(this).attr('clicked','clicked');
        }
        return false;
    });

    $('#create_vm_form',dialog).submit(function(){
        var vm_name = $('#vm_name',this).val();
        var instance_type = $('#instance_type',this).val();
        var n_times = $('#vm_n_times',this).val();
        var n_times_int=1;

        if (!vm_name.length){
            notifyError("Please specify a name for the virtual machine");
            return false;
        };

        var vm = {
            "NAME" : vm_name,
            "INSTANCE_TYPE" : instance_type
        };

        var href = location.protocol + "//" + location.host;

        var disks = $('#disk_box option[clicked="clicked"]');
        if (disks.length){
            vm["DISK"] = [];

            disks.each(function(){
                var value = $(this).val();
                vm["DISK"].push('<STORAGE href="'+href+'/storage/'+value+'" />');
            });
        };

        var nets = $('#network_box option[clicked="clicked"]');

        if (nets.length){
            vm["NIC"] = [];

            nets.each(function(){
                var value = $(this).val();
                vm["NIC"].push('<NETWORK href="'+href+'/network/'+value+'" />');
            });
        };

        if (n_times.length){
            n_times_int=parseInt(n_times,10);
        };

        if (vm_name.indexOf("%i") == -1){ //no wildcard
            for (var i=0; i< n_times_int; i++){
                Sunstone.runAction("VM.create",vm);
            };
        } else { //wildcard present: replace wildcard
            var name = "";
            for (var i=0; i< n_times_int; i++){
                name = vm_name.replace(/%i/gi,i);
                vm["NAME"] = name;
                Sunstone.runAction("VM.create",vm);
            };
        };

        popUpVMDashboard();
        return false;
    });
}

function  popUpVMDashboard(){
    var count = dataTable_vMachines.fnGetNodes().length;
    popDialog(vm_dashboard);
    $('#dialog .vm_count').text(count);
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
        rfb.disconnect();
    });

    $('.vnc').live("click",function(){
        //Which VM is it?
         var id = $(this).attr('vm_id');
        //Ask server for connection params
        Sunstone.runAction("VM.startvnc",id);
        return false;
    });
}

function vncCallback(request,response){
    rfb = new RFB({'target':       $D('VNC_canvas'),
                   'encrypt':      use_wss,
                   'true_color':   true,
                   'local_cursor': true,
                   'shared':       true,
                   'updateState':  updateVNCState});

    var proxy_host = window.location.hostname;
    var proxy_port = config_response["VNC_PROXY_PORT"];
    var pw = response["password"];
    var token = response["token"];
    var path = '?token='+token;
    rfb.connect(proxy_host, proxy_port, pw, path);
    $vnc_dialog.dialog('open');
}

function vncIcon(vm){
    var gr_icon;
    if (vnc_enable){
        gr_icon = '<a class="vnc" href="#" vm_id="'+vm.ID+'">';
        gr_icon += '<img src="images/vnc_on.png" alt=\"'+tr("Open VNC Session")+'\" /></a>';
    }
    else {
        gr_icon = '<img src="images/vnc_off.png" alt=\"'+tr("VNC Disabled")+'\" />';
    }
    return gr_icon;
}

/*

function vncIcon(vm){
    var graphics = vm.TEMPLATE.GRAPHICS;
    var state = vm.STATE;
    var gr_icon;
    if (graphics && graphics.TYPE == "vnc" && state == "RUNNING"){
        gr_icon = '<a class="vnc" href="#" vm_id="'+vm.ID+'">';
        gr_icon += '<img src="images/vnc_on.png" alt=\"'+tr("Open VNC Session")+'\" /></a>';
    }
    else {
        gr_icon = '<img src="images/vnc_off.png" alt=\"'+tr("VNC Disabled")+'\" />';
    }
    return gr_icon;
}

*/

/*
function vmMonitorError(req,error_json){
    var message = error_json.error.message;
    var info = req.request.data[0].monitor;
    var labels = info.monitor_resources;
    var id_suffix = labels.replace(/,/g,'_');
    var id = '#vm_monitor_'+id_suffix;
    $('#vm_monitoring_tab '+id).html('<div style="padding-left:20px;">'+message+'</div>');
}*/



// At this point the DOM is ready and the sunstone.js ready() has been run.
$(document).ready(function(){

    dataTable_vMachines = $("#datatable_vmachines",main_tabs_context).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sPaginationType": "full_numbers",
        "bAutoWidth":false,
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "35px", "aTargets": [1] },
            { "sWidth": "110px", "aTargets": [3] }
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    dataTable_vMachines.fnClearTable();
    addElement([
        spinner,
        '','',''],dataTable_vMachines);
    Sunstone.runAction("VM.list");

    setVMAutorefresh();
    setupVNC();

    hotpluggingOps();
    initCheckAllBoxes(dataTable_vMachines);
    tableCheckboxesListener(dataTable_vMachines);
    infoListener(dataTable_vMachines,'VM.showinfo');

    $('#li_vms_tab').click(function(){
        popUpVMDashboard();
    });

    $('.vm_close_dialog_link').live("click",function(){
        popUpVMDashboard();
        return false;
    });
})