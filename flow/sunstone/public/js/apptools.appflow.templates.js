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
<h2><i class="icon-magic"></i> '+tr("AppFlow - Templates")+'</h2>\
<form id="service_template_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_service_templates" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">'+tr("All")+'</input></th>\
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Owner")+'</th>\
      <th>'+tr("Group")+'</th>\
      <th>'+tr("Name")+'</th>\
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

var create_service_template_tmpl = '\
<div class="create_form"><form id="create_service_template_form" action="">\
   <p style="font-size:0.8em;text-align:right;"><i>'+
    tr("Fields marked with")+' <span style="display:inline-block;" class="ui-icon ui-icon-alert" /> '+
    tr("are mandatory")+'</i><br />\
  <fieldset>\
      <legend style="display:none;">' + tr("Service") + '</legend>\
      <div class="service_template_param st_man">\
          <label for="service_name">' + tr("Name") + ':</label><input type="text" name="service_name" />\
          <div class="tip">'+ tr("Name for this template") +'</div>\
      </div>\
      <div class="service_template_param st_man">\
          <label for="deployment">' + tr("Deployment strategy") + ':</label>\
          <select name="deployment">\
              <option value="straight">'+ tr("Straight") + '</option>\
              <option value="none">'+ tr("None") + '</option>\
          </select>\
          <div class="tip">'+ tr("Straight strategy will instantiate each role in order: parents role will be deployed before their children. None strategy will instantiate the roles regardless of their relationships.") +'</div>\
      </div>\
  </fieldset>\
  <fieldset>\
     <legend>' + tr("Roles") + '</legend>\
     <div class="service_template_param service_role st_man">\
          <label for="name">' + tr("Name") + ':</label><input type="text" name="name" />\
          <div class="tip">'+ tr("Name for the role") +'</div>\
     </div>\
     <div class="service_template_param service_role st_man">\
          <label for="cardinality">' + tr("Cardinality") + ':</label><input type="text" name="cardinality" value="1" />\
          <div class="tip">'+ tr("Number of VMs to instantiate with this role") +'</div>\
     </div>\
     <div class="service_template_param service_role st_man">\
          <label for="vm_template">' + tr("VM template") + ':</label>\
          <select name="vm_template">\
          </select>\
          <div class="tip">'+ tr("Template associated to this role") +'</div>\
     </div>\
     <div class="service_template_param service_role">\
          <label for="parents">' + tr("Parent roles") + ':</label>\
          <select name="parents" multiple="multiple">\
          </select>\
          <div class="tip">'+ tr("Mark the roles that will be deployed before this one when using the straight strategy") +'</div>\
     </div>\
     <label>&nbsp;</label>\
     <button id="add_role">' + tr("Add role") + '</button>\
  </fieldset>\
  <fieldset>\
     <legend>' + tr("Current Roles") + '</legend>\
     <table id="current_roles" class="info_table" style="width:540px;margin-top:0;">\
            <thead><tr>\
                 <th>'+tr("Name")+'</th>\
                 <th>'+tr("Card.")+'</th>\
                 <th>'+tr("Template")+'</th>\
                 <th style="width:100%;">'+tr("Parents")+'</th>\
                 <th>'+tr("Delete")+'</th></tr></thead>\
            <tbody>\
            </tbody>\
     </table>\
  </fieldset>\
  <fieldset>\
    <div class="form_buttons">\
        <div><button class="button" type="submit" value="ServiceTemplate.create">' + tr("Create") + '</button>\
        <button class="button" type="reset" value="reset">' + tr("Reset") + '</button></div>\
    </div>\
  </fieldset>\
</form></div>';


