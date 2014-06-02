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
var selected_row_template_role_id;
var last_selected_row_template_role;

var ServiceTemplate = {
    "resource" : 'DOCUMENT',
    "path"     : 'service_template',
    "create": function(params){
        params.cache_name = "SERVICE_TEMPLATE";
        OpenNebula.Action.create(params, ServiceTemplate.resource, ServiceTemplate.path);
    },

    "instantiate": function(params){
        var action_obj = params.data.extra_param;
        OpenNebula.Action.simple_action(params,
                                        ServiceTemplate.resource,
                                        "instantiate",
                                        action_obj,
                                        ServiceTemplate.path);
    },
    "update": function(params){
        var action_obj = {"template_json" : params.data.extra_param };
        OpenNebula.Action.simple_action(params,
                                        ServiceTemplate.resource,
                                        "update",
                                        action_obj,
                                        ServiceTemplate.path);
    },
    "del": function(params){
        params.cache_name = "SERVICE_TEMPLATE";
        OpenNebula.Action.del(params,ServiceTemplate.resource, ServiceTemplate.path);
    },
    "list" : function(params){
        params.cache_name = "SERVICE_TEMPLATE";
        OpenNebula.Action.list(params, ServiceTemplate.resource, ServiceTemplate.path)
    },
    "show" : function(params){
        OpenNebula.Action.show(params, ServiceTemplate.resource, false, ServiceTemplate.path)
    },
    "chown" : function(params){
        OpenNebula.Action.chown(params,ServiceTemplate.resource, ServiceTemplate.path);
    },
    "chgrp" : function(params){
        OpenNebula.Action.chgrp(params,ServiceTemplate.resource, ServiceTemplate.path);
    },
    "chmod" : function(params){
        var action_obj = params.data.extra_param;
        OpenNebula.Action.simple_action(params,
                                        ServiceTemplate.resource,
                                        "chmod",
                                        action_obj,
                                        ServiceTemplate.path);
    }
}

var create_service_template_tmpl = '\
<div class="row">\
    <div class="large-12 columns">\
    <h3 id="create_service_template_header" class="subheader">'+tr("Create Service Template")+'</h3>\
    <h3 id="update_service_template_header" class="subheader" hidden>'+tr("Update Service Template")+'</h3>\
    </div>\
</div>\
<div class="reveal-body create_form">\
  <form id="create_service_template_form" action="">\
    <div class="row">\
        <div class="service_template_param st_man large-6 columns">\
            <label for="service_name">' + tr("Name") +
                '<span class="tip">'+ tr("Name for this template") +'</span>'+
            '</label>'+
            '<input type="text" id="service_name" name="service_name" />\
        </div>\
        <div class="service_template_param st_man large-6 columns">\
            <div class="row">\
                <div class="service_template_param st_man large-6 columns">\
                    <label for="deployment">' + tr("Strategy") +
                        '<span class="tip">'+ tr("Straight strategy will instantiate each role in order: parents role will be deployed before their children. None strategy will instantiate the roles regardless of their relationships.") +'</span>'+
                    '</label>\
                    <select name="deployment">\
                        <option value="straight">'+ tr("Straight") + '</option>\
                        <option value="none">'+ tr("None") + '</option>\
                    </select>\
                </div>\
                <div class="service_template_param st_man large-6 columns">\
                    <label for="shutdown_action_service">' + tr("Shutdown action") +
                        '<span class="tip">'+ tr("VM shutdown action: 'shutdown' or 'shutdown-hard'.") +'</span>'+
                    '</label>\
                    <select name="shutdown_action_service">\
                        <option value=""></option>\
                        <option value="shutdown">'+tr("Shutdown")+'</option>\
                        <option value="shutdown-hard">'+tr("Shutdown hard")+'</option>\
                    </select>\
                </div>\
            </div>\
        </div>\
    </div>\
    <br>\
    <br>\
    <div id="new_role">\
           <dl class="tabs vertical" id="roles_tabs" data-tab>\
            <dt class="text-center"><div type="button" class="button tiny radius" id="tf_btn_roles"><span class="fa fa-plus"></span> '+tr("Add another role")+'</div></dt>\
           </dl>\
           <div class="tabs-content vertical" id="roles_tabs_content">\
           </div>\
    </div>\
    <div class="reveal-footer">\
      <div class="form_buttons">\
          <button id="create_service_template_submit" class="button radius right success"" type="action" value="ServiceTemplate.create">' + tr("Create") + '</button>\
          <button id="update_service_template_submit" class="button radius right success"" type="action" value="ServiceTemplate.update" hidden>' + tr("Update") + '</button>\
          <button id="create_service_template_reset" class="button radius secondary" type="reset" value="reset">' + tr("Reset") + '</button>\
      </div>\
    </div>\
    <a class="close-reveal-modal">&#215;</a>\
  </form>\
</div>';

