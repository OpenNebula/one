// ------------------------------------------------------------------------ //
// Copyright 2010-2013, C12G Labs S.L.                                      //
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

var Service = {
    "resource" : 'DOCUMENT',
    "path"     : 'service',
    "shutdown": function(params){
        OpenNebula.Action.simple_action(params,
                                        Service.resource,
                                        "shutdown",
                                        action_obj,
                                        Service.path);
    },
    "del": function(params){
        OpenNebula.Action.del(params,Service.resource, Service.path);
    },
    "list" : function(params){
        OpenNebula.Action.list(params, Service.resource, Service.path)
    },
    "show" : function(params){
        OpenNebula.Action.show(params, Service.resource, false, Service.path)
    },
    "chown" : function(params){
        OpenNebula.Action.chown(params,Service.resource, Service.path);
    },
    "chgrp" : function(params){
        OpenNebula.Action.chgrp(params,Service.resource, Service.path);
    },
    "chmod" : function(params){
        var action_obj = params.data.extra_param;
        OpenNebula.Action.simple_action(params,
                                        Service.resource,
                                        "chmod",
                                        action_obj,
                                        Service.path);
    },
    "shutdown" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Service.resource,
                                        "shutdown",
                                        null,
                                        Service.path);
    },
    "recover" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Service.resource,
                                        "recover",
                                        null,
                                        Service.path);
    },
    "state" : function(state_int){
        var state = [
            tr("PENDING"),
            tr("DEPLOYING"),
            tr("RUNNING"),
            tr("UNDEPLOYING"),
            tr("WARNING"),
            tr("DONE"),
            tr("FAILED_UNDEPLOYING"),
            tr("FAILED_DEPLOYING"),
            tr("SCALING"),
            tr("FAILED_SCALING"),
            tr("COOLDOWN")
        ][state_int]
        return state ? state : state_int;
    }
}

var Role = {
    "resource" : 'DOCUMENT',
    "path"     : 'service',
    "state" : function(state_int){
        state_int = state_int ? state_int : 0;
        var state = [
            tr("PENDING"),
            tr("DEPLOYING"),
            tr("RUNNING"),
            tr("UNDEPLOYING"),
            tr("WARNING"),
            tr("DONE"),
            tr("FAILED_UNDEPLOYING"),
            tr("FAILED_DEPLOYING"),
            tr("SCALING"),
            tr("FAILED_SCALING"),
            tr("COOLDOWN")
        ][state_int]
        return state ? state : state_int;
    },
    "hold" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Service.resource,
                                        "hold",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "release" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "release",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "suspend" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "suspend",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "resume" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "resume",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "stop" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "stop",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "boot" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "boot",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "delete_recreate" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "delete-recreate",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "reboot" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "reboot",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "reboot_hard" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "reboot-hard",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "poweroff" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "poweroff",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "poweroff_hard" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "poweroff-hard",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "undeploy" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "undeploy",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "undeploy_hard" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "undeploy-hard",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "snapshot_create" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "snapshot-create",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "shutdown" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "shutdown",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "cancel" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "shutdown-hard",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "del" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "delete",
                                        generate_batch_action_params(),
                                        Role.path);
    },
    "recover" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "recover",
                                        null,
                                        Role.path);
    },
    "update" : function(params){
        request = OpenNebula.Helper.request(Role.resource, "update", params.data.id);

        $.ajax({
            url: Role.path + "/" + params.data.id,
            type: "PUT",
            dataType: "json",
            data: JSON.stringify(params.data.extra_param),
            success: function(response){
                return roleCallback(request, response);
            },
            error: function(response){
                return onError(request, OpenNebula.Error(response));
            }
        });
    }
}

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
        call: Role.update,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.hold" : {
        type: "multiple",
        call: Role.hold,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.release" : {
        type: "multiple",
        call: Role.release,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.suspend" : {
        type: "multiple",
        call: Role.suspend,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.resume" : {
        type: "multiple",
        call: Role.resume,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.stop" : {
        type: "multiple",
        call: Role.stop,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.boot" : {
        type: "multiple",
        call: Role.boot,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.reboot_hard" : {
        type: "multiple",
        call: Role.reboot_hard,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.delete_recreate" : {
        type: "multiple",
        call: Role.delete_recreate,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.reboot" : {
        type: "multiple",
        call: Role.reboot,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.poweroff" : {
        type: "multiple",
        call: Role.poweroff,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.poweroff_hard" : {
        type: "multiple",
        call: Role.poweroff_hard,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.undeploy" : {
        type: "multiple",
        call: Role.undeploy,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.undeploy_hard" : {
        type: "multiple",
        call: Role.undeploy_hard,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.snapshot_create" : {
        type: "single",
        call: Role.snapshot_create,
        callback: roleCallback,
        error:onError,
        notify: true
    },

    "Role.shutdown" : {
        type: "multiple",
        call: Role.shutdown,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.shutdown_hard" : {
        type: "multiple",
        call: Role.cancel,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.delete" : {
        type: "multiple",
        call: Role.del,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.recover" : {
        type: "multiple",
        call: Role.recover,
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
    return getSelectedNodes(servicerolesDataTable);
};

