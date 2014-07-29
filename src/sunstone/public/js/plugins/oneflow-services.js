// ------------------------------------------------------------------------ //
// Copyright 2010-2014, C12G Labs S.L.                                      //
//                                                                          //
// Licensed under the Apache License, Version 2.0 (the "License"); you may  //
// not use this file except in compliance with the License. You may obtain  //
// a copy of the License at                                                 //
//                                                                          //
// http://www.apache.org/licenses/LICENSE-2.0                               //
//                                                                          //
// Unless required by applicable law or agreed to in writing, software      //
// distributed under the License is distributed on an "AS IS" BASIS,        //
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. //
// See the License for the specific language governing permissions and      //
// limitations under the License.                                           //
//------------------------------------------------------------------------- //
var selected_row_role_id;
var last_selected_row_role;
var last_selected_row_rolevm;
var checked_row_rolevm_ids = [];

var generate_batch_action_params = function(){
    var action_obj = {
        "period" : $("#batch_action_period").val(),
        "number" : $("#batch_action_number").val()};

    return action_obj;
}

var role_actions = {
    "Role.update_dialog" : {
        type: "custom",
        call: popUpScaleDialog
    },

    "Role.update" : {
        type: "multiple",
        call: OpenNebula.Role.update,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.hold" : {
        type: "multiple",
        call: OpenNebula.Role.hold,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.release" : {
        type: "multiple",
        call: OpenNebula.Role.release,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.suspend" : {
        type: "multiple",
        call: OpenNebula.Role.suspend,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.resume" : {
        type: "multiple",
        call: OpenNebula.Role.resume,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.stop" : {
        type: "multiple",
        call: OpenNebula.Role.stop,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.boot" : {
        type: "multiple",
        call: OpenNebula.Role.boot,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.reboot_hard" : {
        type: "multiple",
        call: OpenNebula.Role.reboot_hard,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.delete_recreate" : {
        type: "multiple",
        call: OpenNebula.Role.delete_recreate,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.reboot" : {
        type: "multiple",
        call: OpenNebula.Role.reboot,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.poweroff" : {
        type: "multiple",
        call: OpenNebula.Role.poweroff,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.poweroff_hard" : {
        type: "multiple",
        call: OpenNebula.Role.poweroff_hard,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.undeploy" : {
        type: "multiple",
        call: OpenNebula.Role.undeploy,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.undeploy_hard" : {
        type: "multiple",
        call: OpenNebula.Role.undeploy_hard,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.snapshot_create" : {
        type: "single",
        call: OpenNebula.Role.snapshot_create,
        callback: roleCallback,
        error:onError,
        notify: true
    },

    "Role.shutdown" : {
        type: "multiple",
        call: OpenNebula.Role.shutdown,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.shutdown_hard" : {
        type: "multiple",
        call: OpenNebula.Role.cancel,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.delete" : {
        type: "multiple",
        call: OpenNebula.Role.del,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.recover" : {
        type: "multiple",
        call: OpenNebula.Role.recover,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "RoleVM.deploy" : {
        type: "multiple",
        call: OpenNebula.VM.deploy,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.migrate" : {
        type: "multiple",
        call: OpenNebula.VM.migrate,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.migrate_live" : {
        type: "multiple",
        call: OpenNebula.VM.livemigrate,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.hold" : {
        type: "multiple",
        call: OpenNebula.VM.hold,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.release" : {
        type: "multiple",
        call: OpenNebula.VM.release,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.suspend" : {
        type: "multiple",
        call: OpenNebula.VM.suspend,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.resume" : {
        type: "multiple",
        call: OpenNebula.VM.resume,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.stop" : {
        type: "multiple",
        call: OpenNebula.VM.stop,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.boot" : {
        type: "multiple",
        call: OpenNebula.VM.restart,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.reboot_hard" : {
        type: "multiple",
        call: OpenNebula.VM.reset,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.delete_recreate" : {
        type: "multiple",
        call: OpenNebula.VM.resubmit,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.reboot" : {
        type: "multiple",
        call: OpenNebula.VM.reboot,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.poweroff" : {
        type: "multiple",
        call: OpenNebula.VM.poweroff,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.poweroff_hard" : {
        type: "multiple",
        call: OpenNebula.VM.poweroff_hard,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.undeploy" : {
        type: "multiple",
        call: OpenNebula.VM.undeploy,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.undeploy_hard" : {
        type: "multiple",
        call: OpenNebula.VM.undeploy_hard,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.shutdown" : {
        type: "multiple",
        call: OpenNebula.VM.shutdown,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.shutdown_hard" : {
        type: "multiple",
        call: OpenNebula.VM.cancel,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.delete" : {
        type: "multiple",
        call: OpenNebula.VM.del,
        callback: deleteVMachineElement,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.recover" : {
        type: "multiple",
        call: OpenNebula.VM.recover,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.resched" : {
        type: "multiple",
        call: OpenNebula.VM.resched,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.unresched" : {
        type: "multiple",
        call: OpenNebula.VM.unresched,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },

    "RoleVM.chown" : {
        type: "multiple",
        call: OpenNebula.VM.chown,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    },
    "RoleVM.chgrp" : {
        type: "multiple",
        call: OpenNebula.VM.chgrp,
        callback: roleCallback,
        elements: roleVMElements,
        error: onError,
        notify: true
    }
};

Sunstone.addActions(role_actions);

function roleElements() {
    return getSelectedNodes(servicerolesDataTable, true);
};

function roleVMElements() {
    return getSelectedNodes(serviceroleVMsDataTable, true);
};

function roleCallback() {
    return Sunstone.runAction('Service.refresh');
}

var role_buttons = {
    "Role.update_dialog" : {
        type: "action",
        text: tr("Scale"),
        tip: tr("This will hold selected pending VMs from being deployed"),
        layout: "create"
    },
    "Role.hold" : {
        type: "action",
        text: tr("Hold"),
        tip: tr("This will hold selected pending VMs from being deployed"),
        layout: "vmsplanification_buttons"
    },
    "Role.release" : {
        type: "action",
        text: tr("Release"),
        layout: "vmsplanification_buttons",
        tip: tr("This will release held machines")
    },
    "Role.suspend" : {
        type: "action",
        text: tr("Suspend"),
        layout: "vmspause_buttons",
        tip: tr("This will suspend selected machines")
    },
    "Role.resume" : {
        type: "action",
        text: '<i class="fa fa-play"/>',
        layout: "vmsplay_buttons",
        tip: tr("This will resume selected VMs")
    },
    "Role.stop" : {
        type: "action",
        text: tr("Stop"),
        layout: "vmsstop_buttons",
        tip: tr("This will stop selected VMs")
    },
    "Role.boot" : {
        type: "action",
        text: tr("Boot"),
        layout: "vmsplanification_buttons",
        tip: tr("This will force the hypervisor boot action of VMs stuck in UNKNOWN or BOOT state")
    },
    "Role.reboot" : {
        type: "action",
        text: tr("Reboot"),
        layout: "vmsrepeat_buttons",
        tip: tr("This will send a reboot action to running VMs")
    },
    "Role.reboot_hard" : {
        type: "action",
        text: tr("Reboot") + ' <span class="label secondary radius">hard</span>',
        layout: "vmsrepeat_buttons",
        tip: tr("This will perform a hard reboot on selected VMs")
    },
    "Role.poweroff" : {
        type: "action",
        text: tr("Power Off"),
        layout: "vmspause_buttons",
        tip: tr("This will send a power off signal to running VMs. They can be resumed later.")
    },
    "Role.poweroff_hard" : {
        type: "action",
        text: tr("Power Off") + ' <span class="label secondary radius">hard</span>',
        layout: "vmspause_buttons",
        tip: tr("This will send a forced power off signal to running VMs. They can be resumed later.")
    },
    "Role.undeploy" : {
        type: "action",
        text: tr("Undeploy"),
        layout: "vmsstop_buttons",
        tip: tr("Shuts down the given VM. The VM is saved in the system Datastore.")
    },
    "Role.undeploy_hard" : {
        type: "action",
        text: tr("Undeploy") + ' <span class="label secondary radius">hard</span>',
        layout: "vmsstop_buttons",
        tip: tr("Shuts down the given VM. The VM is saved in the system Datastore.")
    },
    "Role.shutdown" : {
        type: "action",
        text: tr("Shutdown"),
        layout: "vmsdelete_buttons",
        tip: tr("This will initiate the shutdown process in the selected VMs")
    },
    "Role.shutdown_hard" : {
        type: "action",
        text: tr("Shutdown") + ' <span class="label secondary radius">hard</span>',
        layout: "vmsdelete_buttons",
        tip: tr("This will initiate the shutdown-hard (forced) process in the selected VMs")
    },
    "Role.delete" : {
        type: "action",
        text: tr("Delete"),
        layout: "vmsdelete_buttons",
        tip: tr("This will delete the selected VMs from the database")
    },
    "Role.delete_recreate" : {
        type: "action",
        text: tr("Delete") + ' <span class="label secondary radius">recreate</span>',
        layout: "vmsrepeat_buttons",
        tip: tr("This will delete and recreate VMs to PENDING state")
    }
}


var role_vm_buttons = {
    "RoleVM.hold" : {
        type: "action",
        text: tr("Hold"),
        tip: tr("This will hold selected pending VMs from being deployed"),
        layout: "vmsplanification_buttons",
    },
    "RoleVM.release" : {
        type: "action",
        text: tr("Release"),
        layout: "vmsplanification_buttons",
        tip: tr("This will release held machines")
    },
    "RoleVM.suspend" : {
        type: "action",
        text: tr("Suspend"),
        layout: "vmspause_buttons",
        tip: tr("This will suspend selected machines")
    },
    "RoleVM.resume" : {
        type: "action",
        text: '<i class="fa fa-play"/>',
        layout: "vmsplay_buttons",
        tip: tr("This will resume selected VMs")
    },
    "RoleVM.stop" : {
        type: "action",
        text: tr("Stop"),
        layout: "vmsstop_buttons",
        tip: tr("This will stop selected VMs")
    },
    "RoleVM.boot" : {
        type: "action",
        text: tr("Boot"),
        layout: "vmsplanification_buttons",
        tip: tr("This will force the hypervisor boot action of VMs stuck in UNKNOWN or BOOT state")
    },
    "RoleVM.reboot" : {
        type: "action",
        text: tr("Reboot"),
        layout: "vmsrepeat_buttons",
        tip: tr("This will send a reboot action to running VMs")
    },
    "RoleVM.reboot_hard" : {
        type: "action",
        text: tr("Reboot") + ' <span class="label secondary radius">hard</span>',
        layout: "vmsrepeat_buttons",
        tip: tr("This will perform a hard reboot on selected VMs")
    },
    "RoleVM.poweroff" : {
        type: "action",
        text: tr("Power Off"),
        layout: "vmspause_buttons",
        tip: tr("This will send a power off signal to running VMs. They can be resumed later.")
    },
    "RoleVM.poweroff_hard" : {
        type: "action",
        text: tr("Power Off") + ' <span class="label secondary radius">hard</span>',
        layout: "vmspause_buttons",
        tip: tr("This will send a forced power off signal to running VMs. They can be resumed later.")
    },
    "RoleVM.undeploy" : {
        type: "action",
        text: tr("Undeploy"),
        layout: "vmsstop_buttons",
        tip: tr("Shuts down the given VM. The VM is saved in the system Datastore.")
    },
    "RoleVM.undeploy_hard" : {
        type: "action",
        text: tr("Undeploy") + ' <span class="label secondary radius">hard</span>',
        layout: "vmsstop_buttons",
        tip: tr("Shuts down the given VM. The VM is saved in the system Datastore.")
    },
    "RoleVM.shutdown" : {
        type: "action",
        text: tr("Shutdown"),
        layout: "vmsdelete_buttons",
        tip: tr("This will initiate the shutdown process in the selected VMs")
    },
    "RoleVM.shutdown_hard" : {
        type: "action",
        text: tr("Shutdown") + ' <span class="label secondary radius">hard</span>',
        layout: "vmsdelete_buttons",
        tip: tr("This will initiate the shutdown-hard (forced) process in the selected VMs")
    },

    "RoleVM.delete" : {
        type: "action",
        text: tr("Delete"),
        layout: "vmsdelete_buttons",
        tip: tr("This will delete the selected VMs from the database")
    },
    "RoleVM.delete_recreate" : {
        type: "action",
        text: tr("Delete") + ' <span class="label secondary radius">recreate</span>',
        layout: "vmsrepeat_buttons",
        tip: tr("This will delete and recreate VMs to PENDING state")
    },
    "RoleVM.resched" : {
        type: "action",
        text: tr("Reschedule"),
        layout: "vmsplanification_buttons",
        tip: tr("This will reschedule selected VMs")
    },
    "RoleVM.unresched" : {
        type: "action",
        text: tr("Un-Reschedule"),
        layout: "vmsplanification_buttons",
        tip: tr("This will cancel the rescheduling for the selected VMs")
    }
}

var dataTable_services;

var service_actions = {
    "Service.list" : {
        type: "list",
        call: OpenNebula.Service.list,
        callback: function(request, service_list) {
            $(".flow_error_message").hide();
            updateServicesView(request, service_list);
        },
        error: function(request, error_json) {
            onError(request, error_json, $(".flow_error_message"));
        }
    },

    "Service.show" : {
        type : "single",
        call: OpenNebula.Service.show,
        callback: function(request, response){
            var tab = dataTable_services.parents(".tab");

            if (Sunstone.rightInfoVisible(tab)) {
                // individual view
                updateServiceInfo(request, response);
            }

            // datatable row
            updateServiceElement(request, response);
        },
        error: onError
    },

    "Service.refresh" : {
        type: "custom",
        call: function () {
            var tab = dataTable_services.parents(".tab");
            if (Sunstone.rightInfoVisible(tab)) {
                checked_row_rolevm_ids = new Array();

                if (typeof(serviceroleVMsDataTable) !== 'undefined') {
                    selected_row_role_id = $($('td.markrowchecked',servicerolesDataTable.fnGetNodes())[1]).html();
                    $.each($(serviceroleVMsDataTable.fnGetNodes()), function(){
                       if($('td.markrowchecked',this).length!=0)
                       {
                            checked_row_rolevm_ids.push($($('td',$(this))[1]).html());
                       }
                    });
                }

                Sunstone.runAction("Service.show", Sunstone.rightInfoResourceId(tab))
            } else {
                waitingNodes(dataTable_services);
                Sunstone.runAction("Service.list", {force: true});
            }
        }
    },

    "Service.delete" : {
        type: "multiple",
        call: OpenNebula.Service.del,
        callback: deleteServiceElement,
        elements: serviceElements,
        error: onError,
        notify: true
    },

    "Service.chown" : {
        type: "multiple",
        call: OpenNebula.Service.chown,
        callback:  function (req) {
            Sunstone.runAction("Service.show",req.request.data[0][0]);
        },
        elements: serviceElements,
        error: onError,
        notify: true
    },

    "Service.chgrp" : {
        type: "multiple",
        call: OpenNebula.Service.chgrp,
        callback: function (req) {
            Sunstone.runAction("Service.show",req.request.data[0][0]);
        },
        elements: serviceElements,
        error: onError,
        notify: true
    },

    "Service.chmod" : {
        type: "single",
        call: OpenNebula.Service.chmod,
        error: onError,
        notify: true
    },

    "Service.shutdown" : {
        type: "multiple",
        call: OpenNebula.Service.shutdown,
        elements: serviceElements,
        error: onError,
        notify: true
    },

    "Service.recover" : {
        type: "multiple",
        call: OpenNebula.Service.recover,
        elements: serviceElements,
        error: onError,
        notify: true
    }
};


var service_buttons = {
    "Service.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },
    "Service.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: "User",
        tip: tr("Select the new owner")+":",
        layout: "user_select"
    },
    "Service.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: "Group",
        tip: tr("Select the new group")+":",
        layout: "user_select"
    },
    "Service.shutdown" : {
        type: "action",
        layout: "main",
        text: tr("Shutdown")
    },
    "Service.recover" : {
        type: "action",
        layout: "main",
        text: tr("Recover")
    },
    "Service.delete" : {
        type: "confirm",
        text: tr("Delete"),
        layout: "del",
        tip: tr("This will delete the selected services")
    }
}

