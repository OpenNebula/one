//--------------------------------------------------------------------------//
// Copyright 2010-2012, C12G Labs S.L.                                      //
//                                                                          //
// Licensed under the C12G Commercial Open-source License (the              //
// "License"); you may not use this file except in compliance               //
// with the License. You may obtain a copy of the License as part           //
// of the software distribution.                                            //
//                                                                          //
// Unless agreed to in writing, software distributed under the              //
// License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES           //
// OR CONDITIONS OF ANY KIND, either express or implied. See the            //
// License for the specific language governing permissions and              //
// limitations under the License.                                           //
//--------------------------------------------------------------------------//

var AppEnv = {
    "resource" : 'DOCUMENT',
    "path" : "appenv",
    "create": function(params){
        OpenNebula.Action.create(params,AppEnv.resource,
                                 AppEnv.path);
    },
    "del": function(params){
        OpenNebula.Action.del(params,AppEnv.resource,
                              AppEnv.path);
    },
    "list" : function(params){
        OpenNebula.Action.list(params, AppEnv.resource,
                               AppEnv.path)
    },
    "show" : function(params){
        OpenNebula.Action.show(params, AppEnv.resource,
                               null, AppEnv.path)
    },
    "chown" : function(params){
        OpenNebula.Action.chown(params,AppEnv.resource,
                                AppEnv.path);
    },
    "chgrp" : function(params){
        OpenNebula.Action.chgrp(params,AppEnv.resource,
                                AppEnv.path);
    },
    "chmod" : function(params){
        var action_obj = params.data.extra_param;
        OpenNebula.Action.simple_action(params,
                                        AppEnv.resource,
                                        "chmod",
                                        action_obj, AppEnv.path);
    },
    "update" : function(params){
        OpenNebula.Action.simple_action(params,
                                        AppEnv.resource,
                                        "update",
                                        params.data.extra_param,
                                        AppEnv.path);
    },
    "instantiate" : function(params){
        OpenNebula.Action.simple_action(params,
                                        AppEnv.resource,
                                        "instantiate",
                                        params.data.extra_param,
                                        AppEnv.path);
    }
}

var appenv_tab_content = '\
<h2><i class="icon-magic"></i> '+tr("AppEnv - Environments")+'</h2>\
<form id="appenv_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_appenvs" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">'+tr("All")+'</input></th>\
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Owner")+'</th>\
      <th>'+tr("Group")+'</th>\
      <th>'+tr("Name")+'</th>\
      <th>'+tr("Description")+'</th>\
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

var create_appenv_tmpl = '\
<div class="create_form"><form id="create_appenv_form" action="">\
  <fieldset>\
      <legend style="display:none;">' + tr("Environment") + '</legend>\
      <div class="appenv_param">\
          <label for="name">' + tr("Name") + ':</label><input type="text" name="name" />\
      </div>\
      <div class="appenv_param">\
          <label for="description">' + tr("Description") + ':</label><input type="text" name="description" />\
      </div>\
      <div class="appenv_param">\
          <label for="templates">'+tr("Compatible templates")+':</label>\
          <select type="text" id="env_templates" name="templates" multiple>\
          </select>\
      </div>\
      <div class="appenv_param">\
          <label for="cookbooks">' + tr("Cookbooks URL") + ':</label><input type="text" name="cookbooks" />\
      </div>\
  </fieldset>\
<!--\
  <fieldset>\
      <div class="appenv_param">\
         <label for="node">'+tr("Variables")+':</label>\
          <div class="clear"></div>\
         <label for="custom_var_appenv_name">'+tr("Name")+':</label>\
         <input type="text" id="custom_var_appenv_name" name="custom_var_appenv_name" /><br />\
         <label for="custom_var_appenv_value">'+tr("Value")+':</label>\
         <input type="text" id="custom_var_appenv_value" name="custom_var_appenv_value" /><br />\
         <button class="add_remove_button add_button" id="add_custom_var_appenv_button" value="add_custom_appenv_var">'+tr("Add")+'</button>\
         <button class="add_remove_button" id="remove_custom_var_appenv_button" value="remove_custom_appenv_var">'+tr("Remove selected")+'</button>\
         <div class="clear"></div>\
         <label for="custom_var_appenv_box">'+tr("Custom attributes")+':</label>\
         <select id="custom_var_appenv_box" name="custom_var_appenv_box" style="height:100px;" multiple>\
         </select>\
      </div>\
  </fieldset>\
-->\
  <fieldset>\
      <div class="appenv_param">\
          <label for="node">'+tr("Node")+':</label>\
          <div class="clear"></div>\
          <textarea name="node" style="width:100%; height:14em;"></textarea>\
      </div>\
  </fieldset>\
  <fieldset>\
    <div class="form_buttons">\
        <div><button class="button" type="submit" value="AppEnv.create">' + tr("Create") + '</button>\
        <button class="button" type="reset" value="reset">' + tr("Reset") + '</button></div>\
    </div>\
  </fieldset>\
</form></div>';