function roleVMElements() {
    return getSelectedNodes(serviceroleVMsDataTable);
};

function roleCallback() {
    return $("#service_info_panel_refresh", $("#service_info_panel")).click();
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
        text: '<i class="icon-play"/>',
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
//    "RoleVM.chown" : {
//        type: "confirm_with_select",
//        text: tr("Change owner"),
//        select: users_sel,
//        layout: "user_select",
//        tip: tr("Select the new owner")+":",
//        condition: mustBeAdmin
//    },
//
//    "RoleVM.chgrp" : {
//        type: "confirm_with_select",
//        text: tr("Change group"),
//        select: groups_sel,
//        layout: "user_select",
//        tip: tr("Select the new group")+":",
//        condition: mustBeAdmin
//    },
//    "RoleVM.deploy" : {
//        type: "confirm_with_select",
//        text: tr("Deploy"),
//        tip: tr("This will deploy the selected VMs on the chosen host"),
//        layout: "vmsplanification_buttons",
//        select: hosts_sel,
//        condition: mustBeAdmin
//    },
//    "RoleVM.migrate" : {
//        type: "confirm_with_select",
//        text: tr("Migrate"),
//        tip: tr("This will migrate the selected VMs to the chosen host"),
//        layout: "vmsplanification_buttons",
//        select: hosts_sel,
//        condition: mustBeAdmin
//
//    },
//    "RoleVM.migrate_live" : {
//        type: "confirm_with_select",
//        text: tr("Migrate") + ' <span class="label secondary radius">live</span>',
//        tip: tr("This will live-migrate the selected VMs to the chosen host"),
//        layout: "vmsplanification_buttons",
//        select: hosts_sel,
//        condition: mustBeAdmin
//    },
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
        text: '<i class="icon-play"/>',
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
    },
//    "RoleVM.recover" : {
//        type: "confirm_with_select",
//        text: tr("Recover"),
//        layout: "vmsplanification_buttons",
//        select: function(){ return '<option value="success">' + tr("success") + '</option>\
//                 <option value="failure">' + tr("failure") + '</option>'},
//        tip: tr("Recovers a stuck VM that is waiting for a driver operation. \
//                The recovery may be done by failing or succeeding the pending operation. \
//                YOU NEED TO MANUALLY CHECK THE VM STATUS ON THE HOST, to decide if the operation \
//                was successful or not.")
//    }
}

var service_tab_content = '\
<form class="custom" id="template_form" action="">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
       <i class="icon-code-fork icon-rotate-90"></i> '+tr("OneFlow - Services")+'\
      </span>\
      <span class="header-info">\
        <span/> <small></small>&emsp;\
      </span>\
      <span class="user-login">\
      </span>\
    </h4>\
  </div>\
</div>\
<div class="row">\
  <div class="nine columns">\
    <div class="action_blocks">\
    </div>\
  </div>\
  <div class="three columns">\
    <input id="services_search" type="text" placeholder="'+tr("Search")+'" />\
  </div>\
  <br>\
  <br>\
</div>\
</div>\
  <div class="row">\
    <div class="twelve columns">\
      <table id="datatable_services" class="datatable twelve">\
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
      </table>\
    </div>\
  </div>\
<div class="row" id="error_message" hidden>\
    <div class="alert-box alert">'+tr("Cannot connect to OneFlow server")+'<a href="" class="close">&times;</a></div>\
</div>\
</form>';

var dataTable_services;

