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
            tr("FAILED"),
            tr("UNKNOWN"),
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
            tr("FAILED"),
            tr("UNKNOWN"),
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
                                        null,
                                        Role.path);
    },
    "release" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "release",
                                        null,
                                        Role.path);
    },
    "suspend" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "suspend",
                                        null,
                                        Role.path);
    },
    "resume" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "resume",
                                        null,
                                        Role.path);
    },
    "stop" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "stop",
                                        null,
                                        Role.path);
    },
    "restart" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "restart",
                                        null,
                                        Role.path);
    },
    "reset" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "reset",
                                        null,
                                        Role.path);
    },
    "resubmit" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "resubmit",
                                        null,
                                        Role.path);
    },
    "reboot" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "reboot",
                                        null,
                                        Role.path);
    },
    "poweroff" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "poweroff",
                                        null,
                                        Role.path);
    },
    "poweroff_hard" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "poweroff_hard",
                                        null,
                                        Role.path);
    },
    "snapshot_create" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "snapshot_create",
                                        null,
                                        Role.path);
    },
    "shutdown" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "shutdown",
                                        null,
                                        Role.path);
    },
    "cancel" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "cancel",
                                        null,
                                        Role.path);
    },
    "del" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "delete",
                                        null,
                                        Role.path);
    },
    "recover" : function(params){
        OpenNebula.Action.simple_action(params,
                                        Role.resource,
                                        "recover",
                                        null,
                                        Role.path);
    },
}

var role_actions = {
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
        call: Role.restart,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.reboot_hard" : {
        type: "multiple",
        call: Role.reset,
        callback: roleCallback,
        elements: roleElements,
        error: onError,
        notify: true
    },

    "Role.delete_recreate" : {
        type: "multiple",
        call: Role.resubmit,
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
    }

};

Sunstone.addActions(role_actions);

function roleElements() {
    return getSelectedNodes(servicerolesDataTable);
};

function roleCallback() {
    return $("#service_info_panel_refresh", $("#service_info_panel")).click();
}

var role_buttons = {
    "Role.hold" : {
        type: "action",
        text: tr("Hold"),
        tip: tr("This will hold selected pending VMs from being deployed"),
        layout: "vmsplanification_buttons",
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
    "Role.shutdown" : {
        type: "confirm",
        text: tr("Shutdown"),
        layout: "vmsdelete_buttons",
        tip: tr("This will initiate the shutdown process in the selected VMs")
    },
    "Role.shutdown_hard" : {
        type: "confirm",
        text: tr("Shutdown") + ' <span class="label secondary radius">hard</span>',
        layout: "vmsdelete_buttons",
        tip: tr("This will initiate the shutdown-hard (forced) process in the selected VMs")
    },
    "Role.delete" : {
        type: "confirm",
        text: tr("Delete"),
        layout: "vmsdelete_buttons",
        tip: tr("This will delete the selected VMs from the database")
    },
    "Role.delete_recreate" : {
        type: "confirm",
        text: tr("Delete") + ' <span class="label secondary radius">recreate</span>',
        layout: "vmsrepeat_buttons",
        tip: tr("This will delete and recreate VMs to PENDING state")
    }
}

var service_tab_content = '\
<form class="custom" id="template_form" action="">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
       <i class="icon-magic"></i> '+tr("AppFlow - Services")+'\
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
</form>';


var dataTable_services;

var service_actions = {
    "Service.list" : {
        type: "list",
        call: Service.list,
        callback: updateServicesView,
        error: onError
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
            Service.list({timeout: true, success: updateServicesView, error: onError});
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
        layout: "user_select",
        condition: mustBeAdmin
    },
    "Service.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: groups_sel,
        tip: tr("Select the new group")+":",
        layout: "user_select",
        condition: mustBeAdmin
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
    parentTab: 'appflow_dashboard_tab'
}

Sunstone.addActions(service_actions);
Sunstone.addMainTab('apptools-appflow-services',services_tab);
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
    //updateVResDashboard("images",images_list);
    updateAppFlowDashboard('services', service_list_array);
}