var role_tab_content = '\
<div class="row">\
    <div class="service_template_param service_role st_man large-6 columns">\
              <label for="name">' + tr("Role Name") +
                '<span class="tip">'+ tr("Name of the role") +'</span>'+
              '</label>\
              <input type="text" id="role_name" name="name"/>\
    </div>\
    <div class="service_template_param service_role large-6 columns">\
                <label for="vm_template">' + tr("VM template") +
                    '<span class="tip">'+ tr("Template associated to this role") +'</span>'+
                '</label>\
                <div id="vm_template">\
                </div>\
    </div>\
</div>\
<div class="row">\
    <div class="service_template_param service_role large-3 columns">\
        <label for="cardinality">' + tr("Cardinality") +
            '<span class="tip">'+ tr("Number of VMs to instantiate with this role") +'</span>'+
        '</label>\
        <input type="text" id="cardinality" name="cardinality" value="1" />\
    </div>\
    <div class="service_template_param service_role large-3 columns">\
        <label for="shutdown_action_role">' + tr("Shutdown action") +
            '<span class="tip">'+ tr("VM shutdown action: 'shutdown' or 'shutdown-hard'. If it is not set, the one set for the Service will be used") +'</span>'+
        '</label>\
        <select name="shutdown_action_role">\
            <option value=""></option>\
            <option value="shutdown">'+tr("Shutdown")+'</option>\
            <option value="shutdown-hard">'+tr("Shutdown hard")+'</option>\
        </select>\
    </div>\
    <div class="service_template_param service_role large-6 columns">\
        <table id="parent_roles" class="extended_table dataTable">\
            <thead>\
                <tr><th colspan="2">'+tr("Parent roles")+'</th></tr>\
            </thead>\
            <tbody id="parent_roles_body">\
            </tbody>\
        </table>\
    </div>\
</div>\
<br>\
<div class="row">\
    <div class="large-12 columns">\
        <h5>'+tr("Elasticity")+'</h5>\
    </div>\
</div>\
<div class="row">\
    <div class="large-3 columns">\
            <label for="min_vms">' + tr("Min VMs") +
                '<span class="tip">'+ tr("Minimum number of VMs for elasticity adjustments") +'</span>'+
            '</label>\
            <input type="text" id="min_vms" name="min_vms" value="" />\
    </div>\
    <div class="large-3 columns">\
            <label for="max_vms">' + tr("Max VMs") +
                '<span class="tip">'+ tr("Maximum number of VMs for elasticity adjustments") +'</span>'+
            '</label>\
            <input type="text" id="max_vms" name="max_vms" value="" />\
    </div>\
    <div class="large-3 columns">\
            <label for="cooldown">' + tr("Cooldown") +
                '<span class="tip">'+ tr("Cooldown time after an elasticity operation (secs)") +'</span>'+
            '</label>\
            <input type="text" id="cooldown" name="cooldown" value="" />\
    </div>\
    <div class="large-3 columns">\
    </div>\
</div>\
<div class="row">\
    <div class="large-12 columns">\
          <table id="elasticity_policies_table" class="policies_table dataTable">\
                <thead style="background:#dfdfdf">\
                  <tr>\
                    <th colspan="8">\
                        '+tr("Elasticty policies")+'\
                        <div type="button" class="button tiny radius right secondary" id="tf_btn_elas_policies"><span class="fa fa-plus"></span> '+tr("Add")+'</div>\
                    </th>\
                  </tr>\
                </thead>\
                <thead>\
                  <tr>\
                    <th style="width:14%">'+tr("Type")+'\
                        <br><span class="tip">'+tr("Type of adjustment.")+'<br><br>\
                            '+tr("CHANGE: Add/substract the given number of VMs.")+'<br>\
                            '+tr("CARDINALITY: Set the cardinality to the given number.")+'<br>\
                            '+tr("PERCENTAGE_CHANGE: Add/substract the given percentage to the current cardinality.")+'\
                        </span>\
                    </th>\
                    <th style="width:12%">'+tr("Adjust")+'\
                        <br><span class="tip">'+tr("Positive or negative adjustment. Its meaning depends on 'type'")+'<br><br>\
                            '+tr("CHANGE: -2, will substract 2 VMs from the role")+'<br>\
                            '+tr("CARDINALITY: 8, will set carditanilty to 8")+'<br>\
                            '+tr("PERCENTAGE_CHANGE: 20, will increment cardinality by 20%")+'\
                        </span>\
                    </th>\
                    <th style="width:9%">'+tr("Min")+'\
                        <br><span class="tip">'+tr("Optional parameter for PERCENTAGE_CHANGE adjustment type. If present, the policy will change the cardinality by at least the number of VMs set in this attribute.")+'\
                        </span>\
                    </th>\
                    <th style="width:30%">'+tr("Expression")+'\
                        <br><span class="tip">'+tr("Expression to trigger the elasticity")+'<br><br>\
                            '+tr("Example: ATT < 20")+'<br>\
                        </span>\
                    </th>\
                    <th style="width:8%">#\
                        <br><span class="tip">'+tr("Number of periods that the expression must be true before the elasticity is triggered")+'\
                        </span>\
                    </th>\
                    <th style="width:9%">'+tr("Period")+'\
                        <br><span class="tip">'+tr("Duration, in seconds, of each period in '# Periods'")+'\
                        </span>\
                    </th>\
                    <th style="width:15%">'+tr("Cooldown")+'\
                        <br><span class="tip">'+tr("Cooldown period duration after a scale operation, in seconds")+'\
                        </span>\
                    </th>\
                    <th style="width:3%"></th>\
                  </tr>\
                </thead>\
                <tbody id="elasticity_policies_tbody">\
                </tbody>\
          </table>\
    </div>\
</div>\
<div class="row">\
    <div class="large-12 columns">\
          <table id="scheduled_policies_table" class="policies_table dataTable">\
                <thead style="background:#dfdfdf">\
                  <tr>\
                    <th colspan="6">\
                        '+tr("Scheduled policies")+'\
                        <div type="button" class="button tiny radius right secondary" id="tf_btn_sche_policies"><span class="fa fa-plus"></span> '+tr("Add")+'</div>\
                    </th>\
                  </tr>\
                </thead>\
                <thead>\
                  <tr>\
                    <th style="width:14%">'+tr("Type")+'\
                        <br><span class="tip">'+tr("Type of adjustment.")+'<br><br>\
                            '+tr("CHANGE: Add/substract the given number of VMs.")+'<br>\
                            '+tr("CARDINALITY: Set the cardinality to the given number.")+'<br>\
                            '+tr("PERCENTAGE_CHANGE: Add/substract the given percentage to the current cardinality.")+'\
                        </span>\
                    </th>\
                    <th style="width:12%">'+tr("Adjust")+'\
                        <br><span class="tip">'+tr("Positive or negative adjustment. Its meaning depends on 'type'")+'<br><br>\
                            '+tr("CHANGE: -2, will substract 2 VMs from the role")+'<br>\
                            '+tr("CARDINALITY: 8, will set carditanilty to 8")+'<br>\
                            '+tr("PERCENTAGE_CHANGE: 20, will increment cardinality by 20%")+'\
                        </span>\
                    </th>\
                    <th style="width:9%">'+tr("Min")+'\
                        <br><span class="tip">'+tr("Optional parameter for PERCENTAGE_CHANGE adjustment type. If present, the policy will change the cardinality by at least the number of VMs set in this attribute.")+'\
                        </span>\
                    </th>\
                    <th style="width:28%">'+tr("Time format")+'\
                        <br><span class="tip">'+tr("Recurrence: Time for recurring adjustements. Time is specified with the Unix cron syntax")+'<br><br>\
                            '+tr("Start time: Exact time for the adjustement")+'\
                        </span>\
                    </th>\
                    <th style="width:33%">'+tr("Time expression")+'\
                        <br><span class="tip">'+tr("Time expression depends on the the time formar selected")+'<br><br>\
                            '+tr("Recurrence: Time for recurring adjustements. Time is specified with the Unix cron syntax")+'<br>\
                            '+tr("Start time: Exact time for the adjustement")+'<br>\
                        </span>\
                    </th>\
                    <th style="width:3%"></th>\
                  </tr>\
                </thead>\
                <tbody id="scheduled_policies_tbody">\
                </tbody>\
          </table>\
    </div>\
</div>';