var service_actions = {
    "Service.list" : {
        type: "list",
        call: Service.list,
        callback: function(request, service_list) {
            $("#oneflow-services #error_message").hide();
            updateServicesView(request, service_list);
        },
        error: function(request, error_json) {
            onError(request, error_json, $("#oneflow-services #error_message"));
        }
    },

    "Service.show" : {
        type : "single",
        call: Service.show,
        callback: updateServiceElement,
        error: onError
    },

    "Service.showinfo" : {
        type: "single",
        call: Service.show,
        callback: updateServiceInfo,
        error: onError
    },

    "Service.refresh" : {
        type: "custom",
        call: function () {
            waitingNodes(dataTable_services);
            Sunstone.runAction("Service.list");
        }
    },

    "Service.autorefresh" : {
        type: "custom",
        call: function() {
            Service.list({
                timeout: true, 
                success: function(request, service_list) {
                    $("#oneflow-services #error_message").hide();
                    updateServicesView(request, service_list);
                },
                error: function(request, error_json) {
                    onError(request, error_json, $("#oneflow-services #error_message"));
                }
            });
        }
    },

    "Service.delete" : {
        type: "multiple",
        call: Service.del,
        callback: deleteServiceElement,
        elements: serviceElements,
        error: onError,
        notify: true
    },

    "Service.chown" : {
        type: "multiple",
        call: Service.chown,
        callback:  function (req) {
            Sunstone.runAction("Service.show",req.request.data[0][0]);
        },
        elements: serviceElements,
        error: onError,
        notify: true
    },

    "Service.chgrp" : {
        type: "multiple",
        call: Service.chgrp,
        callback: function (req) {
            Sunstone.runAction("Service.show",req.request.data[0][0]);
        },
        elements: serviceElements,
        error: onError,
        notify: true
    },

    "Service.chmod" : {
        type: "single",
        call: Service.chmod,
        error: onError,
        notify: true
    },

    "Service.shutdown" : {
        type: "multiple",
        call: Service.shutdown,
        elements: serviceElements,
        error: onError,
        notify: true
    },

    "Service.recover" : {
        type: "multiple",
        call: Service.recover,
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

    "Service.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: users_sel,
        tip: tr("Select the new owner")+":",
        layout: "user_select"
    },
    "Service.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: groups_sel,
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
    content: service_tab_content,
    buttons: service_buttons,
    tabClass: 'subTab',
    parentTab: 'oneflow-dashboard'
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
        Service.state(service.TEMPLATE.BODY.state)
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
        title: tr("Information"),
        content:
        '<div class="">\
          <div class="six columns">\
          <table id="info_template_table" class="twelve datatable extended_table">\
           <thead>\
             <tr><th colspan="2">'+tr("Service")+' \"'+elem_info.NAME+'\"'+'</th></tr>\
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
             <td class="value_td">'+ Service.state(elem_info.TEMPLATE.BODY.state) +'</td>\
           </tr>\
         </table>' +
       '</div>\
        <div class="six columns">' + insert_permissions_table('oneflow-services',
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
        content : '<form class="custom" id="roles_form" action="">\
          <div id="role_actions">\
            <div class="action_blocks columns eight">\
            </div>\
            <div class="columns four">\
              <div class="row">\
                    <div class="two columns">\
                        <label class="inline right" for="batch_action_period">' + tr("Period") + ':</label>\
                    </div>\
                    <div class="two columns">\
                        <input type="text" id="batch_action_period" name="batch_action_period"/>\
                    </div>\
                    <div class="one columns">\
                        <div class="tip">'+ tr("Seconds between each group of actions") +'</div>\
                    </div>\
                    <div class="four columns">\
                        <label class="inline right" for="batch_action_number">' + tr("Number") + ':</label>\
                    </div>\
                    <div class="two columns">\
                        <input type="text" id="batch_action_number" name="batch_action_number"/>\
                    </div>\
                    <div class="one columns">\
                        <div class="tip">'+ tr("Number of VMs to apply the action to each period") +'</div>\
                    </div>\
              </div>\
            </div>\
          </div>\
          <div id="roles_info" class="columns twelve">\
            <table id="datatable_service_roles" class="table twelve">\
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
        </form>'
    };

    Sunstone.updateInfoPanelTab("service_info_panel", "service_roles_tab",roles_tab);

    var logs = elem_info.TEMPLATE.BODY.log
    var log_info = ''
    if (logs) {
        log_info += '<div class="twelve columns"><div class="log-tab">'

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
      title: "Logs",
      content: log_info
    }


    Sunstone.updateInfoPanelTab("service_info_panel", "service_log_tab",logs_tab);


    // Popup panel
    Sunstone.popUpInfoPanel("service_info_panel", "oneflow-services");
    setPermissionsTable(elem_info,'');

    $("#service_info_panel_refresh", $("#service_info_panel")).click(function(){
        $(this).html(spinner);
        selected_row_role_id = $($('td.markrowselected',servicerolesDataTable.fnGetNodes())[1]).html();
        checked_row_rolevm_ids = new Array();

        if (typeof(serviceroleVMsDataTable) !== 'undefined') {
            $.each($(serviceroleVMsDataTable.fnGetNodes()), function(){
               if($('td.markrowchecked',this).length!=0)
               {
                 checked_row_rolevm_ids.push($($('td',$(this))[1]).html());
               }
            });
        }
        Sunstone.runAction('Service.showinfo', elem_info.ID);
    })

    var roles = elem_info.TEMPLATE.BODY.roles
    if (roles && roles.length) {
        servicerolesDataTable = $('#datatable_service_roles').dataTable({
            "bSortClasses": false,
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
                Role.state(this.state),
                this.cardinality,
                this.vm_template,
                this.parents ? this.parents.join(', ') : '-'
            ])
        });

        updateView(role_elements ,servicerolesDataTable);

        insertButtonsInTab("oneflow-services", "service_roles_tab", role_buttons, $('#role_actions', $("#dialog")))
        $('#role_actions', $("#dialog")).foundationButtons();
        $('#role_actions', $("#dialog")).foundationButtons();

        setupScaleDialog();

        $('tbody input.check_item',servicerolesDataTable).die();
        $('tbody tr',servicerolesDataTable).die();

        initCheckAllBoxes(servicerolesDataTable, $('#role_actions', $("#dialog")));
        tableCheckboxesListener(servicerolesDataTable, $('#role_actions', $("#dialog")));

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
                        $(this).removeClass('markrowselected');
                    });
                }

                last_selected_row_role = $(this);
                $(this).children().each(function(){
                    $(this).addClass('markrowselected');
                });
            }

            //if($(this).is(":checked"))
            //{
            //    $(this).parents('tr').children().each(function(){$(this).addClass('markrowchecked');});
            //}
            //else
            //{
            //    $(this).parents('tr').children().removeClass('markrowchecked');
            //    $(this).parents('tr').children().removeClass('markrowselected');
            //}