var update_appenv_tmpl =
   '<form action="javascript:alert(\'js error!\');">\
         <h3 style="margin-bottom:10px;">'+tr("Please, choose and modify the environment you want to update")+':</h3>\
            <fieldset style="border-top:none;">\
                 <label for="appenv_template_update_select">'+tr("Select an environment")+':</label>\
                 <select id="appenv_template_update_select" name="appenv_template_update_select"></select>\
                 <div class="clear"></div>\
                    <label for="templates">'+tr("Compatible templates")+':</label>\
                    <select type="text" name="templates" multiple>\
                    </select>\
                    <div class="clear"></div>\
                    <label for="cookbooks">' + tr("Cookbooks URL") + ':</label><input type="text" name="cookbooks" />\
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
                         <td style="text-align:center"><input type="checkbox" name="appenv_owner_u" class="owner_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="appenv_owner_m" class="owner_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="appenv_owner_a" class="owner_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Group")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="appenv_group_u" class="group_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="appenv_group_m" class="group_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="appenv_group_a" class="group_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Other")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="appenv_other_u" class="other_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="appenv_other_m" class="other_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="appenv_other_a" class="other_a" /></td>\
                     </tr>\
                   </table>\
                 </div>\
                 <label for="appenv_template_update_textarea">'+tr("Node")+':</label>\
                 <div class="clear"></div>\
                 <textarea id="appenv_template_update_textarea" style="width:100%; height:14em;"></textarea>\
            </fieldset>\
            <fieldset>\
                 <div class="form_buttons">\
                    <button class="button" id="appenv_template_update_button" value="AppEnv.update_template">'+tr("Update")+'\
                    </button>\
                 </div>\
            </fieldset>\
</form>';

var dataTable_appenvs;
var $create_appenv_dialog;