var service_info_panel = {
    "service_info_tab" : {
        title: tr("Service information"),
        content: ""
    }
}

var services_tab = {
    title: "Services",
    resource: 'Service',
    buttons: service_buttons,
    tabClass: 'subTab',
    parentTab: 'oneflow-dashboard',
    search_input: '<input id="services_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-cubes"></i>&emsp;'+tr("OneFlow - Services"),
    info_header: '<i class="fa fa-fw fa-cubes"></i>&emsp;'+tr("OneFlow - Service"),
    subheader: '<span/> <small></small>&emsp;',
    content:   '<div class="row flow_error_message" id="" hidden>\
        <div class="small-6 columns small-centered text-center">\
            <div class="alert-box alert radius">'+tr("Cannot connect to OneFlow server")+'</div>\
        </div>\
    </div>',
    table: '<table id="datatable_services" class="datatable twelve">\
        <thead>\
          <tr>\
            <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
            <th>'+tr("ID")+'</th>\
            <th>'+tr("Owner")+'</th>\
            <th>'+tr("Group")+'</th>\
            <th>'+tr("Name")+'</th>\
            <th>'+tr("State")+'</th>\
          </tr>\
        </thead>\
        <tbody>\
        </tbody>\
      </table>'
}

Sunstone.addActions(service_actions);
Sunstone.addMainTab('oneflow-services',services_tab);
Sunstone.addInfoPanel('service_info_panel',service_info_panel);