var update_service_template_tmpl =
   '<form action="javascript:alert(\'js error!\');">\
         <h3 style="margin-bottom:10px;">'+tr("Please, choose and modify the service template")+':</h3>\
            <fieldset style="border-top:none;">\
                 <label for="service_template_update_select">'+tr("Select a template")+':</label>\
                 <select id="service_template_update_select" name="service_template_update_select"></select>\
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
                         <td style="text-align:center"><input type="checkbox" name="st_owner_u" class="owner_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="st_owner_m" class="owner_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="st_owner_a" class="owner_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Group")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="st_group_u" class="group_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="st_group_m" class="group_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="st_group_a" class="group_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Other")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="st_other_u" class="other_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="st_other_m" class="other_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="st_other_a" class="other_a" /></td>\
                     </tr>\
                   </table>\
                 </div>\
            </fieldset>\
            <fieldset>\
                 <div class="form_buttons">\
                    <button class="button" id="service_template_update_button" value="ServiceTemplate.update_template">\
                       '+tr("Update")+'\
                    </button>\
                 </div>\
            </fieldset>\
</form>';

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

    "ServiceTemplate.update_dialog" : {
        type : "custom",
        call : popUpServiceTemplateUpdateDialog
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

    "ServiceTemplate.fetch_permissions" : {
        type : "single",
        call : ServiceTemplate.show,
        callback : function(request, json){
            var dialog = $('#service_template_update_dialog form');
            var tmpl = json.DOCUMENT;
            setPermissionsTable(tmpl, dialog);
        },
        error: onError
    },
/*
    "ServiceTemplate.clone_dialog" : {
        type: "custom",
        call: popUpServiceTemplateCloneDialog
    },
    "ServiceTemplate.clone" : {
        type: "single",
        call: ServiceTemplate.clone,
        error: onError,
        notify: true
    },
*/
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
        text: '<i class="icon-refresh icon-large">',
        alwaysActive: true
    },
    "ServiceTemplate.create_dialog" : {
        type: "create_dialog",
        text: tr("+ New")
    },

    "ServiceTemplate.update_dialog" : {
        type: "action",
        text: tr("Update properties"),
        alwaysActive: true
    },

    "ServiceTemplate.instantiate" : {
        type: "action",
        text: tr("Instantiate")
    },
    "ServiceTemplate.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: users_sel,
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "ServiceTemplate.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: groups_sel,
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
/*
    "ServiceTemplate.clone_dialog" : {
        type: "action",
        text: tr("Clone")
    },
*/
    "ServiceTemplate.delete" : {
        type: "confirm",
        text: tr("Delete"),
        tip: tr("This will delete the selected templates")
    },
    "ServiceTemplate.help" : {
        type: "action",
        text: '?',
        alwaysActive: true
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
Sunstone.addMainTab('service_templates_tab',service_templates_tab);
Sunstone.addInfoPanel('service_template_info_panel',service_template_info_panel);


function serviceTemplateElements() {
    return getSelectedNodes(dataTable_service_templates);
}

// Returns an array containing the values of the service_template_json and ready
// to be inserted in the dataTable
function serviceTemplateElementArray(service_template_json){
    //Changing this? It may affect to the is_persistent() functions.
    var service_template = service_template_json.DOCUMENT;
    //var body = JSON.parse(service_template.TEMPLATE.BODY);
    //var description =  body.description;

    return [
        '<input class="check_item" type="checkbox" id="service_template_'+service_template.ID+'" name="selected_items" value="'+service_template.ID+'"/>',
        service_template.ID,
        service_template.UNAME,
        service_template.GNAME,
        service_template.NAME
//        description ? description : tr("None")
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
/*
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
             <tr><th colspan="2">'+tr("Service Template")+' \"'+elem_info.NAME+'\" '+
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
    };

    var roles_info = '<table id="service_template_roles_table" class="info_table" style="width:80%;">\
            <thead></thead>'

    var roles = elem_info.TEMPLATE.BODY.roles
    if (roles && roles.length > 0)
        for (var i = 0; i < roles.length; i++) {
          roles_info += '<tr><td class="key_td">'+tr("Role")+' '+roles[i].name+'</td><td></td></tr>\
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

/*
    var roles_tab = {
        title: tr("Roles"),
            content: '<table id="service_node_table" class="info_table" style="width:80%;">\
            <thead><tr><th colspan="2">'+tr("Node")+'</th></tr></thead>'+
            (elem_info.TEMPLATE.BODY ? prettyPrintJSON(elem_info.TEMPLATE.BODY) : "" )+
            '</table>'
          }
*/
    Sunstone.updateInfoPanelTab("service_template_info_panel","service_template_info_tab",info_tab);
    if (roles && roles.length > 0)
        Sunstone.addInfoPanelTab("service_template_info_panel","service_template_roles_tab",roles_tab);
    else
        Sunstone.removeInfoPanelTab("service_template_info_panel","service_template_roles_tab");

    Sunstone.popUpInfoPanel("service_template_info_panel");

}


// Prepare the creation dialog
function setupCreateServiceTemplateDialog(){
    dialogs_context.append('<div title="'+tr("Create service template")+'" id="create_service_template_dialog"></div>');
    $create_service_template_dialog =  $('#create_service_template_dialog',dialogs_context);

    var dialog = $create_service_template_dialog;
    dialog.html(create_service_template_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    //Prepare jquery dialog
    dialog.dialog({
        autoOpen: false,
        modal:true,
        width: 650,
        height: height
    });

    $('button',dialog).button();

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
        var context = $(this).parent();
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
        dialog.dialog('close');
        return false;
    });
}

function popUpCreateServiceTemplateDialog(){
    var dialog = $create_service_template_dialog;
    var tpl_select = makeSelectOptions(dataTable_templates, 1, 4, [], [], true);
    $('select[name="vm_template"]', dialog).html(tpl_select);
    // $('select[name="templates"] option', dialog).each(function(){
    //     $(this).text('☐ '+$(this).text());
    // });

    // //Somehow this needs to go here. Live() doesn't respond in setup function
    // $('select[name="templates"] option', dialog).click(function(){
    //     var clicked = $(this).attr('clicked');
    //     if (clicked){//unbold, unmark
    //         $(this).text($(this).text().replace(/☒/g,'☐'));
    //         $(this).removeAttr('clicked');
    //     }
    //     else {//bold,mark
    //         $(this).text($(this).text().replace(/☐/g,'☒'));
    //         $(this).attr('clicked','clicked');
    //     }
    //     return false;
    // });

    dialog.dialog('open');
}


function setupServiceTemplateUpdateDialog(){
    //Append to DOM
    dialogs_context.append('<div id="service_template_update_dialog" title="'+tr("Update Service template properties")+'"></div>');
    var dialog = $('#service_template_update_dialog',dialogs_context);

    //Put HTML in place
    dialog.html(update_service_template_tmpl);

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

    $('#service_template_update_select',dialog).change(function(){
        var id = $(this).val();
        $('.permissions_table input', dialog).removeAttr('checked');
        $('.permissions_table', dialog).removeAttr('update');
        if (id && id.length){
            Sunstone.runAction("ServiceTemplate.fetch_permissions", id);
        };
    });

    $('.permissions_table input',dialog).change(function(){
        $(this).parents('table').attr('update','update');
    });

    $('form',dialog).submit(function(){
        var dialog = $(this);
        var id = $('#service_template_update_select',dialog).val();
        if (!id || !id.length) {
            $(this).parents('#service_template_update_dialog').dialog('close');
            return false;
        };

        var permissions = $('.permissions_table',dialog);
        if (permissions.attr('update')){
            var perms = {
                octet : buildOctet(permissions)
            };
            Sunstone.runAction("ServiceTemplate.chmod", id, perms);
        };

        $(this).parents('#service_template_update_dialog').dialog('close');
        return false;
    });
};


function popUpServiceTemplateUpdateDialog(){
    var select = makeSelectOptions(dataTable_service_templates,
                                   1,//id_col
                                   4,//name_col
                                   [],
                                   []
                                  );
    var sel_elems = getSelectedNodes(dataTable_service_templates);


    var dialog =  $('#service_template_update_dialog');
    $('#service_template_update_select', dialog).html(select);
//    $('#service_template_update_textarea',dialog).val("");
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
        $('#service_template_update_select', dialog).html(new_select);
        if (sel_elems.length == 1) {
            $('#service_template_update_select option',
              dialog).attr('selected','selected');
            $('#service_template_update_select', dialog).trigger("change");
        };
    };

    dialog.dialog('open');
    return false;
}