var appenv_actions = {

    "AppEnv.create" : {
        type: "create",
        call: AppEnv.create,
        callback: addAppEnvElement,
        error: onError,
        notify:true
    },

    "AppEnv.create_dialog" : {
        type: "custom",
        call: popUpCreateAppEnvDialog
    },

    "AppEnv.list" : {
        type: "list",
        call: AppEnv.list,
        callback: updateAppEnvsView,
        error: onError
    },

    "AppEnv.show" : {
        type : "single",
        call: AppEnv.show,
        callback: updateAppEnvElement,
        error: onError
    },

    "AppEnv.showinfo" : {
        type: "single",
        call: AppEnv.show,
        callback: updateAppEnvInfo,
        error: onError
    },

    "AppEnv.refresh" : {
        type: "custom",
        call: function () {
            waitingNodes(dataTable_appenvs);
            Sunstone.runAction("AppEnv.list");
        }
    },

    "AppEnv.autorefresh" : {
        type: "custom",
        call: function() {
            AppEnv.list({timeout: true, success: updateAppEnvsView, error: onError});
        }
    },

    "AppEnv.fetch_update_info" : {
        type: "single",
        call: AppEnv.show,
        callback: function (request,response) {
            var body = JSON.parse(response.DOCUMENT.TEMPLATE.BODY);
            var templates = body.templates;
            var dialog = $('#appenv_template_update_dialog');
            // Select current templates
            if (templates)
                for (var i = 0; i < templates.length; i++){
                    var option = $('select[name="templates"] option[value="'+templates[i]+'"]', dialog);
                    option.text(option.text().replace(/☐/g,'☒'));
                    option.attr('clicked','clicked');
                };
            // Fill in node box with formatted json
            var json = JSON.stringify(body.node, null, '  ');
            $('#appenv_template_update_textarea', dialog).val(json);

            //Fill in permissions table
            setPermissionsTable(response.DOCUMENT,dialog);
        },
        error: onError
    },

    "AppEnv.update_dialog" : {
        type: "custom",
        call: popUpAppEnvTemplateUpdateDialog
    },

    "AppEnv.update" : {
        type: "single",
        call: AppEnv.update,
        callback: function() {
            notifyMessage(tr("Environment updated correctly"));
        },
        error: onError
    },

    "AppEnv.instantiate" : {
        type: "single",
        call: AppEnv.instantiate,
        callback: function() {
            notifyMessage(tr("Instantiated"));
        },
        error: onError
    },

    "AppEnv.delete" : {
        type: "multiple",
        call: AppEnv.del,
        callback: deleteAppEnvElement,
        elements: appEnvElements,
        error: onError,
        notify: true
    },

    "AppEnv.chown" : {
        type: "multiple",
        call: AppEnv.chown,
        callback:  function (req) {
            Sunstone.runAction("AppEnv.show",req.request.data[0][0]);
        },
        elements: appEnvElements,
        error: onError,
        notify: true
    },

    "AppEnv.chgrp" : {
        type: "multiple",
        call: AppEnv.chgrp,
        callback: function (req) {
            Sunstone.runAction("AppEnv.show",req.request.data[0][0]);
        },
        elements: appEnvElements,
        error: onError,
        notify: true
    },

    "AppEnv.chmod" : {
        type: "single",
        call: AppEnv.chmod,
//        callback
        error: onError,
        notify: true
    },
/*
    "AppEnv.clone_dialog" : {
        type: "custom",
        call: popUpAppEnvCloneDialog
    },
    "AppEnv.clone" : {
        type: "single",
        call: AppEnv.clone,
        error: onError,
        notify: true
    },
*/
    "AppEnv.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#appenvs_tab div.legend_div').slideToggle();
        }
    }
};


var appenv_buttons = {
    "AppEnv.refresh" : {
        type: "action",
        text: '<i class="icon-refresh icon-large">',
        alwaysActive: true
    },
    "AppEnv.create_dialog" : {
        type: "create_dialog",
        text: tr('+ New')
    },
    "AppEnv.update_dialog" : {
        type: "action",
        text: tr("Update properties"),
        alwaysActive: true
    },
    "AppEnv.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: users_sel,
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "AppEnv.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: groups_sel,
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
/*
    "AppEnv.clone_dialog" : {
        type: "action",
        text: tr("Clone")
    },
*/
    "AppEnv.delete" : {
        type: "confirm",
        text: tr("Delete")
    },
    "AppEnv.help" : {
        type: "action",
        text: '?',
        alwaysActive: true
    }
}

var appenv_info_panel = {
    "appenv_info_tab" : {
        title: tr("Environment information"),
        content: ""
    },

    "appenv_node_tab" : {
        title: tr("Node"),
        content: ""
    }

}

var appenvs_tab = {
    title: "Environments",
    content: appenv_tab_content,
    buttons: appenv_buttons,
    tabClass: 'subTab',
    parentTab: 'appenv_dashboard_tab'
}

Sunstone.addActions(appenv_actions);
Sunstone.addMainTab('appenvs_tab',appenvs_tab);
Sunstone.addInfoPanel('appenv_info_panel',appenv_info_panel);