var dataTable_service_templates;
var $create_service_template_dialog;

var service_template_actions = {

    "ServiceTemplate.create" : {
        type: "create",
        call: ServiceTemplate.create,
        callback: function(request, response) {
            //empty creation dialog roles after successful creation
/*
            var dialog = $create_service_template_dialog;
            $('table#current_roles tbody', dialog).empty();
            $('select[name="parents"]', dialog).empty();
            dialog.foundation('reveal', 'close');
*/
            $create_service_template_dialog.foundation('reveal', 'close')
            $create_service_template_dialog.empty();

            addServiceTemplateElement(request, response);
            notifyCustom(tr("Service Template created"), " ID: " + response.DOCUMENT.ID, false);
        },
        error: onError
    },

    "ServiceTemplate.create_dialog" : {
        type : "custom",
        call: popUpCreateServiceTemplateDialog
    },

    "ServiceTemplate.update_dialog" : {
        type : "single",
        call: popUpUpdateServiceTemplateDialog,
        error: onError
    },

    "ServiceTemplate.show_to_update" : {
        type : "single",
        call: ServiceTemplate.show,
        callback: fillUpUpdateServiceTemplateDialog,
        error: onError
    },

    "ServiceTemplate.update" : {  // Update template
        type: "single",
        call: ServiceTemplate.update,
        callback: function(request,response){
            $create_service_template_dialog.foundation('reveal', 'close');
            Sunstone.runAction("ServiceTemplate.show",request.request.data[0][0]);

            notifyMessage(tr("ServiceTemplate updated correctly"));
        },
        error: onError
    },

    "ServiceTemplate.list" : {
        type: "list",
        call: ServiceTemplate.list,
        callback: function(request, service_list) {
            $("#oneflow-templates #error_message").hide();
            updateServiceTemplatesView(request, service_list);
        },
        error: function(request, error_json) {
            onError(request, error_json, $("#oneflow-templates #error_message"))
        }
    },

    "ServiceTemplate.show" : {
        type : "single",
        call: ServiceTemplate.show,
        callback: function(request, response){
            var tab = dataTable_service_templates.parents(".tab");

            if (Sunstone.rightInfoVisible(tab)) {
                // individual view
                updateServiceTemplateInfo(request, response);
            }

            // datatable row
            updateServiceTemplateElement(request, response);
        },
        error: onError
    },

    "ServiceTemplate.instantiate" : {
        type: "multiple",
        call: ServiceTemplate.instantiate,
        callback: function(req){
            OpenNebula.Helper.clear_cache("SERVICE");
        },
        elements: serviceTemplateElements,
        error: onError,
        notify: true
    },

    "ServiceTemplate.refresh" : {
        type: "custom",
        call: function () {
          var tab = dataTable_service_templates.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("ServiceTemplate.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_service_templates);
            Sunstone.runAction("ServiceTemplate.list", {force: true});
          }
        }
    },

    "ServiceTemplate.delete" : {
        type: "multiple",
        call: ServiceTemplate.del,
        callback: deleteServiceTemplateElement,
        elements: serviceTemplateElements,
        error: onError,
        notify: true
    },

    "ServiceTemplate.chown" : {
        type: "multiple",
        call: ServiceTemplate.chown,
        callback:  function (req) {
            Sunstone.runAction("ServiceTemplate.show",req.request.data[0][0]);
        },
        elements: serviceTemplateElements,
        error: onError,
        notify: true
    },

    "ServiceTemplate.chgrp" : {
        type: "multiple",
        call: ServiceTemplate.chgrp,
        callback: function (req) {
            Sunstone.runAction("ServiceTemplate.show",req.request.data[0][0]);
        },
        elements: serviceTemplateElements,
        error: onError,
        notify: true
    },

    "ServiceTemplate.chmod" : {
        type: "single",
        call: ServiceTemplate.chmod,
        error: onError,
        notify: true
    },

    "ServiceTemplate.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#service_templates_tab div.legend_div').slideToggle();
        }
    }
};