// Set the autorefresh interval for the datatable
function setServiceTemplateAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_service_templates);
        var filter = $("#datatable_service_templates_filter input",
                       dataTable_service_templates.parents("#datatable_service_templates_wrapper")).attr('value');
        if (!checked.length && !filter.length){
            Sunstone.runAction("ServiceTemplate.autorefresh");
        }
    },INTERVAL+someTime());
};

/*
function setupServiceTemplateCloneDialog(){
    //Append to DOM
    dialogs_context.append('<div id="service_template_clone_dialog" title="'+tr("Clone an flowironment")+'"></div>');
    var dialog = $('#service_template_clone_dialog',dialogs_context);

    //Put HTML in place

    var html = '<form><fieldset>\
<div class="clone_one">'+tr("Choose a new name for the flowironment")+':</div>\
<div class="clone_several">'+tr("Several flowironments are selected, please choose prefix to name the new copies")+':</div>\
<br />\
<label class="clone_one">'+tr("Name")+':</label>\
<label class="clone_several">'+tr("Prefix")+':</label>\
<input type="text" name="name"></input>\
<div class="form_buttons">\
  <button class="button" id="service_template_clone_button" value="ServiceTemplate.clone">\
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
        var sel_elems = serviceTemplateElements();
        if (!name || !sel_elems.length)
            notifyError('A name or prefix is needed!');
        if (sel_elems.length > 1){
            for (var i=0; i< sel_elems.length; i++)
                //If we are cloning several items we
                //use the name as prefix
                Sunstone.runAction('ServiceTemplate.clone',
                                   sel_elems[i],
                                   name + getName(sel_elems[i],
                                                  dataTable_service_templates,
                                                  4));
        } else {
            Sunstone.runAction('ServiceTemplate.clone',sel_elems[0],name)
        };
        dialog.dialog('close');
        setTimeout(function(){
            Sunstone.runAction('ServiceTemplate.refresh');
        }, 1500);
        return false;
    });
}

function popUpServiceTemplateCloneDialog(){
    var dialog = $('#service_template_clone_dialog');
    var sel_elems = serviceTemplateElements();
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
                                                 dataTable_service_templates, 4));
    };

    $(dialog).dialog('open');
}

*/

//The DOM is ready at this point
$(document).ready(function(){

    dataTable_service_templates = $("#datatable_service_templates",main_tabs_context).dataTable({
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
            { "sWidth": "35px", "aTargets": [1] }
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    dataTable_service_templates.fnClearTable();
    addElement([
        spinner,
        '','','','',''],dataTable_service_templates);
    Sunstone.runAction("ServiceTemplate.list");


    setupCreateServiceTemplateDialog();
    setupServiceTemplateUpdateDialog();
    setupTips($create_service_template_dialog);
    $('.st_man .man_icon',
      $create_service_template_dialog).css('display', 'inline-block');
//    setupImageCloneDialog();
    setServiceTemplateAutorefresh();

    initCheckAllBoxes(dataTable_service_templates);
    tableCheckboxesListener(dataTable_service_templates);
    infoListener(dataTable_service_templates,'ServiceTemplate.showinfo');

    $('div#service_templates_tab div.legend_div').hide();
});