function serviceElements() {
    return getSelectedNodes(dataTable_services);
}

// Returns an array containing the values of the service_json and ready
// to be inserted in the dataTable
function serviceElementArray(service_json){
    var service = service_json.DOCUMENT;

    return [
        '<input class="check_item" type="checkbox" id="service_'+service.ID+'" name="selected_items" value="'+service.ID+'"/>',
        service.ID,
        service.UNAME,
        service.GNAME,
        service.NAME,
        OpenNebula.Service.state(service.TEMPLATE.BODY.state)
    ];
}

// Callback to update an element in the dataTable
function updateServiceElement(request, service_json){
    var id = service_json.DOCUMENT.ID;
    var element = serviceElementArray(service_json);
    updateSingleElement(element,dataTable_services,'#service_'+id);
}

// Callback to remove an element from the dataTable
function deleteServiceElement(req){
    deleteElement(dataTable_services,'#service_'+req.request.data);
}

// Callback to add an service element
function addServiceElement(request, service_json){
    var element = serviceElementArray(service_json);
    addElement(element,dataTable_services);
}

// Callback to refresh the list
function updateServicesView(request, services_list){
    var service_list_array = [];

    $.each(services_list,function(){
       service_list_array.push(serviceElementArray(this));
    });

    updateView(service_list_array,dataTable_services);
}