var service_template_buttons = {
    "ServiceTemplate.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },
    "ServiceTemplate.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "ServiceTemplate.instantiate" : {
        type: "action",
        layout: "main",
        text: tr("Instantiate")
    },
    "ServiceTemplate.update_dialog" : {
        type: "action",
        layout: "main",
        text: tr("Update")
    },
    "ServiceTemplate.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: "User",
        layout: "user_select",
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "ServiceTemplate.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: "Group",
        layout: "user_select",
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },

    "ServiceTemplate.delete" : {
        type: "confirm",
        text: tr("Delete"),
        layout: "del",
        tip: tr("This will delete the selected templates")
    }
}

var service_template_info_panel = {
    "service_template_info_tab" : {
        title: tr("Service information"),
        content: ""
    }
}

var service_templates_tab = {
    title: "Templates",
    resource: 'ServiceTemplate',
    buttons: service_template_buttons,
    tabClass: 'subTab',
    parentTab: 'oneflow-dashboard',
    search_input: '<input id="service_templates_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-file-o"></i>&emsp;'+tr("OneFlow - Templates"),
    info_header: '<i class="fa fa-fw fa-file-o"></i>&emsp;'+tr("OneFlow - Template"),
    subheader: '<span/> <small></small>&emsp;',
    content:   '<div class="row" id="error_message" hidden>\
        <div class="small-6 columns small-centered text-center">\
            <div class="alert-box alert radius">'+tr("Cannot connect to OneFlow server")+'</div>\
        </div>\
    </div>',
    table: '<table id="datatable_service_templates" class="datatable twelve">\
        <thead>\
          <tr>\
            <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
            <th>'+tr("ID")+'</th>\
            <th>'+tr("Owner")+'</th>\
            <th>'+tr("Group")+'</th>\
            <th>'+tr("Name")+'</th>\
          </tr>\
        </thead>\
        <tbody>\
        </tbody>\
      </table>'
}

Sunstone.addActions(service_template_actions);
Sunstone.addMainTab('oneflow-templates',service_templates_tab);
Sunstone.addInfoPanel('service_template_info_panel',service_template_info_panel);


function serviceTemplateElements() {
    return getSelectedNodes(dataTable_service_templates);
}

// Returns an array containing the values of the service_template_json and ready
// to be inserted in the dataTable
function serviceTemplateElementArray(service_template_json){
    var service_template = service_template_json.DOCUMENT;

    return [
        '<input class="check_item" type="checkbox" id="service_template_'+service_template.ID+'" name="selected_items" value="'+service_template.ID+'"/>',
        service_template.ID,
        service_template.UNAME,
        service_template.GNAME,
        service_template.NAME
    ];
}

// Callback to update an element in the dataTable
function updateServiceTemplateElement(request, service_template_json){
    var id = service_template_json.DOCUMENT.ID;
    var element = serviceTemplateElementArray(service_template_json);
    updateSingleElement(element,dataTable_service_templates,'#service_template_'+id);
}

// Callback to remove an element from the dataTable
function deleteServiceTemplateElement(req){
    deleteElement(dataTable_service_templates,'#service_template_'+req.request.data);
}

// Callback to add an service_template element
function addServiceTemplateElement(request, service_template_json){
    var element = serviceTemplateElementArray(service_template_json);
    addElement(element,dataTable_service_templates);
}

// Callback to refresh the list
function updateServiceTemplatesView(request, service_templates_list){
    var service_template_list_array = [];

    $.each(service_templates_list,function(){
       service_template_list_array.push(serviceTemplateElementArray(this));
    });

    updateView(service_template_list_array,dataTable_service_templates);
}