//
            //recountCheckboxes(datatable);
        });

        var generate_role_div = function(role_index) {
            var role = roles[role_index]
            var info_str = "<form>\
                <fieldset>\
                <legend>"+tr("Role")+" - "+role.name+"</legend>\
                <div class='twelve columns'>\
                    <table class='twelve datatable extended_table policies_table'>\
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
                 </div>";

            info_str += '<fieldset>\
                <legend>'+tr("Virtual Machines")+'</legend>\
                <div id="role_vms_actions">\
                    <div class="action_blocks columns twelve">\
                    </div>\
                </div>\
                <div class="columns twelve">\
                    <br>\
                    <table id="datatable_service_vms_'+role.name+'" class="table datatable twelve ">\
                      <thead>\
                        <tr>\
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

            info_str += "<div class='twelve columns'><br>";

            if (role.elasticity_policies && role.elasticity_policies.length > 0) {
                info_str += '<table class="twelve datatable extended_table policies_table">\
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
                        <td>'+(this.true_evals || 0 )+'/'+ this.period+'</td>\
                        <td>'+(this.period_number || "-")+'</td>\
                        <td>'+(this.cooldown || "-")+'</td>\
                    </tr>'
                });

                info_str += '</tbody>\
                    </table>';
            }

            if (role.scheduled_policies && role.scheduled_policies.length > 0) {
                info_str += '<table class="twelve datatable extended_table policies_table">\
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
                </fieldset>\
                    </form>'

            context.html(info_str);
            setupTips(context, "tip-top");

            var vms = [];
            serviceroleVMsDataTable = $('#datatable_service_vms_'+role.name, context).dataTable({
                "aoColumnDefs": [
                    { "bSortable": false, "aTargets": [0,1,7,8,10,12] },
                    { "sWidth": "35px", "aTargets": [0,1] },
                    { "bVisible": false, "aTargets": [7,8,11]}
                ]
            });

            if (role.nodes) {
                $.each(role.nodes, function(){
                    var vm_info = this.vm_info;

                    var info = [];
                    if (this.scale_up) {
                        info.push("<i class='icon-arrow-up'/>");
                    } else if (this.disposed) {
                        info.push("<i class='icon-arrow-down'/>");
                    } else {
                        info.push("");
                    }

                    if (vm_info) {
                      vms.push(info.concat(vMachineElementArray(vm_info)));
                    } else {
                        empty_arr = [
                            '<input class="check_item" type="checkbox" id="vm_'+this.deploy_id+'" name="selected_items" value="'+this.deploy_id+'"/>',
                            this.deploy_id,
                            '', '', '', '', '', '', '', '', '', '' ];

                        vms.push(info.concat(empty_arr));
                    }
                });

                updateView(vms, serviceroleVMsDataTable);
            }


            insertButtonsInTab("oneflow-services", "service_roles_tab", role_vm_buttons, $('div#role_vms_actions', $("#dialog")))
            $('div#role_vms_actions', $("#dialog")).foundationButtons();
            $('div#role_vms_actions', $("#dialog")).foundationButtons();

            $('tbody input.check_item',serviceroleVMsDataTable).die();
            $('tbody tr',serviceroleVMsDataTable).die();

            initCheckAllBoxes(serviceroleVMsDataTable, $('div#role_vms_actions', $("#dialog")));
            tableCheckboxesListener(serviceroleVMsDataTable, $('div#role_vms_actions', $("#dialog")));

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
                }
            });


            //insertButtonsInTab("oneflow-services", "service_roles_tab", role_buttons)
            //$('li#service_roles_tabTab', $("#dialog")).foundationButtons();
            //$('li#service_roles_tabTab', $("#dialog")).foundationButtons();
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
        //setupActionButtons($('li#service_roles_tabTab', $("#dialog")));
    }


    //$('tbody tr',serviceroleVMsDataTable).click(function(e){
    //    var aData = serviceroleVMsDataTable.fnGetData(this);
    //    var id = aData[1];
    //    if (!id) return true;
    //    if ($(e.target).is('img')) return true;