// Callback to refresh the list of Virtual Machines
function updateServiceVMInfo(vmachine_list){
    var vmachine_list_array = [];

    $.each(vmachine_list,function(){
        vmachine_list_array.push( vMachineElementArray(this));
    });

    updateView(vmachine_list_array, serviceroleVMsDataTable);
};

// Callback to update the information panel tabs and pop it up
function updateServiceInfo(request,elem){
    var elem_info = elem.DOCUMENT;

    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content:
        '<div class="row">\
          <div class="large-6 columns">\
          <table id="info_template_table" class="dataTable extended_table">\
           <thead>\
             <tr><th colspan="2">'+tr("Information")+'</th></tr>\
           </thead>\
           <tr>\
             <td class="key_td">'+tr("ID")+'</td>\
             <td class="value_td">'+elem_info.ID+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Name")+'</td>\
             <td class="value_td">'+elem_info.NAME+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Strategy")+'</td>\
             <td class="value_td">'+elem_info.TEMPLATE.BODY.deployment+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Shutdown action")+'</td>\
             <td class="value_td">'+(elem_info.TEMPLATE.BODY.shutdown_action || "")+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("State")+'</td>\
             <td class="value_td">'+ OpenNebula.Service.state(elem_info.TEMPLATE.BODY.state) +'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Ready Status Gate")+'</td>\
             <td class="value_td">'+(elem_info.TEMPLATE.BODY.ready_status_gate ? "yes" : "no")+'</td>\
           </tr>\
         </table>' +
       '</div>\
        <div class="large-6 columns">' + insert_permissions_table('oneflow-services',
                                                              "Service",
                                                              elem_info.ID,
                                                              elem_info.UNAME,
                                                              elem_info.GNAME,
                                                              elem_info.UID,
                                                              elem_info.GID) +
        '</div>\
     </div>'
    }

    Sunstone.updateInfoPanelTab("service_info_panel", "service_info_tab",info_tab);

    var roles_tab = {
        title : "Roles",
        icon: "fa-wrench",
        content : '<form class="custom" id="roles_form" action="">\
          <div class="row">\
          <div id="role_actions">\
            <div class="columns large-8">\
                <h4>'+tr("Roles")+'</h4>\
            </div>\
            <div class="columns large-4 right">\
              <div class="row">\
                    <div class="large-6 columns">\
                        <label for="batch_action_period">' + tr("Period") + ':\
                            <span class="tip">'+ tr("Seconds between each group of actions") +'</span>\
                        </label>\
                        <input type="text" id="batch_action_period" name="batch_action_period"/>\
                    </div>\
                    <div class="large-6 columns">\
                        <label for="batch_action_number">' + tr("Number") + '\
                            <span class="tip">'+ tr("Number of VMs to apply the action to each period") +'</span>\
                        :</label>\
                        <input type="text" id="batch_action_number" name="batch_action_number"/>\
                    </div>\
              </div>\
            </div>\
            <div class="action_blocks columns large-12">\
            </div>\
          </div>\
          <div id="roles_info" class="columns large-12">\
            <table id="datatable_service_roles" class="dataTable twelve">\
              <thead>\
                <tr>\
                  <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
                  <th>'+tr("Name")+'</th>\
                  <th>'+tr("State")+'</th>\
                  <th>'+tr("Cardinality")+'</th>\
                  <th>'+tr("VM Template")+'</th>\
                  <th>'+tr("Parents")+'</th>\
                </tr>\
              </thead>\
              <tbody>\
              </tbody>\
            </table>\
          </div>\
          <div id="roles_extended_info" class="columns twelve">\
            <span class="radius secondary label">'+tr("Select a role in the table for more information")+'</span>\
          </div>\
          </div>\
        </form>'
    };

    Sunstone.updateInfoPanelTab("service_info_panel", "service_roles_tab",roles_tab);

    var logs = elem_info.TEMPLATE.BODY.log
    var log_info = ''
    if (logs) {
        log_info += '<div class="row"><div class="large-12 columns log-tab">'

        for (var i = 0; i < logs.length; i++) {
          var line =  pretty_time(logs[i].timestamp)+' ['+logs[i].severity + '] ' + logs[i].message+ '<br>';
          if (logs[i].severity == 'E'){
            line = '<span class="vm_log_error">'+line+'</span>';
          }

          log_info += line;
        }

        log_info += '</div></div>'
    }

    var logs_tab = {
      title: "Log",
      icon: "fa-file-text",
      content: log_info
    }


    Sunstone.updateInfoPanelTab("service_info_panel", "service_log_tab",logs_tab);


    // Popup panel
    Sunstone.popUpInfoPanel("service_info_panel", "oneflow-services");
    setPermissionsTable(elem_info,'');

    var roles = elem_info.TEMPLATE.BODY.roles
    if (roles && roles.length) {
        servicerolesDataTable = $('#datatable_service_roles').dataTable({
            "bSortClasses": false,
            "bDeferRender": true,
            "bAutoWidth":false,
            "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] }
            ],
            "sDom" : '<"H">t<"F"p>'
        });

        var context = $("#roles_extended_info", $("#service_info_panel"));
        var role_elements = [];
        $.each(roles, function(){
            role_elements.push([
                '<input class="check_item" type="checkbox" id="role_'+this.name+'" name="selected_items" value="'+elem_info.ID+'/role/'+this.name+'"/>',
                this.name,
                OpenNebula.Role.state(this.state),
                this.cardinality,
                this.vm_template,
                this.parents ? this.parents.join(', ') : '-'
            ])
        });

        updateView(role_elements ,servicerolesDataTable);

        insertButtonsInTab("oneflow-services", "service_roles_tab", role_buttons, $('#role_actions'))

        setupScaleDialog();

        $('tbody input.check_item',servicerolesDataTable).die();
        $('tbody tr',servicerolesDataTable).die();

        initCheckAllBoxes(servicerolesDataTable, $('#role_actions'));
        tableCheckboxesListener(servicerolesDataTable, $('#role_actions'));

        $('tbody tr',servicerolesDataTable).die()
        $('tbody tr',servicerolesDataTable).live("click",function(e){
            if ($(e.target).is('input') ||
                $(e.target).is('select') ||
                $(e.target).is('option')) return true;

            if (e.ctrlKey || e.metaKey || $(e.target).is('input'))
            {
                $('.check_item',this).trigger('click');
            }
            else
            {
                var aData = servicerolesDataTable.fnGetData(this);
                var role_name = $(aData[0]).val();

                var role_index = servicerolesDataTable.fnGetPosition(this);

                generate_role_div(role_index);

                $('tbody input.check_item',$(this).parents('table')).removeAttr('checked');
                $('.check_item',this).click();
                $('td',$(this).parents('table')).removeClass('markrowchecked');

                if(last_selected_row_role) {
                    last_selected_row_role.children().each(function(){
                        $(this).removeClass('markrowchecked');
                    });
                }

                last_selected_row_role = $(this);
                $(this).children().each(function(){
                    $(this).addClass('markrowchecked');
                });
            }
        });

        var generate_role_div = function(role_index) {
            var role = roles[role_index]
            var info_str = "<form>\
                <h4>"+tr("Role")+" - "+role.name+"</h4>\
                <div class='large-12 columns'>\
                    <table class='dataTable extended_table policies_table'>\
                        <thead>\
                            <tr><th colspan='8'>"+tr("Information")+"</th></tr>\
                        </thead>\
                        <tbody>\
                            <tr>\
                             <td class='key_td'>"+tr("Shutdown action")+"</td>\
                             <td class='value_td'>"+(role.shutdown_action || "-")+"</td>\
                             <td class='key_td'>"+tr("Cooldown")+"</td>\
                             <td class='value_td'>"+(role.cooldown || "-")+"</td>\
                             <td class='key_td'>"+tr("Min VMs")+"</td>\
                             <td class='value_td'>"+(role.min_vms || "-")+"</td>\
                             <td class='key_td'>"+tr("Max VMs")+"</td>\
                             <td class='value_td'>"+(role.max_vms || "-")+"</td>\
                           </tr>\
                        </tbody>\
                    </table>\
                    <br>\
                 </div>";

            info_str += '<fieldset>\
                <legend>'+tr("Virtual Machines")+'</legend>\
                <div id="role_vms_actions">\
                    <div class="action_blocks columns twelve">\
                    </div>\
                </div>\
                <div class="columns twelve">\
                    <br>\
                    <table id="datatable_service_vms_'+role.name+'" class="dataTable twelve ">\
                      <thead>\
                        <tr>\
                          <th></th>\
                          <th></th>\
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
                      <tbody>\
                      </tbody>\
                    </table>\
                </div>\
                </fieldset>';

            info_str += "<div class='large-12 columns'><br>";

            if (role.elasticity_policies && role.elasticity_policies.length > 0) {
                info_str += '<table class="dataTable extended_table policies_table">\
                    <thead style="background:#dfdfdf">\
                      <tr>\
                        <th colspan="7">'+tr("Elasticity policies")+'</th>\
                      </tr>\
                    </thead>\
                    <thead>\
                      <tr>\
                        <th style="width:14%">'+tr("Type")+'\
                            <span class="tip">'+tr("Type of adjustment.")+'<br><br>\
                                '+tr("CHANGE: Add/substract the given number of VMs.")+'<br>\
                                '+tr("CARDINALITY: Set the cardinality to the given number.")+'<br>\
                                '+tr("PERCENTAGE_CHANGE: Add/substract the given percentage to the current cardinality.")+'\
                            </span>\
                        </th>\
                        <th style="width:12%">'+tr("Adjust")+'\
                            <span class="tip">'+tr("Positive or negative adjustment. Its meaning depends on 'type'")+'<br><br>\
                                '+tr("CHANGE: -2, will substract 2 VMs from the role")+'<br>\
                                '+tr("CARDINALITY: 8, will set carditanilty to 8")+'<br>\
                                '+tr("PERCENTAGE_CHANGE: 20, will increment cardinality by 20%")+'\
                            </span>\
                        </th>\
                        <th style="width:9%">'+tr("Min")+'\
                            <span class="tip">'+tr("Optional parameter for PERCENTAGE_CHANGE adjustment type. If present, the policy will change the cardinality by at least the number of VMs set in this attribute.")+'\
                            </span>\
                        </th>\
                        <th style="width:26%">'+tr("Expression")+'\
                            <span class="tip">'+tr("Expression to trigger the elasticity")+'<br><br>\
                                '+tr("Example: ATT < 20")+'<br>\
                            </span>\
                        </th>\
                        <th style="width:13%">'+tr("# Periods")+'\
                            <span class="tip">'+tr("Number of periods that the expression must be true before the elasticity is triggered")+'\
                            </span>\
                        </th>\
                        <th style="width:10%">'+tr("Period")+'\
                            <span class="tip">'+tr("Duration, in seconds, of each period in '# Periods'")+'\
                            </span>\
                        </th>\
                        <th style="width:13%">'+tr("Cooldown")+'\
                            <span class="tip">'+tr("Cooldown period duration after a scale operation, in seconds")+'\
                            </span>\
                        </th>\
                      </tr>\
                    </thead>\
                    <tbody>';

                $.each(role.elasticity_policies, function(){
                    info_str += '<tr>\
                        <td>'+this.type+'</td>\
                        <td>'+this.adjust+'</td>\
                        <td>'+(this.min_adjust_step || "-")+'</td>\
                        <td>'+(this.expression_evaluated || this.expression)+'</td>\
                        <td>'+( this.period_number ? ((this.true_evals || 0 )+'/'+(this.period_number)) : '-' )+'</td>\
                        <td>'+(this.period || "-")+'</td>\
                        <td>'+(this.cooldown || "-")+'</td>\
                    </tr>'
                });

                info_str += '</tbody>\
                    </table>';
            }

            if (role.scheduled_policies && role.scheduled_policies.length > 0) {
                info_str += '<table class="dataTable extended_table policies_table">\
                    <thead style="background:#dfdfdf">\
                      <tr>\
                        <th colspan="5">'+tr("Scheduled policies")+'</th>\
                      </tr>\
                    </thead>\
                    <thead>\
                      <tr>\
                        <th style="width:14%">'+tr("Type")+'\
                            <span class="tip">'+tr("Type of adjustment.")+'<br><br>\
                                '+tr("CHANGE: Add/substract the given number of VMs.")+'<br>\
                                '+tr("CARDINALITY: Set the cardinality to the given number.")+'<br>\
                                '+tr("PERCENTAGE_CHANGE: Add/substract the given percentage to the current cardinality.")+'\
                            </span>\
                        </th>\
                        <th style="width:12%">'+tr("Adjust")+'\
                            <span class="tip">'+tr("Positive or negative adjustment. Its meaning depends on 'type'")+'<br><br>\
                                '+tr("CHANGE: -2, will substract 2 VMs from the role")+'<br>\
                                '+tr("CARDINALITY: 8, will set carditanilty to 8")+'<br>\
                                '+tr("PERCENTAGE_CHANGE: 20, will increment cardinality by 20%")+'\
                            </span>\
                        </th>\
                        <th style="width:9%">'+tr("Min")+'\
                            <span class="tip">'+tr("Optional parameter for PERCENTAGE_CHANGE adjustment type. If present, the policy will change the cardinality by at least the number of VMs set in this attribute.")+'\
                            </span>\
                        </th>\
                        <th style="width:28%">'+tr("Time format")+'\
                            <span class="tip">'+tr("Recurrence: Time for recurring adjustements. Time is specified with the Unix cron syntax")+'<br><br>\
                                '+tr("Start time: Exact time for the adjustement")+'\
                            </span>\
                        </th>\
                        <th style="width:33%">'+tr("Time expression")+'\
                            <span class="tip">'+tr("Time expression depends on the the time formar selected")+'<br><br>\
                                '+tr("Recurrence: Time for recurring adjustements. Time is specified with the Unix cron syntax")+'<br>\
                                '+tr("Start time: Exact time for the adjustement")+'<br>\
                            </span>\
                        </th>\
                      </tr>\
                    </thead>\
                    <tbody>';

                $.each(role.scheduled_policies, function(){
                    info_str += '<tr>\
                        <td>'+this.type+'</td>\
                        <td>'+this.adjust+'</td>\
                        <td>'+(this.min_adjust_step || "")+'</td>';

                    if (this['start_time']) {
                        info_str += '<td>start_time</td>';
                        info_str += '<td>'+this.start_time+'</td>';
                    } else if (this['recurrence']) {
                        info_str += '<td>recurrence</td>';
                        info_str += '<td>'+this.recurrence+'</td>';
                    }
                });

                info_str += '</tbody>\
                    </table>';
            }

            info_str += '</div>\
                    </form>'

            context.html(info_str);
            setupTips(context, "tip-top");

            var vms = [];
            serviceroleVMsDataTable = $('#datatable_service_vms_'+role.name, context).dataTable({
                "bSortClasses": false,
                "bDeferRender": true,
                "aoColumnDefs": [
                    { "bSortable": false, "aTargets": [0,1,8,9,11,13] },
                    { "sWidth": "35px", "aTargets": [0,1,2] },
                    { "bVisible": false, "aTargets": [8,9,12]}
                ]
            });

            if (role.nodes) {
                $.each(role.nodes, function(){
                    var vm_info = this.vm_info;

                    var info = [];
                    if (this.scale_up) {
                        info.push("<i class='fa fa-arrow-up'/>");
                    } else if (this.disposed) {
                        info.push("<i class='fa fa-arrow-down'/>");
                    } else {
                        info.push("");
                    }

                    if (elem_info.TEMPLATE.BODY.running_status_gate) {
                        if (vm_info.VM.USER_TEMPLATE.RUNNING == "YES") {
                            info.push('<span data-tooltip class="has-tip" title="'+tr("The VM is ready")+'"><i class="fa fa-check"/></span>');

                        } else {
                            info.push('<span data-tooltip class="has-tip" title="'+tr("Waiting for the VM to be ready")+'"><i class="fa fa-clock-o"/></span>');
                        }
                    } else {
                        info.push("");
                    }

                    if (vm_info) {
                      vms.push(info.concat(vMachineElementArray(vm_info)));
                    } else {
                        empty_arr = [
                            '<input class="check_item" type="checkbox" id="vm_'+this.deploy_id+'" name="selected_items" value="'+this.deploy_id+'"/>',
                            this.deploy_id,
                            '', '', '', '', '', '', '', '', '', '', "-" ];

                        vms.push(info.concat(empty_arr));
                    }
                });

                updateView(vms, serviceroleVMsDataTable);
            }


            insertButtonsInTab("oneflow-services", "service_roles_tab", role_vm_buttons, $('div#role_vms_actions'))

            $('tbody input.check_item',serviceroleVMsDataTable).die();
            $('tbody tr',serviceroleVMsDataTable).die();

            initCheckAllBoxes(serviceroleVMsDataTable, $('div#role_vms_actions'));
            tableCheckboxesListener(serviceroleVMsDataTable, $('div#role_vms_actions'));

            $('tbody tr',serviceroleVMsDataTable).live("click",function(e){
                if ($(e.target).is('input') ||
                    $(e.target).is('select') ||
                    $(e.target).is('option')) return true;

                if (e.ctrlKey || e.metaKey || $(e.target).is('input'))
                {
                    $('.check_item',this).trigger('click');
                }
                else
                {
                    var aData = serviceroleVMsDataTable.fnGetData(this);
                    if (!aData) return true;

                    var id = $(aData[2]).val();
                    if (!id) return true;

                    showElement("vms-tab", "VM.show", id);
/*
                    $('tbody input.check_item',$(this).parents('table')).removeAttr('checked');
                    $('.check_item',this).click();
                    $('td',$(this).parents('table')).removeClass('markrowchecked');

                    if(last_selected_row_rolevm) {
                        last_selected_row_rolevm.children().each(function(){
                            $(this).removeClass('markrowchecked');
                        });
                    }

                    last_selected_row_rolevm = $(this);
                    $(this).children().each(function(){
                        $(this).addClass('markrowchecked');
                    });
*/
                }
            });


            //insertButtonsInTab("oneflow-services", "service_roles_tab", role_buttons)
            //$('li#service_roles_tabTab').foundationButtons();
            //$('li#service_roles_tabTab').foundationButtons();
        }

        if(selected_row_role_id) {
            $.each($(servicerolesDataTable.fnGetNodes()),function(){
                if($($('td',this)[1]).html()==selected_row_role_id) {
                    $('td',this)[2].click();
                }
            });
        }

        if(checked_row_rolevm_ids.length!=0) {
            $.each($(serviceroleVMsDataTable.fnGetNodes()),function(){
                var current_id = $($('td',this)[1]).html();
                if (current_id) {
                    if(jQuery.inArray(current_id, checked_row_rolevm_ids)!=-1) {
                        $('input.check_item',this).first().click();
                        $('td',this).addClass('markrowchecked');
                    }
                }
            });
        }
        //setupActionButtons($('li#service_roles_tabTab'));
    }

    setupTips($("#roles_form"));
}