function appEnvElements() {
    return getSelectedNodes(dataTable_appenvs);
}

// Returns an array containing the values of the appenv_json and ready
// to be inserted in the dataTable
function appEnvElementArray(appenv_json){
    //Changing this? It may affect to the is_persistent() functions.
    var appenv = appenv_json.DOCUMENT;
    var body = JSON.parse(appenv.TEMPLATE.BODY);
    var description =  body.description;

    return [
        '<input class="check_item" type="checkbox" id="appenv_'+appenv.ID+'" name="selected_items" value="'+appenv.ID+'"/>',
        appenv.ID,
        appenv.UNAME,
        appenv.GNAME,
        appenv.NAME,
        description ? description : tr("None")
    ];
}

// Callback to update an element in the dataTable
function updateAppEnvElement(request, appenv_json){
    var id = appenv_json.DOCUMENT.ID;
    var element = appEnvElementArray(appenv_json);
    updateSingleElement(element,dataTable_appenvs,'#appenv_'+id);
}

// Callback to remove an element from the dataTable
function deleteAppEnvElement(req){
    deleteElement(dataTable_appenvs,'#appenv_'+req.request.data);
}

// Callback to add an appenv element
function addAppEnvElement(request, appenv_json){
    var element = appEnvElementArray(appenv_json);
    addElement(element,dataTable_appenvs);
}

// Callback to refresh the list
function updateAppEnvsView(request, appenvs_list){
    var appenv_list_array = [];

    $.each(appenvs_list,function(){
       appenv_list_array.push(appEnvElementArray(this));
    });

    updateView(appenv_list_array,dataTable_appenvs);
    //updateVResDashboard("images",images_list);
    updateAppEnvDashboard('environments', appenv_list_array);
}

// Callback to update the information panel tabs and pop it up
function updateAppEnvInfo(request,elem){
    var elem_info = elem.DOCUMENT;
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




    var info_tab = {
        title: tr("Environment information"),
        content:
        '<table id="info_appenv_table" class="info_table">\
           <thead>\
            <tr><th colspan="2">'+tr("Environment")+' "'+elem_info.NAME+'" '+
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
              <td class="key_td">'+tr("Description")+'</td>\
              <td class="value_td">'+(elem_info.TEMPLATE.BODY.description ? elem_info.TEMPLATE.BODY.description : "None" )+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Owner")+'</td>\
              <td class="value_td">'+elem_info.UNAME+'</td>\
           </tr>\
           <tr>\
              <td class="key_td">'+tr("Group")+'</td>\
              <td class="value_td">'+elem_info.GNAME+'</td>\
           </tr>\
'+ (templates ?
    '<tr><td class="key_td">'+tr("Compatible templates")+'</td><td class="value_td">'+ templates.join(',')+'</td></tr>' : "")
+ (elem_info.TEMPLATE.BODY.cookbooks ?
    '<tr><td class="key_td">'+tr("Cookbooks")+'</td><td class="value_td">'+elem_info.TEMPLATE.BODY.cookbooks+'</td></tr>' : "")+
'          <tr><td class="key_td">'+tr("Permissions")+'</td><td></td></tr>\
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
'+ (!$.isEmptyObject(defaults) ?
    '<tr><td class="key_td">'+tr("Default variables")+'</td><td></td></tr>' +
    prettyPrintJSON(defaults, 28) : "") + '</table>\
\
       <table class="info_table" id="appenv_instantiate_table">\
           <thead>\
            <tr><th colspan="2">'+tr("Instantiate this environment")+'</th></tr>\
           </thead>\
           <tr>\
              <td class="key_td">'+tr("Template")+':</td>\
              <td class="value_td"><select>'+ compat_templates +'</select></td>\
           <tr>\
              <td class="key_td">'+tr("Variables")+':</td>\
              <td class="value_td"><input type="hidden" name="id" value="'+elem_info.ID+'"/></td>\
           </tr>\
'+ vars +'\
          <tr>\
              <td class="key_td"></td>\
              <td class="value_td"><button id="appenv_instantiate_button" value="AppEnv.instantiate">'+tr("Instantiate")+'</button></td>\
       </table>'
    }

    var node_tab = {
        title: tr("Node"),
        content: '<table id="appenv_node_table" class="info_table" style="width:80%;">\
            <thead><tr><th colspan="2">'+tr("Node")+'</th></tr></thead>'+
            (elem_info.TEMPLATE.BODY.node ? prettyPrintJSON(elem_info.TEMPLATE.BODY.node) : "" )+
            '</table>'
    }

    Sunstone.updateInfoPanelTab("appenv_info_panel","appenv_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("appenv_info_panel","appenv_node_tab",node_tab);

    Sunstone.popUpInfoPanel("appenv_info_panel");

}

