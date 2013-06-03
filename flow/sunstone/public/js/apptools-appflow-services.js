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
            tr("FAILED_DEPLOYING")
        ][state_int]
        return state ? state : state_int;
    }
}

var Role = {
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
            tr("FAILED_DEPLOYING")
        ][state_int]
        return state ? state : state_int;
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
        content : '<div class="columns twelve">\
          <div id="roles_info">\
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
          </div>'
    };

    Sunstone.updateInfoPanelTab("service_info_panel", "service_roles_tab",roles_tab);

    var vms_tab = {
        title : "Virtual Machines",
        content : '<div class="columns twelve">\
          <div id="datatable_cluster_hosts_info_div">\
            <table id="datatable_service_vms" class="table twelve">\
              <thead>\
                <tr>\
                  <th>'+tr("Role")+'</th>\
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
          </div>'
    };

    Sunstone.updateInfoPanelTab("service_info_panel", "service_vms_tab",vms_tab);


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
        var servicerolesDataTable = $('#datatable_service_roles').dataTable({
            "bSortClasses": false,
            "bAutoWidth":false,
            "sDom" : '<"H">t<"F"p>'
        });

        var role_elements = [];
        for (var i = 0; i < roles.length; i++) {
          role_elements.push([
            '<input class="check_item" type="checkbox" id="role_'+roles[i].name+'" name="selected_items" value="'+roles[i].name+'"/>',
            roles[i].name,
            Role.state(roles[i].state),
            roles[i].cardinality,
            roles[i].vm_template,
            roles[i].parents ? roles[i].parents.join(', ') : '-'
          ])
        }

        updateView(role_elements ,servicerolesDataTable);


        var servicevmsDataTable = $('#datatable_service_vms').dataTable({
            "bSortClasses": false,
            "bAutoWidth":false,
            "sDom" : '<"H">t<"F"p>',
            "aoColumnDefs": [
               { "sWidth": "60px", "aTargets": [6,7] },
                { "sWidth": "35px", "aTargets": [1, 11] },
                { "sWidth": "150px", "aTargets": [5,10] },
                { "sWidth": "100px", "aTargets": [2,3,9] },
                { "bVisible": false, "aTargets": [6,7,10]}
            ]
        });

        var vms = [];
        for (var i=0; i < roles.length; i++) {
          if (roles[i].nodes) {
            for (var j=0; j < roles[i].nodes.length; j++){
                var vm_info = roles[i].nodes[j].vm_info;
                if (vm_info) {
                  vms.push([roles[i].name].concat(vMachineElementArray(vm_info).slice(1)));
                }
            };
          };
        };

        updateView(vms, servicevmsDataTable);
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
        "sDom" : "<'H'>t<'row'<'six columns'i><'six columns'p>>",
        "oColVis": {
            "aiExclude": [ 0 ]
        },
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
