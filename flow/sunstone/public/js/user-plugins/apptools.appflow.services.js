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
            tr("DONE")
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
            tr("DONE")
        ][state_int]
        return state ? state : state_int;
    }
}

var service_tab_content = '\
<h2><i class="icon-magic"></i> '+tr("AppFlow - Services")+'</h2>\
<form id="service_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_services" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">'+tr("All")+'</input></th>\
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
<!--\
<div class="legend_div">\
  <span>?</span>\
<p class="legend_p">\
'+tr("Size and registration time are hidden colums. Note that persistent images can only be used by 1 VM. To change image datastore, please re-register the image.")+'\
</p>\
</div>\
-->\
</form>';
/*+++++++++++++++++++++++++++++++
var create_service_tmpl = '\
<div class="create_form"><form id="create_service_form" action="">\
  <fieldset>\
      <legend style="display:none;">' + tr("Flowironment") + '</legend>\
      <div class="service_param">\
          <label for="name">' + tr("Name") + ':</label><input type="text" name="name" />\
      </div>\
      <div class="service_param">\
          <label for="description">' + tr("Description") + ':</label><input type="text" name="description" />\
      </div>\
      <div class="service_param">\
          <label for="templates">'+tr("Compatible templates")+':</label>\
          <select type="text" name="templates" multiple>\
          </select>\
      </div>\
      <div class="service_param">\
          <label for="cookbooks">' + tr("Cookbooks URL") + ':</label><input type="text" name="cookbooks" />\
      </div>\
  </fieldset>\
<!--\
  <fieldset>\
      <div class="service_param">\
         <label for="node">'+tr("Variables")+':</label>\
          <div class="clear"></div>\
         <label for="custom_var_service_name">'+tr("Name")+':</label>\
         <input type="text" id="custom_var_service_name" name="custom_var_service_name" /><br />\
         <label for="custom_var_service_value">'+tr("Value")+':</label>\
         <input type="text" id="custom_var_service_value" name="custom_var_service_value" /><br />\
         <button class="add_remove_button add_button" id="add_custom_var_service_button" value="add_custom_service_var">'+tr("Add")+'</button>\
         <button class="add_remove_button" id="remove_custom_var_service_button" value="remove_custom_service_var">'+tr("Remove selected")+'</button>\
         <div class="clear"></div>\
         <label for="custom_var_service_box">'+tr("Custom attributes")+':</label>\
         <select id="custom_var_service_box" name="custom_var_service_box" style="height:100px;" multiple>\
         </select>\
      </div>\
  </fieldset>\
-->\
  <fieldset>\
      <div class="service_param">\
          <label for="node">'+tr("Node")+':</label>\
          <div class="clear"></div>\
          <textarea name="node" style="width:100%; height:14em;"></textarea>\
      </div>\
  </fieldset>\
  <fieldset>\
    <div class="form_buttons">\
        <div><button class="button" type="submit" value="Service.create">' + tr("Create") + '</button>\
        <button class="button" type="reset" value="reset">' + tr("Reset") + '</button></div>\
    </div>\
  </fieldset>\
</form></div>';
*/


var update_service_tmpl =
   '<form action="javascript:alert(\'js error!\');">\
         <h3 style="margin-bottom:10px;">'+tr("Please, choose and modify the service")+':</h3>\
            <fieldset style="border-top:none;">\
                 <label for="service_update_select">'+tr("Select a template")+':</label>\
                 <select id="service_update_select" name="service_update_select"></select>\
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
                         <td style="text-align:center"><input type="checkbox" name="serv_owner_u" class="owner_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="serv_owner_m" class="owner_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="serv_owner_a" class="owner_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Group")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="serv_group_u" class="group_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="serv_group_m" class="group_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="serv_group_a" class="group_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Other")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="serv_other_u" class="other_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="serv_other_m" class="other_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="serv_other_a" class="other_a" /></td>\
                     </tr>\
                   </table>\
                 </div>\
            </fieldset>\
            <fieldset>\
                 <div class="form_buttons">\
                    <button class="button" id="service_update_button" value="Service.update_template">\
                       '+tr("Update")+'\
                    </button>\
                 </div>\
            </fieldset>\