// Callback to update the information panel tabs and pop it up
function updateServiceTemplateInfo(request,elem){
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
             <td class="value_td">'+elem_info.TEMPLATE.BODY.shutdown_action+'</td>\
           </tr>\
         </table>' +
       '</div>\
        <div class="large-6 columns">' + insert_permissions_table('oneflow-templates',
                                                              "ServiceTemplate",
                                                              elem_info.ID,
                                                              elem_info.UNAME,
                                                              elem_info.GNAME,
                                                              elem_info.UID,
                                                              elem_info.GID) +
        '</div>\
     </div>'
    };

    Sunstone.updateInfoPanelTab("service_template_info_panel","service_template_info_tab",info_tab);

    var roles_tab = {
        title : "Roles",
        icon: "fa-wrench",
        content : '<form class="custom" id="roles_form" action="">\
          <div id="roles_info" class="row>\
            <div class="large-12 columns>\
                <table id="datatable_service_template_roles" class="table twelve">\
                  <thead>\
                    <tr>\
                      <th>'+tr("Name")+'</th>\
                      <th>'+tr("Cardinality")+'</th>\
                      <th>'+tr("VM Template")+'</th>\
                      <th>'+tr("Parents")+'</th>\
                    </tr>\
                  </thead>\
                  <tbody>\
                  </tbody>\
                </table>\
              <div id="roles_extended_info" class="columns twelve">\
                <span class="radius secondary label">'+tr("Select a role in the table for more information")+'</span>\
              </div>\
            </div>\
          </div>\
        </form>'
    };

    Sunstone.updateInfoPanelTab("service_template_info_panel", "service_template_roles_tab",roles_tab);

    Sunstone.popUpInfoPanel("service_template_info_panel", "oneflow-templates");

    setPermissionsTable(elem_info,'');

    var roles = elem_info.TEMPLATE.BODY.roles
    if (roles && roles.length) {
        serviceTemplaterolesDataTable = $('#datatable_service_template_roles').dataTable({
            "bSortClasses": false,
            "bDeferRender": true,
            "bAutoWidth":false,
            "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] }
            ],
            "sDom" : '<"H">t<"F"p>'
        });

        var context = $("#roles_extended_info", $("#service_template_info_panel"));
        var role_elements = [];
        $.each(roles, function(){
            role_elements.push([
                this.name,
                this.cardinality,
                this.vm_template,
                this.parents ? this.parents.join(', ') : '-'
            ])

            updateView(role_elements ,serviceTemplaterolesDataTable);

            $('tbody tr',serviceTemplaterolesDataTable).die();
            $('tbody tr',serviceTemplaterolesDataTable).live("click",function(e){
                var aData = serviceTemplaterolesDataTable.fnGetData(this);
                var role_name = $(aData[0]).val();

                var role_index = serviceTemplaterolesDataTable.fnGetPosition(this);

                generate_template_role_div(role_index);

                if(last_selected_row_template_role) {
                    last_selected_row_template_role.children().each(function(){
                        $(this).removeClass('markrowchecked');
                    });
                }

                last_selected_row_template_role = $(this);
                $(this).children().each(function(){
                    $(this).addClass('markrowchecked');
                });
            });
        });

        var generate_template_role_div = function(role_index) {
            var role = roles[role_index]
            var info_str = '<form>\
                <fieldset>\
                <legend>'+tr("Role")+' - '+role.name+'</legend>';

            info_str += "<div class='large-12 columns'>\
                <table class='dataTable extended_table policies_table'>\
                    <thead>\
                        <tr><th colspan='8'>"+tr("Information")+"</th></tr>\
                    </thead>\
                    <tbody>";

            info_str += "<tr>\
                 <td class='key_td'>"+tr("Shutdown action")+"</td>\
                 <td class='value_td'>"+(role.shutdown_action || "-")+"</td>\
                 <td class='key_td'>"+tr("Cooldown")+"</td>\
                 <td class='value_td'>"+(role.cooldown || "-")+"</td>\
                 <td class='key_td'>"+tr("Min VMs")+"</td>\
                 <td class='value_td'>"+(role.min_vms || "-")+"</td>\
                 <td class='key_td'>"+tr("Max VMs")+"</td>\
                 <td class='value_td'>"+(role.max_vms || "-")+"</td>\
               </tr>";

            info_str += "</tbody>\
                </table>";


            info_str += "</div>\
            <div class='large-12 columns'>";

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
                        <th style="width:20%">'+tr("Expression")+'\
                            <span class="tip">'+tr("Expression to trigger the elasticity")+'<br><br>\
                                '+tr("Example: ATT < 20")+'<br>\
                            </span>\
                        </th>\
                        <th style="width:15%">'+tr("# Periods")+'\
                            <span class="tip">'+tr("Number of periods that the expression must be true before the elasticity is triggered")+'\
                            </span>\
                        </th>\
                        <th style="width:12%">'+tr("Period")+'\
                            <span class="tip">'+tr("Duration, in seconds, of each period in '# Periods'")+'\
                            </span>\
                        </th>\
                        <th style="width:15%">'+tr("Cooldown")+'\
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
                        <td>'+this.expression+'</td>\
                        <td>'+(this.period_number || "-")+'</td>\
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
                        <td>'+(this.min_adjust_step || "-")+'</td>';

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
        }

        if(selected_row_template_role_id) {
            $.each($(serviceTemplaterolesDataTable.fnGetNodes()),function(){
                if($($('td',this)[1]).html()==selected_row_template_role_id) {
                    $('td',this)[2].click();
                }
            });
        }
    }

    setupTips($("#roles_form"));
}

function setup_policy_tab_content(policy_section, html_policy_id) {
    setupTips(policy_section);

    return false;
}