// Prepare the creation dialog
function setupCreateAppEnvDialog(){
    dialogs_context.append('<div title="'+tr("Create environment")+'" id="create_appenv_dialog"></div>');
    $create_appenv_dialog =  $('#create_appenv_dialog',dialogs_context);

    var dialog = $create_appenv_dialog;
    dialog.html(create_appenv_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    //Prepare jquery dialog
    dialog.dialog({
        autoOpen: false,
        modal:true,
        width: 520,
        height: height
    });

    $('button',dialog).button();

    $('select[name="templates"]', dialog).change(function(){
        $(this).val("");
        return false;
    });

    //Somehow this needs to go here. Live() doesn't respond in setup function
    $('select#env_templates option').live("click", function(){
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

/******** UNUSED
    $('#add_custom_var_appenv_button', dialog).click(
        function(){
            var name = $('#custom_var_appenv_name',dialog).val();
            var value = $('#custom_var_appenv_value',dialog).val();
            if (!name.length || !value.length) {
                notifyError("Variable name and value must be filled in");
                return false;
            }
            option= '<option value=\''+value+'\' name=\''+name+'\'>'+
                name+'='+value+
                '</option>';
            $('select#custom_var_appenv_box',dialog).append(option);
            return false;
        }
    );

    $('#remove_custom_var_appenv_button', dialog).click(
        function(){
            $('select#custom_var_appenv_box :selected',dialog).remove();
            return false;
        }
    );
*/


    $('#create_appenv_form',dialog).submit(function(){
        var name = $('input[name="name"]', this).val();
        var description = $('input[name="description"]', this).val();
        var cookbooks = $('input[name="cookbooks"]', this).val();
        var node = $('textarea[name="node"]', this).val();

        if (!name){
            notifyError(tr("Name is mandatory!"));
            return false;
        }

        var appenv_obj = {
            name: name,
        }

        if (description) appenv_obj.description = description;
        if (cookbooks) appenv_obj.cookbooks = cookbooks;
        if (node) appenv_obj.node = node;

        var templates = $('select[name="templates"] option[clicked="clicked"]',
                          this);

        if (templates.length){
            var tmpls = []
            templates.each(function(){
                tmpls.push($(this).val())
            });
            appenv_obj.templates = tmpls
        };

        //UNUSED AT THIS POINT
/*
        var variables_array = [];
        var variables;
        $('#custom_var_appenv_box option', this).each(function(){
            var attr_name = $(this).attr('name');
            var attr_value = $(this).val();
            variables_array.push(attr_name +'='+ attr_value);
        });
        variables = variables_array.join(',');

        if (variables) appenv_obj.variables = variables;
*/

        Sunstone.runAction("AppEnv.create", { 'DOCUMENT': appenv_obj });
        dialog.dialog('close');
        return false;
    });
}

function popUpCreateAppEnvDialog(){
    var dialog = $create_appenv_dialog;
    var tpl_select = makeSelectOptions(dataTable_templates, 1, 4, [], [], true);
    $('select[name="templates"]', dialog).html(tpl_select);
    $('select[name="templates"] option', dialog).each(function(){
        $(this).text('☐ '+$(this).text());
    });

    dialog.dialog('open');
}



function setupAppEnvTemplateUpdateDialog(){

    //Append to DOM
    dialogs_context.append('<div id="appenv_template_update_dialog" title="'+tr("Update environment properties")+'"></div>');
    var dialog = $('#appenv_template_update_dialog',dialogs_context);

    //Put HTML in place
    dialog.html(update_appenv_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window
    //Convert into jQuery
    dialog.dialog({
        autoOpen:false,
        width:700,
        modal:true,
        height:height,
        resizable:false
    });

    $('button',dialog).button();

    $('#appenv_template_update_select',dialog).change(function(){
        var id = $(this).val();
        $('.permissions_table input',dialog).removeAttr('checked')
        $('.permissions_table',dialog).removeAttr('update');
        if (id && id.length){
            var dialog = $('#appenv_template_update_dialog');
            $('#appenv_template_update_textarea',dialog).val(tr("Loading")+
                                                            "...");
            Sunstone.runAction("AppEnv.fetch_update_info", id);
        } else {
            $('#appenv_template_update_textarea',dialog).val("");
        };
    });

    $('.permissions_table input',dialog).change(function(){
        $(this).parents('table').attr('update','update');
    });

    $('select[name="templates"]', dialog).change(function(){
        $(this).val("");
        return false;
    });


    $('form',dialog).submit(function(){
        var dialog = $(this);
        var new_node = $('#appenv_template_update_textarea',dialog).val();
        var cookbooks = $('input[name="cookbooks"]',dialog).val();
        var id = $('#appenv_template_update_select',dialog).val();
        if (!id || !id.length) {
            $(this).parents('#appenv_template_update_dialog').dialog('close');
            return false;
        };

        var permissions = $('.permissions_table',dialog);
        if (permissions.attr('update')){
            var perms = {
                octet : buildOctet(permissions)
            };
            Sunstone.runAction("AppEnv.chmod",id,perms);
        };

        var appenv_obj = {
            cookbooks: cookbooks,
            templates: templates
        };

        if (new_node) appenv_obj.node = new_node;

        var templates = $('select[name="templates"] option[clicked="clicked"]',
                          this);
        var tmpls = []
        templates.each(function(){
            tmpls.push($(this).val())
        });
        appenv_obj.templates = tmpls

        Sunstone.runAction("AppEnv.update", id, {'DOCUMENT' : appenv_obj});
        $(this).parents('#appenv_template_update_dialog').dialog('close');
        return false;
    });
};


function popUpAppEnvTemplateUpdateDialog(){
    var select = makeSelectOptions(dataTable_appenvs,
                                   1,//id_col
                                   4,//name_col
                                   [],
                                   []
                                  );
    var sel_elems = appEnvElements();


    var dialog =  $('#appenv_template_update_dialog');
    $('#appenv_template_update_select',dialog).html(select);
    $('#appenv_template_update_textarea',dialog).val("");
    $('#appenv_template_update_persistent',dialog).removeAttr('checked');
    $('.permissions_table input',dialog).removeAttr('checked');
    $('.permissions_table',dialog).removeAttr('update');


    if (sel_elems.length >= 1){ //several items in the list are selected
        //grep them
        var new_select= sel_elems.length > 1? '<option value="">'+tr("Please select")+'</option>' : "";
        $('option','<select>'+select+'</select>').each(function(){
            var val = $(this).val();
            if ($.inArray(val,sel_elems) >= 0){
                new_select+='<option value="'+val+'">'+$(this).text()+'</option>';
            };
        });
        $('#appenv_template_update_select',dialog).html(new_select);
        if (sel_elems.length == 1) {
            $('#appenv_template_update_select option',dialog).attr('selected','selected');
            $('#appenv_template_update_select',dialog).trigger("change");
        };
    };

    var tpl_select = makeSelectOptions(dataTable_templates, 1, 4, [], [], true);
    $('select[name="templates"]', dialog).html(tpl_select);
    $('select[name="templates"] option', dialog).each(function(){
        $(this).text('☐ '+$(this).text());
    });

    $('select[name="templates"] option', dialog).click(function(){
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

    dialog.dialog('open');
    return false;
};

function setupAppEnvInstantiate(){
    $('button#appenv_instantiate_button').live('click', function(){
        var vars = [];
        var context = $(this).parents('table#appenv_instantiate_table');

        var id = $('input[type="hidden"]', context).val();
        var template_id = $('select', context).val();

        $('input[type="text"]', context).each(function(){
            var key = $(this).attr('name');
            var val = $(this).val();

            if (val)
                vars.push(key +'='+ val)
        });

        var obj = { vars: vars,
                    template_id: template_id
                  };

        if (vars.length)
            Sunstone.runAction("AppEnv.instantiate", id, obj);
        return false;
    });

}


// Set the autorefresh interval for the datatable
function setAppEnvAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_appenvs);
        var filter = $("#datatable_appenvs_filter input",
                       dataTable_appenvs.parents("#datatable_appenvs_wrapper")).attr('value');
        if (!checked.length && !filter.length){
            Sunstone.runAction("AppEnv.autorefresh");
        }
    },INTERVAL+someTime());
};

/*
function setupAppEnvCloneDialog(){
    //Append to DOM
    dialogs_context.append('<div id="appenv_clone_dialog" title="'+tr("Clone an environment")+'"></div>');
    var dialog = $('#appenv_clone_dialog',dialogs_context);

    //Put HTML in place

    var html = '<form><fieldset>\
<div class="clone_one">'+tr("Choose a new name for the environment")+':</div>\
<div class="clone_several">'+tr("Several environments are selected, please choose prefix to name the new copies")+':</div>\
<br />\
<label class="clone_one">'+tr("Name")+':</label>\
<label class="clone_several">'+tr("Prefix")+':</label>\
<input type="text" name="name"></input>\
<div class="form_buttons">\
  <button class="button" id="appenv_clone_button" value="AppEnv.clone">\
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
        var sel_elems = appEnvElements();
        if (!name || !sel_elems.length)
            notifyError('A name or prefix is needed!');
        if (sel_elems.length > 1){
            for (var i=0; i< sel_elems.length; i++)
                //If we are cloning several items we
                //use the name as prefix
                Sunstone.runAction('AppEnv.clone',
                                   sel_elems[i],
                                   name + getName(sel_elems[i],
                                                  dataTable_appenvs,
                                                  4));
        } else {
            Sunstone.runAction('AppEnv.clone',sel_elems[0],name)
        };
        dialog.dialog('close');
        setTimeout(function(){
            Sunstone.runAction('AppEnv.refresh');
        }, 1500);
        return false;
    });
}

function popUpAppEnvCloneDialog(){
    var dialog = $('#appenv_clone_dialog');
    var sel_elems = appEnvElements();
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
                                                 dataTable_appenvs, 4));
    };

    $(dialog).dialog('open');
}

*/

//The DOM is ready at this point
$(document).ready(function(){

    dataTable_appenvs = $("#datatable_appenvs",main_tabs_context).dataTable({
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
            { "sWidth": "200px", "aTargets": [4] },
            { "sWidth": "35px", "aTargets": [1] }
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    dataTable_appenvs.fnClearTable();
    addElement([
        spinner,
        '','','','',''],dataTable_appenvs);
    Sunstone.runAction("AppEnv.list");

    setupCreateAppEnvDialog();
    setupAppEnvTemplateUpdateDialog();
    setupAppEnvInstantiate();
    setupTips($create_appenv_dialog);
//    setupImageCloneDialog();
    setAppEnvAutorefresh();

    initCheckAllBoxes(dataTable_appenvs);
    tableCheckboxesListener(dataTable_appenvs);
    infoListener(dataTable_appenvs,'AppEnv.showinfo');

    $('div#appenvs_tab div.legend_div').hide();
});