</form>';

var dataTable_services;
//var $create_service_dialog;

var service_actions = {
    "Service.list" : {
        type: "list",
        call: Service.list,
        callback: updateServicesView,
        error: onError
    },

    "Service.update_dialog" : {
        type : "custom",
        call : popUpServiceUpdateDialog
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

    "Service.fetch_permissions" : {
        type : "single",
        call : Service.show,
        callback : function(request, json){
            var dialog = $('#service_update_dialog form');
            var tmpl = json.DOCUMENT;
            setPermissionsTable(tmpl, dialog);
        },
        error: onError
    },

    "Service.shutdown" : {
        type: "multiple",
        call: Service.shutdown,
        elements: serviceElements,
        error: onError,
        notify: true
    },

/*
    "Service.clone_dialog" : {
        type: "custom",
        call: popUpServiceCloneDialog
    },
    "Service.clone" : {
        type: "single",
        call: Service.clone,
        error: onError,
        notify: true
    },
*/

    "Service.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#services_tab div.legend_div').slideToggle();
        }
    }
};


var service_buttons = {
    "Service.refresh" : {
        type: "action",
        text: '<i class="icon-refresh icon-large">',
        alwaysActive: true
    },

    "Service.update_dialog" : {
        type: "action",
        text: tr("Update properties"),
        alwaysActive: true
    },

    "Service.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: users_sel,
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "Service.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: groups_sel,
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
/*
    "Service.clone_dialog" : {
        type: "action",
        text: tr("Clone")
    },
*/
    "Service.shutdown" : {
        type: "action",
        text: tr("Shutdown")
    },
    "Service.delete" : {
        type: "confirm",
        text: tr("Delete"),
        tip: tr("This will delete the selected services")
    },
    "Service.help" : {
        type: "action",
        text: '?',
        alwaysActive: true
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
Sunstone.addMainTab('services_tab',services_tab);
Sunstone.addInfoPanel('service_info_panel',service_info_panel);


function serviceElements() {
    return getSelectedNodes(dataTable_services);
}

// Returns an array containing the values of the service_json and ready
// to be inserted in the dataTable
function serviceElementArray(service_json){
    //Changing this? It may affect to the is_persistent() functions.
    var service = service_json.DOCUMENT;
    //var body = JSON.parse(service.TEMPLATE.BODY);
    //var description =  body.description;

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

    /*
    elem_info.TEMPLATE.BODY = JSON.parse(elem_info.TEMPLATE.BODY);

    // Form trs for variables
    var vars = '';
    var defaults = elem_info.TEMPLATE.BODY.defaults;
    if (!$.isEmptyObject(defaults)){
        for (key in defaults){
            vars += '<tr>\
              <td class="key_td">'+ key +'</td>\
              <td class="value_td">\
              <input type="text" name="'+ key +'"value="'+ defaults[key] +'"></input>\
              </td></tr>';
    };
    }

    // Form options of compatible templates
    var compat_templates = '';
    var templates = elem_info.TEMPLATE.BODY.templates;
    if (templates)
        for (var i = 0; i < templates.length; i++)
            compat_templates += '<option value="'+ templates[i] +'">\
                                 '+ getTemplateName(templates[i]) +'\
                                 </option>';
*/



    var info_tab = {
        title: tr("Information"),
        content:
        '<table id="info_template_table" class="info_table" style="width:80%">\
           <thead>\
             <tr><th colspan="2">'+tr("Service")+' \"'+elem_info.NAME+'\" '+
            tr("information")+'</th></tr>\
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
             <td class="key_td">'+tr("State")+'</td>\
             <td class="value_td">'+ Service.state(elem_info.TEMPLATE.BODY.state) +'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Owner")+'</td>\
             <td class="value_td">'+elem_info.UNAME+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Group")+'</td>\
             <td class="value_td">'+elem_info.GNAME+'</td>\
           </tr>\
           <tr><td class="key_td">'+tr("Permissions")+'</td><td></td></tr>\
           <tr>\
             <td class="key_td">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Owner")+'</td>\
             <td class="value_td" style="font-family:monospace;">'+ownerPermStr(elem_info)+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Group")+'</td>\
             <td class="value_td" style="font-family:monospace;">'+groupPermStr(elem_info)+'</td>\
           </tr>\
           <tr>\
             <td class="key_td"> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Other")+'</td>\
             <td class="value_td" style="font-family:monospace;">'+otherPermStr(elem_info)+'</td>\
           </tr>\
           <tr>\
             <td class="key_td">'+tr("Strategy")+'</td>\
             <td class="value_td">'+elem_info.TEMPLATE.BODY.deployment+'</td>\
           </tr>\
         </table>'
    }

    var roles_info = '<table id="service_template_roles_table" class="info_table" style="width:80%;">\
            <thead></thead>'

    var roles = elem_info.TEMPLATE.BODY.roles
    if (roles && roles.length)
        for (var i = 0; i < roles.length; i++) {
          roles_info += '<tr><td class="key_td">'+tr("Role")+' '+roles[i].name+'</td><td></td></tr>\
            <tr>\
             <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("State")+'</td>\
             <td class="value_td" style="font-family:monospace;">'+Role.state(roles[i].state)+'</td>\
            </tr>\
            <tr>\
             <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Cardinality")+'</td>\
             <td class="value_td" style="font-family:monospace;">'+roles[i].cardinality+'</td>\
            </tr>\
            <tr>\
             <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("VM Template")+'</td>\
             <td class="value_td" style="font-family:monospace;">'+roles[i].vm_template+'</td>\
            </tr>'

          if (roles[i].parents)
            roles_info += '<tr>\
              <td > &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Parents")+'</td>\
              <td class="value_td" style="font-family:monospace;">'+roles[i].parents.join(', ')+'</td>\
            </tr>'
        }

    roles_info += '</table>'

    var roles_tab = {
        title: tr("Roles"),
        content: roles_info
    }

    var vms_tab = {
        title : "Virtual Machines",
        content : '\
<div style="padding: 10px 10px;">\
<table id="datatable_service_vms" class="display">\
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
      <th>'+tr("VNC Access")+'</th>\
    </tr>\
  </thead>\
  <tbody>\
  </tbody>\
</table></div>'
    };

    var logs = elem_info.TEMPLATE.BODY.log
    var log_info = ''
    if (logs) {
        log_info += '<table id="service_template_roles_table" class="info_table" style="width:80%;">\
            <thead></thead>'
        
        for (var i = 0; i < logs.length; i++) {
          log_info += '<tr>\
              <td>'+pretty_time(logs[i].timestamp)+' ['+logs[i].severity + '] ' + logs[i].message+ '</td>\
              </tr>'
        }

        log_info += '</table>'
    }

    var logs_tab = {
      title: "Logs",
      content: log_info
    }

    var roles = elem_info.TEMPLATE.BODY.roles;
    if (!roles) roles = [];

    Sunstone.updateInfoPanelTab("service_info_panel",
                                "service_info_tab",info_tab);
    if (roles.length){
        Sunstone.addInfoPanelTab("service_info_panel",
                                 "service_role_tab",roles_tab);
        Sunstone.updateInfoPanelTab("service_info_panel",
                                    "service_vms_tab",vms_tab);
    }
    else {
        Sunstone.removeInfoPanelTab("service_info_panel",
                                    "service_role_tab");
        Sunstone.removeInfoPanelTab("service_info_panel",
                                    "service_vms_tab");
    };

    Sunstone.updateInfoPanelTab("service_info_panel",
                                "service_log_tab",logs_tab);

    // Popup panel
    Sunstone.popUpInfoPanel("service_info_panel");

    if (!roles.length) return;

    var vms = [];
    for (var i=0; i < roles.length; i++)
      if (roles[i].nodes) {
        for (var j=0; j < roles[i].nodes.length; j++){
            var vm_info = roles[i].nodes[j].vm_info;
            if (vm_info)
                vms.push(
                    [roles[i].name].concat(
                        vMachineElementArray(vm_info).slice(1)
                    )
            );
        };
      };

    var servicevmsDataTable = $('#datatable_service_vms').dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sPaginationType": "full_numbers",
        "bAutoWidth":false,
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "aoColumnDefs": [
           { "sWidth": "60px", "aTargets": [6,7] },
            { "sWidth": "35px", "aTargets": [1, 11] },
            { "sWidth": "150px", "aTargets": [5,10] },
            { "sWidth": "100px", "aTargets": [2,3,9] },
            { "bVisible": false, "aTargets": [6,7,10]}
        ]
    });

    updateView(vms, servicevmsDataTable);


    $('tbody tr',servicevmsDataTable).click(function(e){
        var aData = servicevmsDataTable.fnGetData(this);
        var id = aData[1];
        if (!id) return true;
        if ($(e.target).is('img')) return true;

        //open the Vresources submenu in case it was closed
        var vres_menu = $('div#menu li#li_vres_tab')
        $('li.vres_tab', vres_menu.parent()).fadeIn('fast');
        $('span', vres_menu).removeClass('ui-icon-circle-plus');
        $('span', vres_menu).addClass('ui-icon-circle-minus');

        showTab('vms_tab');

        popDialogLoading();
        Sunstone.runAction("VM.showinfo", id)
        return false;
    });
}