function setup_role_tab_content(role_section, html_role_id) {
    setupTips(role_section);

    insertSelectOptions('div#vm_template', role_section, "Template", null, false);

    $("#role_name", role_section).change(function(){
        $("#" + html_role_id +" #role_name_text").html($(this).val());
        $("#role_name_text", role_section).html($(this).val());
    });

    $("select#type").live("change", function(){
        var new_tr = $(this).closest('tr');
        if ($(this).val() == "PERCENTAGE_CHANGE") {
            $("#min_adjust_step_td", new_tr).html('<input type="text" id="min_adjust_step" name="min_adjust_step"/>');
        } else {
            $("#min_adjust_step_td", new_tr).empty();
        }
    });

    var add_elas_policy_tab = function() {
        var new_tr = $('<tr>\
                <td>\
                    <select id="type" name="type">\
                        <option value="CHANGE">'+tr("Change")+'</option>\
                        <option value="CARDINALITY">'+tr("Cardinality")+'</option>\
                        <option value="PERCENTAGE_CHANGE">'+tr("Percentage")+'</option>\
                    </select>\
                </td>\
                <td>\
                    <input type="text" id="adjust" name="adjust"/>\
                </td>\
                <td id="min_adjust_step_td">\
                </td>\
                <td>\
                    <input type="text" id="expression" name="expression"/>\
                </td>\
                <td>\
                    <input type="text" id="period_number" name="period_number"/>\
                </td>\
                <td>\
                    <input type="text" id="period" name="period"/>\
                </td>\
                <td>\
                    <input type="text" id="cooldown" name="cooldown"/>\
                </td>\
                <td>\
                    <a href="#"><i class="fa fa-times-circle remove-tab"></i></a>\
                </td>\
            </tr>');
        new_tr.appendTo($("#elasticity_policies_tbody", role_section));
        //setup_policy_tab_content(policy_section, html_policy_id);
    }

    var add_sche_policy_tab = function() {
        var new_tr = $('<tr>\
                <td>\
                    <select id="type" name="type">\
                        <option value="CHANGE">'+tr("Change")+'</option>\
                        <option value="CARDINALITY">'+tr("Cardinality")+'</option>\
                        <option value="PERCENTAGE_CHANGE">'+tr("Percentage")+'</option>\
                    </select>\
                </td>\
                <td>\
                    <input type="text" id="adjust" name="adjust"/>\
                </td>\
                <td id="min_adjust_step_td">\
                </td>\
                <td>\
                    <select id="time_format" name="time_format">\
                        <option value="start_time">'+tr("Start time")+'</option>\
                        <option value="recurrence">'+tr("Recurrence")+'</option>\
                    </select>\
                </td>\
                <td>\
                    <input type="text" id="time" name="time"/>\
                </td>\
                <td>\
                    <a href="#"><i class="fa fa-times-circle remove-tab"></i></a>\
                </td>\
            </tr>')
        new_tr.appendTo($("#scheduled_policies_tbody", role_section))
        //setup_policy_tab_content(policy_section, html_policy_id);
    }

    // close icon: removing the tab on click
    $( "#scheduled_policies_table i.remove-tab").live( "click", function() {
        var tr = $(this).closest('tr');
        tr.remove();
    });

    $( "#elasticity_policies_table i.remove-tab").live( "click", function() {
        var tr = $(this).closest('tr');
        tr.remove();
    });

    $("#tf_btn_elas_policies", role_section).bind("click", function(){
        add_elas_policy_tab();
    });

    $("#tf_btn_sche_policies", role_section).bind("click", function(){
        add_sche_policy_tab();
    });

    return false;
}


// Prepare the creation dialog
function setupCreateServiceTemplateDialog(){
    dialogs_context.append('<div id="create_service_template_dialog"></div>');
    $create_service_template_dialog =  $('#create_service_template_dialog',dialogs_context);

    var dialog = $create_service_template_dialog;
    dialog.html(create_service_template_tmpl);
    dialog.addClass("reveal-modal xlarge max-height").attr("data-reveal", "");

    setupTips(dialog);

    var add_role_tab = function(role_id) {
        var html_role_id  = 'role' + role_id;

        // Append the new div containing the tab and add the tab to the list
        var role_section = $('<div id="'+html_role_id+'Tab" class="content wizard_internal_tab">'+
            role_tab_content +
        '</div>').appendTo($("#roles_tabs_content"));

        var a = $("<dd>\
            <a id='"+html_role_id+"' href='#"+html_role_id+"Tab'><span id='role_name_text'>"+tr("Role ")+role_id+" </span>\
                <i class='fa fa-times-circle remove-tab'></i>\
            </a>\
        </dd>").appendTo($("dl#roles_tabs"));

        $("a", a).trigger("click");

        setup_role_tab_content(role_section, html_role_id);

        roles_index++;
    }

    // close icon: removing the tab on click
    $("#roles_tabs").on("click", "i.remove-tab", function() {
        var target = $(this).parent().attr("href");
        var dd = $(this).closest('dd');
        var dl = $(this).closest('dl');
        var content = $(target);

        dd.remove();
        content.remove();

        if (dd.attr("class") == 'active') {
            $('a', dl.children('dd').last()).click();
            //TODOO dl.foundationTabs("set_tab", dl.children('dd').last());
        }
    });

    // Fill parents table
    // Each time a tab is clicked the table is filled with existing tabs (roles)
    // Selected roles are kept
    // TODO If the name of a role is changed and is selected, selection will be lost
    $("#roles_tabs").on("click", "a", function() {
        var tab_id = "#"+this.id+"Tab";
        var str = "";


        $(tab_id+" #parent_roles").hide();
        var parent_role_available = false;

        $("#roles_tabs_content #role_name").each(function(){
            if ($(this).val() && ($(this).val() != $(tab_id+" #role_name").val())) {
                parent_role_available = true;
                str += "<tr>\
                    <td style='width:10%'><input class='check_item' type='checkbox' value='"+$(this).val()+"' id='"+$(this).val()+"'/></td>\
                    <td>"+$(this).val()+"</td><tr>\
                </tr>";
            }
        });

        if (parent_role_available) {
            $(tab_id+" #parent_roles").show();
        }

        var selected_parents = [];
        $(tab_id+" #parent_roles_body input:checked").each(function(){
            selected_parents.push($(this).val());
        });

        $(tab_id+" #parent_roles_body").html(str);

        $.each(selected_parents, function(){
            $(tab_id+" #parent_roles_body #"+this).attr('checked', true);
        });
    })

    $("#tf_btn_roles", dialog).bind("click", function(){
        add_role_tab(roles_index);
    });


    $('#create_service_template_submit',dialog).click(function(){
        var json_template = generate_json_service_template_from_form();
        Sunstone.runAction("ServiceTemplate.create", json_template );
        return false;
    });

    $('#update_service_template_submit',dialog).click(function(){
        var json_template = generate_json_service_template_from_form();
        Sunstone.runAction("ServiceTemplate.update",service_template_to_update_id, JSON.stringify(json_template));
        return false;
    });

    $('#create_service_template_reset', dialog).click(function(){
        dialog.html("");
        setupCreateServiceTemplateDialog();

        popUpCreateServiceTemplateDialog();
    });


    $(document).foundation();

    roles_index = 0;
    add_role_tab(roles_index);
}