function setupScaleDialog(){
    dialogs_context.append('<div id="scale_dialog"></div>');
    $scale_dialog = $('#scale_dialog', dialogs_context);
    var dialog = $scale_dialog;

    dialog.html('<div class="row">\
      <h3 class="subheader">'+tr("Scale")+'</h3>\
    </div>\
    <form id="scale_form" action="">\
          <div class="row">\
              <div class="large-12 columns">\
                  <label for="cardinality">'+tr("Cardinality")+
                    '<span class="tip">'+ tr("Number of VMs to instantiate with this role") +'</span>'+
                  '</label>\
                  <input type="text" name="cardinality" id="cardinality"/>\
              </div>\
          </div>\
          <div class="row">\
              <div class="large-12 columns">\
                  <input type="checkbox" name="force" id="force"/><label class="inline" for="force">'+tr("Force")+
                    '<span class="tip">'+ tr("Force the new cardinality even if it is outside the limits") +'</span>'+
                  '</label>\
              </div>\
          </div>\
          <div class="form_buttons">\
              <button class="button radius right success" id="" type="submit" value="">'+tr("Scale")+'</button>\
          </div>\
      <a class="close-reveal-modal">&#215;</a>\
    </form></div>')

    dialog.addClass("reveal-modal").attr("data-reveal", "");
    setupTips(dialog);

    $('#scale_form',dialog).submit(function(){
        var force = false;
        if ($("#force", this).is(":checked")) {
          force = true;
        }

        var obj = {
          "force": force,
          "cardinality": $("#cardinality", this).val(),
        }

        Sunstone.runAction('Role.update', roleElements(), obj);

        $scale_dialog.foundation('reveal', 'close')
        return false;
    });
};


function popUpScaleDialog(){
    $scale_dialog.foundation().foundation('reveal', 'open');
    return false;
}

//The DOM is ready at this point
$(document).ready(function(){
    var tab_name = "oneflow-services";

    if (Config.isTabEnabled(tab_name)) {
        dataTable_services = $("#datatable_services",main_tabs_context).dataTable({
            "bSortClasses": false,
            "bDeferRender": true,
            "aoColumnDefs": [
                { "bSortable": false, "aTargets": ["check"] },
                { "sWidth": "35px", "aTargets": [0] },
                { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
                { "bVisible": false, "aTargets": ['_all']}
            ]
        });

        $('#services_search').keyup(function(){
          dataTable_services.fnFilter( $(this).val() );
        })

        dataTable_services.on('draw', function(){
          recountCheckboxes(dataTable_services);
        })

        Sunstone.runAction("Service.list");

        initCheckAllBoxes(dataTable_services);
        tableCheckboxesListener(dataTable_services);
        infoListener(dataTable_services,'Service.show');
        dataTable_services.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});
