/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

var vms_tab_content = 
'<form id="virtualMachine_list" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_vmachines" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">All</input></th>\
      <th>ID</th>\
      <th>User</th>\
      <th>Name</th>\
      <th>Status</th>\
      <th>CPU</th>\
      <th>Memory</th>\
      <th>Hostname</th>\
      <th>Start Time</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyvmachines">\
  </tbody>\
</table>\
</form>';

var create_vm_tmpl ='<form id="create_vm_form" action="">\
  <fieldset>\
	<div>\
		<label for="vm_name">VM Name:</label>\
		<input type="text" name="vm_name" id="vm_name" /><br />\
        <label for="template_id">Select template:</label>\
		<select id="template_id">\
        </select>\
	</div>\
	</fieldset>\
	<fieldset>\
	<div class="form_buttons">\
		<button class="button" id="create_vm_proceed" value="VM.create">Create</button>\
		<button class="button" type="reset" value="reset">Reset</button>\
	</div>\
</fieldset>\
</form>';

var vmachine_list_json = {};
var dataTable_vMachines;

var vm_actions = {
    "VM.create" : {
        type: "create",
        call: OpenNebula.VM.create,
        callback: addVMachineElement,
        error: onError,
        notify: true
    },
            
    "VM.create_dialog" : {
        type: "custom",
        call: popUpCreateVMDialog,
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
        callback: function (req) {
            Sunstone.runAction("VM.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_vMachines); },
        error: onError,
        notify: true
    },
            
    "VM.migrate" : {
        type: "multiple",
        call: OpenNebula.VM.migrate,
        callback: function (req) {
            Sunstone.runAction("VM.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_vMachines); },
        error: onError,
        notify: true
    },
            
    "VM.livemigrate" : {
        type: "multiple",
        call: OpenNebula.VM.livemigrate,
        callback: function (req) {
            Sunstone.runAction("VM.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_vMachines); },
        error: onError,
        notify: true
    },
            
    "VM.hold" : {
        type: "multiple",
        call: OpenNebula.VM.hold,
        callback: function (req) {
            Sunstone.runAction("VM.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_vMachines); },
        error: onError,
        notify: true
    },
            
    "VM.release" : {
        type: "multiple",
        call: OpenNebula.VM.release,
        callback: function (req) {
            Sunstone.runAction("VM.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_vMachines); },
        error: onError,
        notify: true
    },
            
    "VM.suspend" : {
        type: "multiple",
        call: OpenNebula.VM.suspend,
        callback: function (req) {
            Sunstone.runAction("VM.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_vMachines); },
        error: onError,
        notify: true
    },
            
    "VM.resume" : {
        type: "multiple",
        call: OpenNebula.VM.resume,
        callback: function (req) {
            Sunstone.runAction("VM.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_vMachines); },
        error: onError,
        notify: true
    },
            
    "VM.stop" : {
        type: "multiple",
        call: OpenNebula.VM.stop,
        callback: function (req) {
            Sunstone.runAction("VM.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_vMachines); },
        error: onError,
        notify: true
    },
            
    "VM.restart" : {
        type: "multiple",
        call: OpenNebula.VM.restart,
        callback: function (req) {
            Sunstone.runAction("VM.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_vMachines); },
        error: onError,
        notify: true
    },
    
    "VM.resubmit" : {
        type: "multiple",
        call: OpenNebula.VM.resubmit,
        callback: function (req) {
            Sunstone.runAction("VM.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_vMachines); },
        error: onError,
        notify: true
    },
    
    "VM.saveasmultiple" : {
        type: "custom",
        call: function(){
            var elems = vm_actions["VM.saveasmultiple"].elements();
            popUpSaveasDialog(elems);
        },
        elements: function() { return getSelectedNodes(dataTable_vMachines); }
    },
    
    "VM.saveas" : {
        type: "custom",
        call: function(obj) {
            OpenNebula.VM.saveas(
                        {data:obj, 
                         success: function (req) {
                                Sunstone.runAction("VM.show",
                                                    req.request.data[0]);
                        },
                         error: onError });
        }
    },
            
    "VM.shutdown" : {
        type: "multiple",
        call: OpenNebula.VM.shutdown,
        callback: function (req) {
            Sunstone.runAction("VM.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_vMachines); },
        error: onError,
        notify: true
    },
            
    "VM.cancel" : {
        type: "multiple",
        call: OpenNebula.VM.cancel,
        callback: function (req) {
            Sunstone.runAction("VM.show",req.request.data[0]);
        },
        elements: function() { return getSelectedNodes(dataTable_vMachines); },
        error: onError,
        notify: true
    },
            
    "VM.delete" : {
        type: "multiple",
        call: OpenNebula.VM.delete,
        callback: deleteVMachineElement,
        elements: function() { return getSelectedNodes(dataTable_vMachines); },
        error: onError,
        notify: true
    },
    
    "VM.log" : {
        type: "single",
        call: OpenNebula.VM.log,
        callback: function(req,res) {
            //after calling VM.log we process the answer
            //update the tab and pop it up again
            var log_lines = res.split("\n");
            var colored_log = '';
            for (line in log_lines){
                line = log_lines[line];
                if (line.match(/\[E\]/)){
                    line = '<span class="vm_log_error">'+line+'</span>'
                }
                colored_log += line + "\n";
            }
            var log_tab = {
                title: "VM log",
                content: '<pre>'+colored_log+'</pre>'
            }
            Sunstone.updateInfoPanelTab("vm_info_panel","vm_log_tab",log_tab);
            Sunstone.popUpInfoPanel("vm_info_panel",0);
            
        },
        error: function(request,error_json){
            $("#vm_log pre").html('');
            onError(request,error_json);
        }
    }
}



var vm_buttons = {
    "VM.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "/images/Refresh-icon.png",
        condition: True
    },
    
    "VM.create_dialog" : {
        type: "action",
        text: "+ New",
        condition: True,
        alwaysActive: true,
        
    },
    
    "VM.shutdown" : {
        type: "confirm",
        text: "Shutdown",
        tip: "This will initiate the shutdown process in the selected VMs",
        condition: True
    },
    
    "action_list" : {
        type: "select",
        actions: {
            "VM.deploy" : {
                type: "confirm_with_select",
                text: "Deploy",
                tip: "This will deploy the selected VMs on the chosen host",
                select: function(){
                            if (hosts_select){return hosts_select}
                            else {return ""}
                        },
                condition: True
            },
            "VM.migrate" : {
                type: "confirm_with_select",
                text: "Migrate",
                tip: "This will migrate the selected VMs to the chosen host",
                select: function(){
                            if (hosts_select){return hosts_select}
                            else {return ""}
                        },
                condition: True
                
            },
            "VM.livemigrate" : {
                type: "confirm_with_select",
                text: "Live migrate",
                tip: "This will live-migrate the selected VMs to the chosen host",
                select: function(){
                            if (hosts_select){return hosts_select}
                            else {return ""}
                        },
                condition: True                
            },
            "VM.hold" : {
                type: "confirm",
                text: "Hold",
                tip: "This will hold selected pending VMs from being deployed",
                condition: True                
            },
            "VM.release" : {
                type: "confirm",
                text: "Release",
                tip: "This will release held machines",
                condition: True  
            },
            "VM.suspend" : {
                type: "confirm",
                text: "Suspend",
                tip: "This will suspend selected machines",
                condition: True                  
            },
            "VM.resume" : {
                type: "confirm",
                text: "Resume",
                tip: "This will resume selected stopped or suspended VMs",
                condition: True                  
            },
            "VM.stop" : {
                type: "confirm",
                text: "Stop",
                tip: "This will stop selected VMs",
                condition: True                  
            },
            "VM.restart" : {
                type: "confirm",
                text: "Restart",
                tip: "This will redeploy selected VMs (in UNKNOWN or BOOT state)",
                condition: True                  
            },
            "VM.resubmit" : {
                type: "confirm",
                text: "Resubmit",
                tip: "This will resubmits VMs to PENDING state",
                condition: True                  
            },
            "VM.saveasmultiple" : {
                type: "action",
                text: "Save as",
                condition: True
            },
            "VM.cancel" : {
                type: "confirm",
                text: "Cancel",
                tip: "This will cancel selected VMs",
                condition: True                  
            }
        },
        condition: True
    },
    
    "VM.delete" : {
        type: "confirm",
        text: "Delete",
        tip: "This will delete the selected VMs from the database",
        condition: True
    }
}

var vm_info_panel = {
    "vm_info_tab" : {
        title: "Virtual Machine information",
        content: ""
    },
    "vm_template_tab" : {
        title: "VM template",
        content: ""
    },
    "vm_log_tab" : {
        title: "VM log",
        content: ""
    }
}

var vms_tab = {
    title: "Virtual Machines",
    content: vms_tab_content,
    buttons: vm_buttons,
    condition: True
}

Sunstone.addActions(vm_actions);
Sunstone.addMainTab('vms_tab',vms_tab);
Sunstone.addInfoPanel('vm_info_panel',vm_info_panel);


// Returns a human readable running time for a VM
function str_start_time(vm){
    return pretty_time(vm.STIME);
}

// Returns an array formed by the information contained in the vm_json
// and ready to be introduced in a dataTable
function vMachineElementArray(vm_json){
	var vm = vm_json.VM;
    var state = OpenNebula.Helper.resource_state("vm",vm.STATE);
    if (state == "ACTIVE") {
        state = OpenNebula.Helper.resource_state("vm_lcm",vm.LCM_STATE);
    }
	return [
			'<input type="checkbox" id="vm_'+vm.ID+'" name="selected_items" value="'+vm.ID+'"/>',
			vm.ID,
			vm.USERNAME ? vm.USERNAME : getUserName(vm.UID),
			vm.NAME,
			state,
			vm.CPU,
			humanize_size(vm.MEMORY),
			vm.HISTORY ? vm.HISTORY.HOSTNAME : "--",
			str_start_time(vm)
		]
}


//Creates a listener for the TDs of the VM table
function vMachineInfoListener(){

	$('#tbodyvmachines tr').live("click", function(e){
		if ($(e.target).is('input')) {return true;}
        popDialogLoading();
		var aData = dataTable_vMachines.fnGetData(this);
		var id = $(aData[0]).val();
        Sunstone.runAction("VM.showinfo",id);
		return false;
	});
}

// Callback to refresh a single element from the list
function updateVMachineElement(request, vm_json){
	var id = vm_json.VM.ID;
	var element = vMachineElementArray(vm_json);
	updateSingleElement(element,dataTable_vMachines,'#vm_'+id)
}

// Callback to delete a single element from the list
function deleteVMachineElement(req){
	deleteElement(dataTable_vMachines,'#vm_'+req.request.data);
}

// Callback to add an element to the list
function addVMachineElement(request,vm_json){
    var id = vm_json.VM.ID;
	var element = vMachineElementArray(vm_json);
	addElement(element,dataTable_vMachines);
    //Popup info panel after creation.
    updateVMInfo(null,vm_json);
}


// Callback to refresh the list of Virtual Machines
function updateVMachinesView(request, vmachine_list){
	vmachine_list_json = vmachine_list;
	var vmachine_list_array = [];

	$.each(vmachine_list,function(){
		vmachine_list_array.push( vMachineElementArray(this));
	});

	updateView(vmachine_list_array,dataTable_vMachines);
	updateDashboard("vms",vmachine_list_json);
}


// Refreshes the information panel for a VM
function updateVMInfo(request,vm){
	var vm_info = vm.VM;
	var info_tab = {
        title : "VM information",
        content: '<table id="info_vm_table" class="info_table">\
			<thead>\
				<tr><th colspan="2">Virtual Machine information - '+vm_info.NAME+'</th></tr>\
			</thead>\
			<tr>\
				<td class="key_td">ID</td>\
				<td class="value_td">'+vm_info.ID+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Name</td>\
				<td class="value_td">'+vm_info.NAME+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">State</td>\
				<td class="value_td">'+OpenNebula.Helper.resource_state("vm",vm_info.STATE)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">LCM State</td>\
				<td class="value_td">'+OpenNebula.Helper.resource_state("vm_lcm",vm_info.LCM_STATE)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Start time</td>\
				<td class="value_td">'+pretty_time(vm_info.STIME)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Deploy ID</td>\
				<td class="value_td">'+(typeof(vm_info.DEPLOY_ID) == "object" ? "-" : vm_info.DEPLOY_ID)+'</td>\
			</tr>\
		</table>\
		<table id="vm_monitoring_table" class="info_table">\
			<thead>\
				<tr><th colspan="2">Monitoring information</th></tr>\
			</thead>\
			<tr>\
				<td class="key_td">Net_TX</td>\
				<td class="value_td">'+vm_info.NET_TX+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Net_RX</td>\
				<td class="value_td">'+vm_info.NET_RX+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Used Memory</td>\
				<td class="value_td">'+humanize_size(vm_info.MEMORY)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Used CPU</td>\
				<td class="value_td">'+vm_info.CPU+'</td>\
			</tr>\
		</table>'
    }
    
    var template_tab = {
        title: "VM Template",
        content: '<table id="vm_template_table" class="info_table">\
		<thead><tr><th colspan="2">VM template</th></tr></thead>'+
		prettyPrintJSON(vm_info.TEMPLATE)+
		'</table>'        
    }
    
    var log_tab = {
        title: "VM log",
        content: '<pre>'+spinner+'</pre>'
    }
        
	Sunstone.updateInfoPanelTab("vm_info_panel","vm_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_template_tab",template_tab);
    Sunstone.updateInfoPanelTab("vm_info_panel","vm_log_tab",log_tab);
    
    
    //Here it is special, as we will let the callback from the VM.log
    //action popUp the info panel again when the info is received.
    Sunstone.popUpInfoPanel("vm_info_panel");
    Sunstone.runAction("VM.log",vm_info.ID);

}

// Sets up the create-template dialog and all the processing associated to it,
// which is a lot.
function setupCreateVMDialog(){

   $('div#dialogs').append('<div title="Create Virtual Machine" id="create_vm_dialog"></div>');
	//Insert HTML in place
	$('#create_vm_dialog').html(create_vm_tmpl);

	//Prepare jquery dialog
	$('#create_vm_dialog').dialog({
		autoOpen: false,
		modal: true,
		width: 400
	});
    
    $('#create_vm_dialog button').button();
    
    $('#create_vm_dialog #create_vm_proceed').click(function(){
        var vm_name = $('#create_vm_form #vm_name').val();
        var template_id = $('#create_vm_form #template_id').val();
        var vm_json = { vm: { vm_name: vm_name, template_id : template_id }};
        
        Sunstone.runAction("VM.create",vm_json);
        $('#create_vm_dialog').dialog('close');
        return false;
    });
    
    $('#create_vm_dialog #create_vm_cancel').click(function(){
        
    });
}

// Open creation dialog
function popUpCreateVMDialog(){
    $('#create_vm_dialog').dialog('open');
}

//Prepares a dialog to saveas a VM
function setupSaveasDialog(){
    //Append to DOM
    $('div#dialogs').append('<div id="saveas_vm_dialog" title="VM Save As"></div>');

    //Put HTML in place
    $('#saveas_vm_dialog').html('\
        <form action="javascript:alert(\'js error!\');">\
            <div id="saveas_tabs">\
            </div>\
			<div class="form_buttons">\
			  <button id="vm_saveas_proceed" value="">OK</button>\
			  <button id="vm_saveas_cancel" value="">Cancel</button>\
			</div>\
            </fieldset>\
       </form>');
       
    $('#saveas_vm_dialog').dialog({
        autoOpen:false,
        width:600,
        modal:true,
        height:350,
        resizable:true,
    });
    
    $('#saveas_vm_dialog #vm_saveas_proceed').click(function(){
        var elems = $('#saveas_vm_dialog #saveas_tabs div.saveas_tab');
        var args = [];
        $.each(elems,function(){
            var id = $('#vm_id',this).text();
            var disk_id = $('#vm_disk_id',this).val();
            var image_name = $('#image_name',this).val();
            var type = $('#image_type',this).val();
            
            if (!id.length || !disk_id.length || !image_name.length) {
                notifyError("Skipping VM "+id+
                    ". No disk id or image name specified");
                }
            else {
                var obj = {
                    vm_id: id,
                    disk_id : disk_id,
                    image_name : image_name,
                    type: type
                };
                args.push(id);
                Sunstone.runAction("VM.saveas",obj);
            }
        });
        if (args.length > 0){
            notifySubmit("VM.saveas",args);
        }
 
        $('#saveas_vm_dialog').dialog('close'); 
        return false;
    });
    
    $('#saveas_vm_dialog #vm_saveas_cancel').click(function(){
       $('#saveas_vm_dialog').dialog('close'); 
       return false;
    });
        
}

function popUpSaveasDialog(elems){
    $('#saveas_vm_dialog #saveas_tabs').tabs('destroy');
    $('#saveas_vm_dialog #saveas_tabs').empty();
    $('#saveas_vm_dialog #saveas_tabs').html('<ul></ul>');
    
    $.each(elems,function(){
        var li = '<li><a href="#saveas_tab_'+this+'">VM '+this+'</a></li>'
        $('#saveas_vm_dialog #saveas_tabs ul').append(li);
        var tab = '<div class="saveas_tab" id="saveas_tab_'+this+'">\
        <div id="vm_id_text">Saveas for VM with ID <span id="vm_id">'+this+'</span></div>\
            <fieldset>\
            <div>\
                <label for="vm_disk_id">Disk id:</label>\
                <input type="text" id="vm_disk_id" name="vm_disk_id" value="" size="2"/>\
            </div>\
            <div>\
                <label for="image_name">Image name:</label>\
                <input type="text" id="image_name" name="image_name" value="" />\
            </div>\
            <div>\
                <label for="img_attr_value">Type:</label>\
                <select id="image_type" name="image_type">\
                    <option value="">Default</option>\
					<option value="disk">Disk</option>\
					<option value="floppy">Floppy</option>\
					<option value="cdrom">CD-ROM</option>\
					<option value="swap">Swap</option>\
					<option value="fs">FS</option>\
					<option value="block">Block</option>\
				  </select>\
            </div>\
            </fieldset>\
        </div>';
        $('#saveas_vm_dialog #saveas_tabs').append(tab);
    });
    $('#saveas_vm_dialog #saveas_tabs').tabs();
    $('#saveas_vm_dialog button').button();
       
    $('#saveas_vm_dialog').dialog('open');
}

//Prepares autorefresh
function setVMAutorefresh(){
     setInterval(function(){
		var checked = $('input:checked',dataTable_vMachines.fnGetNodes());
        var filter = $("#datatable_vmachines_filter input").attr("value");
		if (!checked.length && !filter.length){
            Sunstone.runAction("VM.autorefresh");
		}
	},INTERVAL+someTime()); //so that not all refreshing is done at the same time
}

// At this point the DOM is ready and the sunstone.js ready() has been run.
$(document).ready(function(){
    
    dataTable_vMachines = $("#datatable_vmachines").dataTable({
      "bJQueryUI": true,
      "bSortClasses": false,
      "sPaginationType": "full_numbers",
      "bAutoWidth":false,
      "aoColumnDefs": [
                        { "bSortable": false, "aTargets": ["check"] },
                        { "sWidth": "60px", "aTargets": [0] },
                        { "sWidth": "35px", "aTargets": [1] },
                        { "sWidth": "100px", "aTargets": [2] }
                       ]
    });
    
    dataTable_vMachines.fnClearTable();
    addElement([
        spinner,
        '','','','','','','',''],dataTable_vMachines);
	Sunstone.runAction("VM.list");
    
    setupCreateVMDialog();
    setupSaveasDialog();
    setVMAutorefresh();
    
    initCheckAllBoxes(dataTable_vMachines);
    tableCheckboxesListener(dataTable_vMachines);
    vMachineInfoListener();
})