//
    //    //open the Vresources submenu in case it was closed
    //    var vres_menu = $('div#menu li#li_vres_tab')
    //    $('li.vres_tab', vres_menu.parent()).fadeIn('fast');
    //    $('span', vres_menu).removeClass('ui-icon-circle-plus');
    //    $('span', vres_menu).addClass('ui-icon-circle-minus');
//
    //    showTab('vms_tab');
//
    //    popDialogLoading();
    //    Sunstone.runAction("VM.showinfo", id)
    //    return false;
    //});


    setupTips($("#roles_form"));
}

function setupScaleDialog(){
    dialogs_context.append('<div id="scale_dialog"></div>');
    $scale_dialog = $('#scale_dialog', dialogs_context);
    var dialog = $scale_dialog;

    dialog.html('<div class="panel">\
      <h3>\
        <small id="">'+tr("Scale")+'</small>\
      </h3>\
    </div>\
    <form id="scale_form" action="">\
          <div class="row">\
              <div class="four columns">\
                  <label class="inline right" for="cardinality">'+tr("Cardinality")+':</label>\
              </div>\
              <div class="seven columns">\
                  <input type="text" name="cardinality" id="cardinality"/>\
              </div>\
              <div class="one columns">\
                  <div class="tip">'+ tr("Number of VMs to instantiate with this role") +'</div>\
              </div>\
          </div>\
          <div class="row">\
              <div class="four columns">\
                  <label class="inline right" for="force">'+tr("Force")+':</label>\
              </div>\
              <div class="two columns">\
                  <input type="checkbox" name="force" id="force"/>\
              </div>\
              <div class="one columns pull-five">\
                  <div class="tip">'+ tr("Force the new cardinality even if it is outside the limits") +'</div>\
              </div>\
          </div>\
          <hr>\
          <div class="form_buttons">\
              <button class="button radius right success" id="" type="submit" value="">'+tr("Scale")+'</button>\
              <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
          </div>\
      <a class="close-reveal-modal">&#215;</a>\
    </form></div>')

    dialog.addClass("reveal-modal");
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

        $scale_dialog.trigger("reveal:close")
        return false;
    });
};


function popUpScaleDialog(){
    $scale_dialog.reveal();
    return false;
}

// Set the autorefresh interval for the datatable
function setServiceAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_services);
        var filter = $("#services_search").attr('value');
        if ((checked.length==0) && !filter){
            Sunstone.runAction("Service.autorefresh");
        }
    },INTERVAL+someTime());
};

//The DOM is ready at this point
$(document).ready(function(){
    var tab_name = "oneflow-services";

    if (Config.isTabEnabled(tab_name)) {
        dataTable_services = $("#datatable_services",main_tabs_context).dataTable({
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

        setServiceAutorefresh();

        initCheckAllBoxes(dataTable_services);
        tableCheckboxesListener(dataTable_services);
        infoListener(dataTable_services,'Service.showinfo');
    }
});