function setupServiceUpdateDialog(){
    //Append to DOM
    dialogs_context.append('<div id="service_update_dialog" title="'+tr("Update Service properties")+'"></div>');
    var dialog = $('#service_update_dialog', dialogs_context);

    //Put HTML in place
    dialog.html(update_service_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    //Convert into jQuery
    dialog.dialog({
        autoOpen:false,
        width:500,
        modal:true,
        height:height,
        resizable:true
    });

    $('button',dialog).button();

    $('#service_update_select',dialog).change(function(){
        var id = $(this).val();
        $('.permissions_table input', dialog).removeAttr('checked');
        $('.permissions_table', dialog).removeAttr('update');
        if (id && id.length){
            Sunstone.runAction("Service.fetch_permissions", id);
        };
    });

    $('.permissions_table input',dialog).change(function(){
        $(this).parents('table').attr('update','update');
    });

    $('form',dialog).submit(function(){
        var dialog = $(this);
        var id = $('#service_update_select',dialog).val();
        if (!id || !id.length) {
            $(this).parents('#service_update_dialog').dialog('close');
            return false;
        };

        var permissions = $('.permissions_table',dialog);
        if (permissions.attr('update')){
            var perms = {
                octet : buildOctet(permissions)
            };
            Sunstone.runAction("Service.chmod", id, perms);
        };

        $(this).parents('#service_update_dialog').dialog('close');
        return false;
    });
};


function popUpServiceUpdateDialog(){
    var select = makeSelectOptions(dataTable_services,
                                   1,//id_col
                                   4,//name_col
                                   [],
                                   []
                                  );
    var sel_elems = getSelectedNodes(dataTable_services);


    var dialog =  $('#service_update_dialog');
    $('#service_update_select', dialog).html(select);
//    $('#service_update_textarea',dialog).val("");
    $('.permissions_table input', dialog).removeAttr('checked');
    $('.permissions_table', dialog).removeAttr('update');

    if (sel_elems.length >= 1){ //several items in the list are selected
        //grep them
        var new_select= sel_elems.length > 1? '<option value="">Please select</option>' : "";
        $('option','<select>'+select+'</select>').each(function(){
            var val = $(this).val();
            if ($.inArray(val,sel_elems) >= 0){
                new_select+='<option value="'+val+'">'+$(this).text()+'</option>';
            };
        });
        $('#service_update_select', dialog).html(new_select);
        if (sel_elems.length == 1) {
            $('#service_update_select option',
              dialog).attr('selected','selected');
            $('#service_update_select', dialog).trigger("change");
        };
    };

    dialog.dialog('open');
    return false;
}


// Set the autorefresh interval for the datatable
function setServiceAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_services);
        var filter = $("#datatable_services_filter input",
                       dataTable_services.parents("#datatable_services_wrapper")).attr('value');
        if (!checked.length && !filter.length){
            Sunstone.runAction("Service.autorefresh");
        }
    },INTERVAL+someTime());
};