var removeEmptyObjects = function(obj){
    for (elem in obj){
        var remove = false;
        var value = obj[elem];
        if (value instanceof Array)
        {
            if (value.length == 0)
                remove = true;
            else if (value.length > 0)
            {
              value = jQuery.grep(value, function (n) {
                var obj_length = 0;
                for (e in n)
                    obj_length += 1;

                if (obj_length == 0)
                    return false;

                return true;
               });

              if (value.length == 0)
                remove = true;
            }
        }
        else if (value instanceof Object)
        {
            var obj_length = 0;
            for (e in value)
                obj_length += 1;
            if (obj_length == 0)
                remove = true;
        }
        else
        {
            value = String(value);
            if (value.length == 0)
                remove = true;
        }

        if (remove)
            delete obj[elem];
    }
    return obj;
}

function generate_json_service_template_from_form() {
    var name = $('input[name="service_name"]', $create_service_template_dialog).val();
    var deployment = $('select[name="deployment"]', $create_service_template_dialog).val();
    var shutdown_action_service = $('select[name="shutdown_action_service"]', $create_service_template_dialog).val();

    var roles = [];

    $('#roles_tabs_content .content', $create_service_template_dialog).each(function(){
        var role = {};
        role['name'] = $('input[name="name"]', this).val();
        role['cardinality'] = $('input[name="cardinality"]', this).val();
        role['vm_template'] = $('#vm_template .resource_list_select', this).val();
        role['shutdown_action'] = $('select[name="shutdown_action_role"]', this).val();
        role['parents'] = [];

        if (!name || !cardinality || !template){
            notifyError(tr("Please specify name, cardinality and template for this role"));
            return false;
        } else {
            $('#parent_roles_body input.check_item:checked', this).each(function(){
                role['parents'].push($(this).val())
            });

            var shutdown_action = $('select[name="shutdown_action_role"]', this).val();
            if (shutdown_action) {
                role['shutdown_action'] = shutdown_action
            }
            var min_vms = $('input[name="min_vms"]', this).val();
            if (min_vms) {
                role['min_vms'] = min_vms
            }
            var max_vms = $('input[name="max_vms"]', this).val();
            if (max_vms) {
                role['max_vms'] = max_vms
            }
            var cooldown = $('input[name="cooldown"]', this).val();
            if (cooldown) {
                role['cooldown'] = cooldown
            }

            role = removeEmptyObjects(role);
            role['elasticity_policies'] = [];
            $("#elasticity_policies_tbody tr", this).each(function(){
                var policy = {};
                policy['type'] = $("#type" ,this).val();
                policy['adjust']  = $("#adjust" ,this).val();
                policy['min_adjust_step']  = $("#min_adjust_step" ,this).val();
                policy['expression']  = $("#expression" ,this).val();
                policy['period_number']  = $("#period_number" ,this).val();
                policy['period']  = $("#period" ,this).val();
                policy['cooldown']  = $("#cooldown" ,this).val();

                // TODO remove empty policies
                role['elasticity_policies'].push(removeEmptyObjects(policy));
            });

            role['scheduled_policies'] = [];
            $("#scheduled_policies_tbody tr", this).each(function(){
                var policy = {};
                policy['type'] = $("#type" ,this).val();
                policy['adjust']  = $("#adjust" ,this).val();
                policy['min_adjust_step']  = $("#min_adjust_step" ,this).val();

                var time_format = $("#time_format" ,this).val();
                policy[time_format] = $("#time" ,this).val();

                // TODO remove empty policies
                role['scheduled_policies'].push(removeEmptyObjects(policy));
            });

            roles.push(role);
        }
    });

    var obj = {
        name: name,
        deployment: deployment,
        roles: roles
    }

    if (shutdown_action_service){
        obj['shutdown_action'] = shutdown_action_service
    }

    return obj;
}

function popUpCreateServiceTemplateDialog(){
    if (!$create_service_template_dialog || $create_service_template_dialog.html() == "") {
        setupCreateServiceTemplateDialog();
    }

    var dialog = $create_service_template_dialog;

    dialog.die();

    $("#create_service_template_header", dialog).show();
    $("#update_service_template_header", dialog).hide();
    $("#create_service_template_submit", dialog).show();
    $("#update_service_template_submit", dialog).hide();
    $("#create_service_template_reset", dialog).show();

    $("#service_name", dialog).removeAttr("disabled");

    dialog.foundation().foundation('reveal', 'open');
}

function popUpUpdateServiceTemplateDialog() {
    var selected_nodes = getSelectedNodes(dataTable_service_templates);

    if ( selected_nodes.length != 1 )
    {
      notifyMessage("Please select one (and just one) template to update.");
      return false;
    }

    if (!$create_service_template_dialog) {
        setupCreateServiceTemplateDialog();
    } else {
        $create_service_template_dialog.remove();
        setupCreateServiceTemplateDialog();
    }

    var template_id   = ""+selected_nodes[0];
    Sunstone.runAction("ServiceTemplate.show_to_update", template_id);
}