// Callback to refresh the list of Virtual Machines
function updateServiceVMInfo(vmachine_list){
    var vmachine_list_array = [];

    $.each(vmachine_list,function(){
        vmachine_list_array.push( vMachineElementArray(this));
    });

    updateView(vmachine_list_array, servicevmsDataTable);
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
             <tr><th colspan="2">'+tr("Service Template")+' \"'+elem_info.NAME+'\"'+'</th></tr>\
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
             <td class="key_td">'+tr("State")+'</td>\
             <td class="value_td">'+ Service.state(elem_info.TEMPLATE.BODY.state) +'</td>\
           </tr>\
         </table>' +
       '</div>\
        <div class="six columns">' + insert_permissions_table('apptools-appflow-services',
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
          <div class="">\
            <div class="action_blocks columns twelve">\
            </div>\
          </div>\
          <div id="roles_info" class="columns twelve">\
          <br>\
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
    Sunstone.popUpInfoPanel("service_info_panel", "apptools-appflow-services");
    setPermissionsTable(elem_info,'');

    $("#service_info_panel_refresh", $("#service_info_panel")).click(function(){
      $(this).html(spinner);
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

            var info_str = "<fieldset>\
                <legend>"+tr("Role")+" - "+this.name+"</legend>";

            info_str += "<div class='three columns'>\
                <table class='twelve datatable extended_table'>\
                    <thead>\
                        <tr><th colspan='2'></th></tr>\
                    </thead>\
                    <tbody>";

            if (this.min_vms) {
                info_str += "<tr>\
                     <td class='key_td'>"+tr("Min VMs")+"</td>\
                     <td class='value_td'>"+this.min_vms+"</td>\
                   </tr>";
            }
            if (this.max_vms) {
                info_str += "<tr>\
                     <td class='key_td'>"+tr("Max VMs")+"</td>\
                     <td class='value_td'>"+this.max_vms+"</td>\
                   </tr>";
            }
            if (this.cooldown) {
                info_str += "<tr>\
                     <td class='key_td'>"+tr("Cooldown")+"</td>\
                     <td class='value_td'>"+this.cooldown+"</td>\
                   </tr>";
            }

            info_str += "</tbody>\
                </table>";


            info_str += "</div>\
            <div class='nine columns'>";

            if (this.elasticity_policies && this.elasticity_policies.length > 0) {
                info_str += '<table class="twelve datatable extended_table">\
                    <thead style="background:#dfdfdf">\
                      <tr>\
                        <th colspan="6">'+tr("Elasticity policies")+'</th>\
                      </tr>\
                    </thead>\
                    <thead>\
                      <tr>\
                        <th>'+tr("Type")+'</th>\
                        <th>'+tr("Adjust")+'</th>\
                        <th>'+tr("Expression")+'</th>\
                        <th>'+tr("# Periods")+'</th>\
                        <th>'+tr("Step")+'</th>\
                        <th>'+tr("Cooldown")+'</th>\
                      </tr>\
                    </thead>\
                    <tbody>';

                $.each(this.elasticity_policies, function(){
                    info_str += '<tr>\
                        <td>'+this.type+'</td>\
                        <td>'+this.adjust+'</td>\
                        <td>'+this.expression+'</td>\
                        <td>'+this.period+'</td>\
                        <td>'+this.period_number+'</td>\
                        <td>'+this.cooldown+'</td>\
                    </tr>'
                });

                info_str += '</tbody>\
                    </table>';
            }

            if (this.scheduled_policies && this.scheduled_policies.length > 0) {
                info_str += '<table class="twelve datatable extended_table">\
                    <thead style="background:#dfdfdf">\
                      <tr>\
                        <th colspan="4">'+tr("Scheduled policies")+'</th>\
                      </tr>\
                    </thead>\
                    <thead>\
                      <tr>\
                        <th>'+tr("Type")+'</th>\
                        <th>'+tr("Adjust")+'</th>\
                        <th>'+tr("Time format")+'</th>\
                        <th>'+tr("Time expression")+'</th>\
                      </tr>\
                    </thead>\
                    <tbody>';

                $.each(this.scheduled_policies, function(){
                    info_str += '<tr>\
                        <td>'+this.type+'</td>\
                        <td>'+this.adjust+'</td>';

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
                <div class="columns twelve">\
                    <table id="datatable_service_vms_'+this.name+'" class="table datatable twelve">\
                      <thead>\
                        <tr>\
                          <th></th>\
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
                </div>';

            info_str += "</fieldset>"
            $(info_str).appendTo(context);

            var vms = [];
            var servicevmsDataTable = $('#datatable_service_vms_'+this.name, context).dataTable({
                "aoColumnDefs": [
                    { "bSortable": false, "aTargets": [0,6,7,9,11] },
                    { "sWidth": "35px", "aTargets": [0] },
                    { "bVisible": false, "aTargets": [6,7,10]}
                ]
            });

            if (this.nodes) {
                $.each(this.nodes, function(){
                    var vm_info = this.vm_info;
                    if (vm_info) {
                      vms.push([""].concat(vMachineElementArray(vm_info).slice(1)));
                    }
                });

                updateView(vms, servicevmsDataTable);
            }
        });

        updateView(role_elements ,servicerolesDataTable);
        insertButtonsInTab("apptools-appflow-services", "service_roles_tab", role_buttons)
        $('li#service_roles_tabTab', $("#dialog")).foundationButtons();
        $('li#service_roles_tabTab', $("#dialog")).foundationButtons();
        //setupActionButtons($('li#service_roles_tabTab', $("#dialog")));

        initCheckAllBoxes(servicerolesDataTable);
        tableCheckboxesListener(servicerolesDataTable);
    }


    //$('tbody tr',servicevmsDataTable).click(function(e){
    //    var aData = servicevmsDataTable.fnGetData(this);
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
    var tab_name = "apptools-appflow-services";

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
});