/*
function setupServiceCloneDialog(){
    //Append to DOM
    dialogs_context.append('<div id="service_clone_dialog" title="'+tr("Clone an flowironment")+'"></div>');
    var dialog = $('#service_clone_dialog',dialogs_context);

    //Put HTML in place

    var html = '<form><fieldset>\
<div class="clone_one">'+tr("Choose a new name for the flowironment")+':</div>\
<div class="clone_several">'+tr("Several flowironments are selected, please choose prefix to name the new copies")+':</div>\
<br />\
<label class="clone_one">'+tr("Name")+':</label>\
<label class="clone_several">'+tr("Prefix")+':</label>\
<input type="text" name="name"></input>\
<div class="form_buttons">\
  <button class="button" id="service_clone_button" value="Service.clone">\
'+tr("Clone")+'\
  </button>\
</div></fieldset></form>\
';

    dialog.html(html);

    //Convert into jQuery
    dialog.dialog({
        autoOpen:false,
        width:375,
        modal:true,
        resizable:false
    });

    $('button',dialog).button();

    $('form',dialog).submit(function(){
        var name = $('input', this).val();
        var sel_elems = serviceElements();
        if (!name || !sel_elems.length)
            notifyError('A name or prefix is needed!');
        if (sel_elems.length > 1){
            for (var i=0; i< sel_elems.length; i++)
                //If we are cloning several items we
                //use the name as prefix
                Sunstone.runAction('Service.clone',
                                   sel_elems[i],
                                   name + getName(sel_elems[i],
                                                  dataTable_services,
                                                  4));
        } else {
            Sunstone.runAction('Service.clone',sel_elems[0],name)
        };
        dialog.dialog('close');
        setTimeout(function(){
            Sunstone.runAction('Service.refresh');
        }, 1500);
        return false;
    });
}

function popUpServiceCloneDialog(){
    var dialog = $('#service_clone_dialog');
    var sel_elems = serviceElements();
    //show different text depending on how many elements are selected
    if (sel_elems.length > 1){
        $('.clone_one',dialog).hide();
        $('.clone_several',dialog).show();
        $('input',dialog).val('Copy of ');
    }
    else {
        $('.clone_one',dialog).show();
        $('.clone_several',dialog).hide();
        $('input',dialog).val('Copy of '+getName(sel_elems[0],
                                                 dataTable_services, 4));
    };

    $(dialog).dialog('open');
}

*/

//The DOM is ready at this point
$(document).ready(function(){

    dataTable_services = $("#datatable_services",main_tabs_context).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "100px", "aTargets": [2,3] },
            { "sWidth": "200px", "aTargets": [5] },
            { "sWidth": "35px", "aTargets": [1] }
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });



    dataTable_services.fnClearTable();
    addElement([
        spinner,
        '','','','','',''],dataTable_services);
    Sunstone.runAction("Service.list");

    setupServiceUpdateDialog();

//    setupImageCloneDialog();
    setServiceAutorefresh();

    initCheckAllBoxes(dataTable_services);
    tableCheckboxesListener(dataTable_services);
    infoListener(dataTable_services,'Service.showinfo');

    $('div#services_tab div.legend_div').hide();
});