function fillUpUpdateServiceTemplateDialog(request, response){
    var dialog = $('#create_service_template_dialog',dialogs_context);

    $("#create_service_template_header", dialog).hide();
    $("#update_service_template_header", dialog).show();
    $("#create_service_template_submit", dialog).hide();
    $("#update_service_template_submit", dialog).show();
    $("#create_service_template_reset", dialog).hide();

    var service_template = response[ServiceTemplate.resource]
    $("#service_name", dialog).attr("disabled", "disabled");
    $("#service_name", dialog).val(htmlDecode(service_template.NAME));

    // TODO Check if the template still exists
    $('select[name="deployment"]', dialog).val(service_template.TEMPLATE.BODY.deployment);
    $("select[name='shutdown_action_service']", dialog).val(service_template.TEMPLATE.BODY.shutdown_action);

    var more_than_one = false;
    var roles_names = [];
    $.each(service_template.TEMPLATE.BODY.roles, function(index, value){
        more_than_one ? $("#tf_btn_roles", dialog).click() : (more_than_one = true);

        var context = $('#roles_tabs_content .content', $create_service_template_dialog).last();

        $("#role_name", context).val(htmlDecode(value.name));
        $("#role_name", context).change();
        roles_names.push(value.name);

        $("#cardinality", context).val(htmlDecode(value.cardinality));

        // The vm_template select is already initialized, but we need to select
        // the template retrived from the service_template. Since the initialization
        // is async, we can't assume the .resource_list_select exists yet.
        // Calling the initialization again with the correct init_val should
        // use the cache anyway
        insertSelectOptions('div#vm_template', context, "Template", value.vm_template, false);

        $("select[name='shutdown_action_role']", context).val(value.shutdown_action);
        $("#min_vms", context).val(htmlDecode(value.min_vms));
        $("#max_vms", context).val(htmlDecode(value.max_vms));
        $("#cooldown", context).val(htmlDecode(value.cooldown));

        if (value['elasticity_policies']) {
            $.each(value['elasticity_policies'], function(){
                $("#tf_btn_elas_policies", context).click();
                var td = $("#elasticity_policies_tbody tr", context).last();
                $("#type" ,td).val(htmlDecode(this['type']));
                $("#type" ,td).change();
                $("#adjust" ,td).val(htmlDecode(this['adjust'] ));
                $("#min_adjust_step" ,td).val(htmlDecode(this['min_adjust_step'] || ""));
                $("#expression" ,td).val(htmlDecode(this.expression))
                $("#period_number" ,td).val(htmlDecode(this['period_number'] || ""));
                $("#period" ,td).val(htmlDecode(this['period'] || "" ));
                $("#cooldown" ,td).val(htmlDecode(this['cooldown'] || "" ));
            })
        }

        if (value['scheduled_policies']) {
            $.each(value['scheduled_policies'], function(){
                $("#tf_btn_sche_policies", context).click();
                var td = $("#scheduled_policies_tbody tr", context).last();
                $("#type", td).val(htmlDecode(this['type']));
                $("#type" ,td).change();
                $("#adjust", td).val(htmlDecode(this['adjust'] ));
                $("#min_adjust_step", td).val(htmlDecode(this['min_adjust_step']  || ""));

                if (this['start_time']) {
                    $("#time_format", td).val('start_time');
                    $("#time", td).val(htmlDecode(this['start_time']));
                } else if (this['recurrence']) {
                    $("#time_format", td).val('recurrence');
                    $("#time", td).val(htmlDecode(this['recurrence']));
                }
            })
        }
    })

    $.each(service_template.TEMPLATE.BODY.roles, function(index, value){
        var tab_id = "#role"+index+"Tab"
        var str = "";

        $.each(roles_names, function(){
            if (this != $(tab_id+" #role_name").val()) {
                str += "<tr>\
                    <td style='width:10%'><input class='check_item' type='checkbox' value='"+this+"' id='"+this+"'/></td>\
                    <td>"+this+"</td><tr>\
                </tr>";
            }
        });

        $(tab_id+" #parent_roles_body").html(str);

        var context = $('#roles_tabs_content .content#role'+index+'Tab', $create_service_template_dialog);

        if (value.parents) {
            $.each(value.parents, function(index, value){
                $("#parent_roles_body #"+this, context).attr('checked', true);
            });
        }
    });

    service_template_to_update_id = service_template.ID;

    dialog.die();
    dialog.live('closed', function () {
        $create_service_template_dialog.html("");
    });

    dialog.foundation('reveal', 'open');
}

//The DOM is ready at this point
$(document).ready(function(){
    var tab_name = "oneflow-templates";

    if (Config.isTabEnabled(tab_name)) {
        dataTable_service_templates = $("#datatable_service_templates",main_tabs_context).dataTable({
            "bSortClasses": false,
            "bDeferRender": true,
            "aoColumnDefs": [
                { "bSortable": false, "aTargets": ["check"] },
                { "sWidth": "35px", "aTargets": [0] },
                { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
                { "bVisible": false, "aTargets": ['_all']}
            ]
        });

        $('#service_templates_search').keyup(function(){
          dataTable_service_templates.fnFilter( $(this).val() );
        })

        dataTable_service_templates.on('draw', function(){
          recountCheckboxes(dataTable_service_templates);
        })

        Sunstone.runAction("ServiceTemplate.list");

        initCheckAllBoxes(dataTable_service_templates);
        tableCheckboxesListener(dataTable_service_templates);
        infoListener(dataTable_service_templates,'ServiceTemplate.show');

        $('div#service_templates_tab div.legend_div').hide();

        dataTable_service_templates.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});
