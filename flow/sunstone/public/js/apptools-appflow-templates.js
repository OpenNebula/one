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

var ServiceTemplate = {
    "resource" : 'DOCUMENT',
    "path"     : 'service_template',
    "create": function(params){
        OpenNebula.Action.create(params, ServiceTemplate.resource,
                                 ServiceTemplate.path);
    },

    "instantiate": function(params){
        var action_obj = params.data.extra_param;
        OpenNebula.Action.simple_action(params,
                                        ServiceTemplate.resource,
                                        "instantiate",
                                        action_obj,
                                        ServiceTemplate.path);
    },
    "del": function(params){
        OpenNebula.Action.del(params,ServiceTemplate.resource, ServiceTemplate.path);
    },
    "list" : function(params){
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

var service_template_tab_content = '\
<form class="custom" id="template_form" action="">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
       <i class="icon-magic"></i> '+tr("AppFlow - Templates")+'\
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
    <input id="service_templates_search" type="text" placeholder="'+tr("Search")+'" />\
  </div>\
  <br>\
  <br>\
</div>\
</div>\
  <div class="row">\
    <div class="twelve columns">\
      <table id="datatable_service_templates" class="datatable twelve">\
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
      </table>\
  </div>\
  </div>\
</form>';

var create_service_template_tmpl = '\
<div class="panel">\
  <h3>\
    <small id="create_service_template_header">'+tr("Create Service Template")+'</small>\
  </h3>\
</div>\
<div class="reveal-body create_form">\
  <form id="create_service_template_form" action="">\
    <div class="row">\
        <div class="service_template_param st_man six columns">\
            <div class="four columns">\
                <label class="inline right" for="service_name">' + tr("Name") + ':</label>\
            </div>\
            <div class="seven columns">\
                <input type="text" name="service_name" />\
            </div>\
            <div class="one columns">\
                <div class="tip">'+ tr("Name for this template") +'</div>\
            </div>\
        </div>\
        <div class="service_template_param st_man six columns">\
            <div class="six columns">\
                <label class="inline right" for="deployment">' + tr("Deployment strategy") + ':</label>\
            </div>\
            <div class="five columns">\
                <select name="deployment">\
                    <option value="straight">'+ tr("Straight") + '</option>\
                    <option value="none">'+ tr("None") + '</option>\
                </select>\
            </div>\
            <div class="one columns">\
                <div class="tip">'+ tr("Straight strategy will instantiate each role in order: parents role will be deployed before their children. None strategy will instantiate the roles regardless of their relationships.") +'</div>\
            </div>\
        </div>\
    </div>\
    <div class="row" id="new_role">\
      <fieldset>\
         <legend>' + tr("Roles") + '</legend>\
           <div class="service_template_param service_role st_man six columns">\
              <div class="row">\
                <div class="four columns">\
                    <label class="inline right" for="name">' + tr("Name") + ':</label>\
                </div>\
                <div class="seven columns">\
                    <input type="text" name="name"/>\
                </div>\
                <div class="one columns">\
                    <div class="tip">'+ tr("Number of VMs to instantiate with this role") +'</div>\
                </div>\
              </div>\
              <div class="row">\
                <div class="four columns">\
                    <label class="inline right" for="cardinality">' + tr("Cardinality") + ':</label>\
                </div>\
                <div class="seven columns">\
                    <input type="text" name="cardinality" value="1" />\
                </div>\
                <div class="one columns">\
                    <div class="tip">'+ tr("Number of VMs to instantiate with this role") +'</div>\
                </div>\
              </div>\
              <div class="row">\
                <div class="four columns">\
                    <label class="inline right" for="vm_template">' + tr("VM template") + ':</label>\
                </div>\
                <div class="seven columns">\
                    <select name="vm_template">\
                    </select>\
                </div>\
                <div class="one columns">\
                    <div class="tip">'+ tr("Template associated to this role") +'</div>\
                </div>\
              </div>\
           </div>\
           <div class="service_template_param service_role six columns">\
              <div class="row">\
                <div class="four columns">\
                    <label class="inline right" for="parents">' + tr("Parent roles") + ':</label>\
                </div>\
                <div class="seven columns">\
                    <select name="parents" multiple="multiple" style="width: 100%; font-size: 14px; font-family: "Open Sans", sans-serif; font-weight: 500;">\
                    </select>\
                </div>\
                <div class="one columns">\
                    <div class="tip">'+ tr("Mark the roles that will be deployed before this one when using the straight strategy") +'</div>\
                </div>\
              </div>\
              <br>\
              <div class="row">\
                <div class="eleven columns">\
                 <button class="button radius small right" id="add_role">' + tr("Add role") + '</button>\
                </div>\
              </div>\
           </div>\
           <hr>\
           <div class="twelve columns">\
               <table id="current_roles" class="info_table twelve dataTable">\
                      <thead><tr>\
                           <th>'+tr("Name")+'</th>\
                           <th>'+tr("Card.")+'</th>\
                           <th>'+tr("Template")+'</th>\
                           <th style="width:100%;">'+tr("Parents")+'</th>\
                           <th>'+tr("Delete")+'</th></tr></thead>\
                      <tbody>\
                      </tbody>\
               </table>\
          </div>\
      </fieldset>\
    </div>\
    <div class="reveal-footer">\
      <hr>\
      <div class="form_buttons">\
          <button class="button radius right success"" type="submit" value="ServiceTemplate.create">' + tr("Create") + '</button>\
          <button class="button radius secondary" type="reset" value="reset">' + tr("Reset") + '</button>\
          <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
      </div>\
    </div>\
    <a class="close-reveal-modal">&#215;</a>\
  </form>\
</div>';


var dataTable_service_templates;
var $create_service_template_dialog;

var service_template_actions = {

    "ServiceTemplate.create" : {
        type: "create",
        call: ServiceTemplate.create,
        callback: function(req, res){
            //empty creation dialog roles after successful creation
            var dialog = $create_service_template_dialog;
            $('table#current_roles tbody', dialog).empty();
            $('select[name="parents"]', dialog).empty();
            addServiceTemplateElement(req, res);
        },
        error: onError,
        notify:true
    },

    "ServiceTemplate.create_dialog" : {
        type : "custom",
        call: popUpCreateServiceTemplateDialog
    },

    "ServiceTemplate.list" : {
        type: "list",
        call: ServiceTemplate.list,
        callback: updateServiceTemplatesView,
        error: onError
    },

    "ServiceTemplate.show" : {
        type : "single",
        call: ServiceTemplate.show,
        callback: updateServiceTemplateElement,
        error: onError
    },

    "ServiceTemplate.showinfo" : {
        type: "single",
        call: ServiceTemplate.show,
        callback: updateServiceTemplateInfo,
        error: onError
    },

    "ServiceTemplate.instantiate" : {
        type: "multiple",
        call: ServiceTemplate.instantiate,
        elements: serviceTemplateElements,
        error: onError,
        notify: true
    },

    "ServiceTemplate.refresh" : {
        type: "custom",
        call: function () {
            waitingNodes(dataTable_service_templates);
            Sunstone.runAction("ServiceTemplate.list");
        }
    },

    "ServiceTemplate.autorefresh" : {
        type: "custom",
        call: function() {
            ServiceTemplate.list({timeout: true, success: updateServiceTemplatesView, error: onError});
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
    "ServiceTemplate.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },

    "ServiceTemplate.instantiate" : {
        type: "action",
        layout: "main",
        text: tr("Instantiate")
    },
    "ServiceTemplate.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: users_sel,
        layout: "user_select",
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "ServiceTemplate.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: groups_sel,
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
    content: service_template_tab_content,
    buttons: service_template_buttons,
    tabClass: 'subTab',
    parentTab: 'appflow_dashboard_tab'
}

Sunstone.addActions(service_template_actions);
Sunstone.addMainTab('apptools-appflow-templates',service_templates_tab);
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
    //updateVResDashboard("images",images_list);
    updateAppFlowDashboard('templates', service_template_list_array);
}

// Callback to update the information panel tabs and pop it up
function updateServiceTemplateInfo(request,elem){
    var elem_info = elem.DOCUMENT;

    var roles_info = '<table id="service_template_roles_table" class="twelve datatable extended_table">\
           <thead>\
             <tr><th colspan="2">'+tr("Roles")+'</th></tr>\
           </thead>'

    var roles = elem_info.TEMPLATE.BODY.roles
    if (roles && roles.length > 0)
        for (var i = 0; i < roles.length; i++) {
          roles_info += '<tr><td colspan="2">'+roles[i].name+'</td></tr>\
            <tr>\
             <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Cardinality")+'</td>\
             <td class="value_td">'+roles[i].cardinality+'</td>\
            </tr>\
            <tr>\
             <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("VM Template")+'</td>\
             <td class="value_td">'+roles[i].vm_template+'</td>\
            </tr>'

          if (roles[i].parents)
            roles_info += '<tr>\
              <td > &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+tr("Parents")+'</td>\
              <td class="value_td">'+roles[i].parents.join(', ')+'</td>\
            </tr>'
        }

    roles_info += '</table>'

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
         </table>' +
         roles_info +
       '</div>\
        <div class="six columns">' + insert_permissions_table('apptools-appflow-templates',
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
    Sunstone.popUpInfoPanel("service_template_info_panel", "apptools-appflow-templates");

    setPermissionsTable(elem_info,'');

    $("#service_template_info_panel_refresh", $("#service_template_info_panel")).click(function(){
      $(this).html(spinner);
      Sunstone.runAction('ServiceTemplate.showinfo', elem_info.ID);
    })
}


// Prepare the creation dialog
function setupCreateServiceTemplateDialog(){
    dialogs_context.append('<div title="'+tr("Create service template")+'" id="create_service_template_dialog"></div>');
    $create_service_template_dialog =  $('#create_service_template_dialog',dialogs_context);

    var dialog = $create_service_template_dialog;
    dialog.html(create_service_template_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    //Prepare jquery dialog
    dialog.addClass("reveal-modal xlarge max-height");


    var addParentRole = function(name){
        var select = $('select[name="parents"]', dialog);
        var exists = $('option[value="'+ name +'"]', select);
        if (exists.length)
            return false;
        select.append(
            '<option value="'+ name +'">☐ '+ name +'</option>');
        return true;

    }

    var removeParentRole = function(name){
        $('select[name="parents"] option[value="'+ name +'"]', dialog).remove();
    }

    $('.role_delete_icon').live('click', function(){
        var row = $(this).parents('tr');
        removeParentRole(row.attr('name'));
        row.fadeOut().remove();
        return false;
    });

    $('select[name="parents"]', dialog).change(function(){
        var option = $('option:selected', this);
        var clicked = option.attr('clicked');
        if (clicked){//unbold, unmark
            option.text(option.text().replace(/☒/g,'☐'));
            option.removeAttr('clicked');
        }
        else {//bold,mark
            option.text(option.text().replace(/☐/g,'☒'));
            option.attr('clicked','clicked');
        }

        $(this).val("");
        return false;
    });

    $('button#add_role', dialog).click(function(){
        var context = $(this).closest('#new_role');
        var name = $('input[name="name"]', context).val();
        var cardinality = $('input[name="cardinality"]', context).val();
        var template = $('select[name="vm_template"]', context).val();
        var parents_opt = $('select[name="parents"] option[clicked="clicked"]',
                            context);
        var parents = [];

        if (!name || !cardinality || !template){
            notifyError(tr("Please specify name, cardinality and template for this role"));
            return false;
        };

        parents_opt.each(function(){
            parents.push($(this).val())
        });

        var role = {
            name : name,
            cardinality: cardinality,
            vm_template: template,
            parents: parents
        };

        var str = '<tr role=\''+JSON.stringify(role)+'\' name="'+ name +'" >';
        str += '<td>'+ name +'</td>';
        str += '<td>'+ cardinality +'</td>';
        str += '<td>'+ template +'</td>';
        str += '<td>'+ parents.join(',') +'</td>';
        str += '<td><a href="#" class="role_delete_icon">Delete</a></td>';
        str += '</tr>';

        var ok = addParentRole(name);

        if (ok){
            $('table#current_roles tbody', dialog).append($(str).hide().fadeIn());
            $('input[name="name"]', context).val("");
            $('input[name="cardinality"]', context).val("1");
            //unselect selected parents
            $('select[name="parents"] option[clicked="clicked"]').trigger('click');
        }
        else
            notifyError(tr("There is already a role with this name!"));

        return false;
    });


    $('#create_service_template_form',dialog).submit(function(){
        var name = $('input[name="service_name"]', this).val();
        var deployment = $('select[name="deployment"]', this).val();

        if (!name){
            notifyError(tr("Name is mandatory!"));
            return false;
        }

        var roles = [];

        $('table#current_roles tbody tr').each(function(){
            roles.push(JSON.parse($(this).attr('role')));
        });

        var obj = {
            name: name,
            deployment: deployment,
            roles: roles
        }

        Sunstone.runAction("ServiceTemplate.create", obj );
        dialog.trigger("reveal:close");
        return false;
    });
}

function popUpCreateServiceTemplateDialog(){
    var dialog = $create_service_template_dialog;
    var tpl_select = makeSelectOptions(dataTable_templates, 1, 4, [], [], true);
    $('select[name="vm_template"]', dialog).html(tpl_select);
    dialog.reveal();
}



// Set the autorefresh interval for the datatable
function setServiceTemplateAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_service_templates);
        var filter = $("#service_template_search").attr('value');
        if ((checked.length==0) && !filter){
            Sunstone.runAction("ServiceTemplate.autorefresh");
        }
    },INTERVAL+someTime());
};


//The DOM is ready at this point
$(document).ready(function(){

    dataTable_service_templates = $("#datatable_service_templates",main_tabs_context).dataTable({
        "sDom" : "<'H'>t<'row'<'six columns'i><'six columns'p>>",
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "100px", "aTargets": [2,3] },
            { "sWidth": "35px", "aTargets": [1] }
        ]
    });

    $('#service_templates_search').keyup(function(){
      dataTable_service_templates.fnFilter( $(this).val() );
    })

    Sunstone.runAction("ServiceTemplate.list");

    setupCreateServiceTemplateDialog();
    setupTips($create_service_template_dialog);

    setServiceTemplateAutorefresh();

    initCheckAllBoxes(dataTable_service_templates);
    tableCheckboxesListener(dataTable_service_templates);
    infoListener(dataTable_service_templates,'ServiceTemplate.showinfo');

    $('div#service_templates_tab div.legend_div').hide();
});
