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

var AppStage = {
    "resource" : 'DOCUMENT',
    "path" : "appstage",
    "create": function(params){
        OpenNebula.Action.create(params,AppStage.resource,
                                 AppStage.path);
    },
    "del": function(params){
        OpenNebula.Action.del(params,AppStage.resource,
                              AppStage.path);
    },
    "list" : function(params){
        OpenNebula.Action.list(params, AppStage.resource,
                               AppStage.path)
    },
    "show" : function(params){
        OpenNebula.Action.show(params, AppStage.resource,
                               null, AppStage.path)
    },
    "chown" : function(params){
        OpenNebula.Action.chown(params,AppStage.resource,
                                AppStage.path);
    },
    "chgrp" : function(params){
        OpenNebula.Action.chgrp(params,AppStage.resource,
                                AppStage.path);
    },
    "chmod" : function(params){
        var action_obj = params.data.extra_param;
        OpenNebula.Action.simple_action(params,
                                        AppStage.resource,
                                        "chmod",
                                        action_obj, AppStage.path);
    },
    "update" : function(params){
        OpenNebula.Action.simple_action(params,
                                        AppStage.resource,
                                        "update",
                                        params.data.extra_param,
                                        AppStage.path);
    },
    "instantiate" : function(params){
        OpenNebula.Action.simple_action(params,
                                        AppStage.resource,
                                        "instantiate",
                                        params.data.extra_param,
                                        AppStage.path);
    }
}

var appstage_tab_content = '\
<h2><i class="icon-magic"></i> '+tr("AppStage - Environments")+'</h2>\
<form id="appstage_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_appstages" class="display">\
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

var create_appstage_tmpl = '\
<div class="create_form"><form id="create_appstage_form" action="">\
  <fieldset>\
      <legend style="display:none;">' + tr("Environment") + '</legend>\
      <div class="appstage_param">\
          <label for="name">' + tr("Name") + ':</label><input type="text" name="name" />\
      </div>\
      <div class="appstage_param">\
          <label for="description">' + tr("Description") + ':</label><input type="text" name="description" />\
      </div>\
      <div class="appstage_param">\
          <label for="templates">'+tr("Compatible templates")+':</label>\
          <select type="text" id="env_templates" name="templates" multiple>\
          </select>\
      </div>\
      <div class="appstage_param">\
          <label for="cookbooks">' + tr("Cookbooks URL") + ':</label><input type="text" name="cookbooks" />\
      </div>\
  </fieldset>\
<!--\
  <fieldset>\
      <div class="appstage_param">\
         <label for="node">'+tr("Variables")+':</label>\
          <div class="clear"></div>\
         <label for="custom_var_appstage_name">'+tr("Name")+':</label>\
         <input type="text" id="custom_var_appstage_name" name="custom_var_appstage_name" /><br />\
         <label for="custom_var_appstage_value">'+tr("Value")+':</label>\
         <input type="text" id="custom_var_appstage_value" name="custom_var_appstage_value" /><br />\
         <button class="add_remove_button add_button" id="add_custom_var_appstage_button" value="add_custom_appstage_var">'+tr("Add")+'</button>\
         <button class="add_remove_button" id="remove_custom_var_appstage_button" value="remove_custom_appstage_var">'+tr("Remove selected")+'</button>\
         <div class="clear"></div>\
         <label for="custom_var_appstage_box">'+tr("Custom attributes")+':</label>\
         <select id="custom_var_appstage_box" name="custom_var_appstage_box" style="height:100px;" multiple>\
         </select>\
      </div>\
  </fieldset>\
-->\
  <fieldset>\
      <div class="appstage_param">\
          <label for="node">'+tr("Node")+':</label>\
          <div class="clear"></div>\
          <textarea name="node" style="width:100%; height:14em;"></textarea>\
      </div>\
  </fieldset>\
  <fieldset>\
    <div class="form_buttons">\
        <div><button class="button" type="submit" value="AppStage.create">' + tr("Create") + '</button>\
        <button class="button" type="reset" value="reset">' + tr("Reset") + '</button></div>\
    </div>\
  </fieldset>\
</form></div>';

var update_appstage_tmpl =
   '<form action="javascript:alert(\'js error!\');">\
         <h3 style="margin-bottom:10px;">'+tr("Please, choose and modify the environment you want to update")+':</h3>\
            <fieldset style="border-top:none;">\
                 <label for="appstage_template_update_select">'+tr("Select an environment")+':</label>\
                 <select id="appstage_template_update_select" name="appstage_template_update_select"></select>\
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
                         <td style="text-align:center"><input type="checkbox" name="appstage_owner_u" class="owner_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="appstage_owner_m" class="owner_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="appstage_owner_a" class="owner_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Group")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="appstage_group_u" class="group_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="appstage_group_m" class="group_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="appstage_group_a" class="group_a" /></td>\
                     </tr>\
                     <tr>\
                         <td>'+tr("Other")+'</td>\
                         <td style="text-align:center"><input type="checkbox" name="appstage_other_u" class="other_u" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="appstage_other_m" class="other_m" /></td>\
                         <td style="text-align:center"><input type="checkbox" name="appstage_other_a" class="other_a" /></td>\
                     </tr>\
                   </table>\
                 </div>\
                 <label for="appstage_template_update_textarea">'+tr("Node")+':</label>\
                 <div class="clear"></div>\
                 <textarea id="appstage_template_update_textarea" style="width:100%; height:14em;"></textarea>\
            </fieldset>\
            <fieldset>\
                 <div class="form_buttons">\
                    <button class="button" id="appstage_template_update_button" value="AppStage.update_template">'+tr("Update")+'\
                    </button>\
                 </div>\
            </fieldset>\
</form>';

var dataTable_appstages;
var $create_appstage_dialog;

var appstage_actions = {

    "AppStage.create" : {
        type: "create",
        call: AppStage.create,
        callback: addAppStageElement,
        error: onError,
        notify:true
    },

    "AppStage.create_dialog" : {
        type: "custom",
        call: popUpCreateAppStageDialog
    },

    "AppStage.list" : {
        type: "list",
        call: AppStage.list,
        callback: updateAppStagesView,
        error: onError
    },

    "AppStage.show" : {
        type : "single",
        call: AppStage.show,
        callback: updateAppStageElement,
        error: onError
    },

    "AppStage.showinfo" : {
        type: "single",
        call: AppStage.show,
        callback: updateAppStageInfo,
        error: onError
    },

    "AppStage.refresh" : {
        type: "custom",
        call: function () {
            waitingNodes(dataTable_appstages);
            Sunstone.runAction("AppStage.list");
        }
    },

    "AppStage.autorefresh" : {
        type: "custom",
        call: function() {
            AppStage.list({timeout: true, success: updateAppStagesView, error: onError});
        }
    },

    "AppStage.fetch_update_info" : {
        type: "single",
        call: AppStage.show,
        callback: function (request,response) {
            var body = JSON.parse(response.DOCUMENT.TEMPLATE.BODY);
            var templates = body.templates;
            var dialog = $('#appstage_template_update_dialog');
            // Select current templates
            if (templates)
                for (var i = 0; i < templates.length; i++){
                    var option = $('select[name="templates"] option[value="'+templates[i]+'"]', dialog);
                    option.text(option.text().replace(/☐/g,'☒'));
                    option.attr('clicked','clicked');
                };
            // Fill in node box with formatted json
            var json = JSON.stringify(body.node, null, '  ');
            $('#appstage_template_update_textarea', dialog).val(json);

            //Fill in permissions table
            setPermissionsTable(response.DOCUMENT,dialog);
        },
        error: onError
    },

    "AppStage.update_dialog" : {
        type: "custom",
        call: popUpAppStageTemplateUpdateDialog
    },

    "AppStage.update" : {
        type: "single",
        call: AppStage.update,
        callback: function() {
            notifyMessage(tr("Environment updated correctly"));
        },
        error: onError
    },

    "AppStage.instantiate" : {
        type: "single",
        call: AppStage.instantiate,
        callback: function() {
            notifyMessage(tr("Instantiated"));
        },
        error: onError
    },

    "AppStage.delete" : {
        type: "multiple",
        call: AppStage.del,
        callback: deleteAppStageElement,
        elements: appStageElements,
        error: onError,
        notify: true
    },

    "AppStage.chown" : {
        type: "multiple",
        call: AppStage.chown,
        callback:  function (req) {
            Sunstone.runAction("AppStage.show",req.request.data[0][0]);
        },
        elements: appStageElements,
        error: onError,
        notify: true
    },

    "AppStage.chgrp" : {
        type: "multiple",
        call: AppStage.chgrp,
        callback: function (req) {
            Sunstone.runAction("AppStage.show",req.request.data[0][0]);
        },
        elements: appStageElements,
        error: onError,
        notify: true
    },

    "AppStage.chmod" : {
        type: "single",
        call: AppStage.chmod,
//        callback
        error: onError,
        notify: true
    },
/*
    "AppStage.clone_dialog" : {
        type: "custom",
        call: popUpAppStageCloneDialog
    },
    "AppStage.clone" : {
        type: "single",
        call: AppStage.clone,
        error: onError,
        notify: true
    },
*/
    "AppStage.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#appstages_tab div.legend_div').slideToggle();
        }
    }
};


var appstage_buttons = {
    "AppStage.refresh" : {
        type: "action",
        text: '<i class="icon-refresh icon-large">',
        alwaysActive: true
    },
    "AppStage.create_dialog" : {
        type: "create_dialog",
        text: tr('+ New')
    },
    "AppStage.update_dialog" : {
        type: "action",
        text: tr("Update properties"),
        alwaysActive: true
    },
    "AppStage.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: users_sel,
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "AppStage.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: groups_sel,
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
/*
    "AppStage.clone_dialog" : {
        type: "action",
        text: tr("Clone")
    },
*/
    "AppStage.delete" : {
        type: "confirm",
        text: tr("Delete")
    },
    "AppStage.help" : {
        type: "action",
        text: '?',
        alwaysActive: true
    }
}

var appstage_info_panel = {
    "appstage_info_tab" : {
        title: tr("Environment information"),
        content: ""
    },

    "appstage_node_tab" : {
        title: tr("Node"),
        content: ""
    }

}

var appstages_tab = {
    title: "Environments",
    content: appstage_tab_content,
    buttons: appstage_buttons,
    tabClass: 'subTab',
    parentTab: 'appstage_dashboard_tab'
}

Sunstone.addActions(appstage_actions);
Sunstone.addMainTab('appstages_tab',appstages_tab);
Sunstone.addInfoPanel('appstage_info_panel',appstage_info_panel);


function appStageElements() {
    return getSelectedNodes(dataTable_appstages);
}

// Returns an array containing the values of the appstage_json and ready
// to be inserted in the dataTable
function appStageElementArray(appstage_json){
    //Changing this? It may affect to the is_persistent() functions.
    var appstage = appstage_json.DOCUMENT;
    var body = JSON.parse(appstage.TEMPLATE.BODY);
    var description =  body.description;

    return [
        '<input class="check_item" type="checkbox" id="appstage_'+appstage.ID+'" name="selected_items" value="'+appstage.ID+'"/>',
        appstage.ID,
        appstage.UNAME,
        appstage.GNAME,
        appstage.NAME,
        description ? description : tr("None")
    ];
}

// Callback to update an element in the dataTable
function updateAppStageElement(request, appstage_json){
    var id = appstage_json.DOCUMENT.ID;
    var element = appstageElementArray(appstage_json);
    updateSingleElement(element,dataTable_appstages,'#appstage_'+id);
}

// Callback to remove an element from the dataTable
function deleteAppStageElement(req){
    deleteElement(dataTable_appstages,'#appstage_'+req.request.data);
}

// Callback to add an appstage element
function addAppStageElement(request, appstage_json){
    var element = appStageElementArray(appstage_json);
    addElement(element,dataTable_appstages);
}

// Callback to refresh the list
function updateAppStagesView(request, appstages_list){
    var appstage_list_array = [];

    $.each(appstages_list,function(){
       appstage_list_array.push(appStageElementArray(this));
    });

    updateView(appstage_list_array,dataTable_appstages);
    //updateVResDashboard("images",images_list);
    updateAppStageDashboard('environments', appstage_list_array);
}

// Callback to update the information panel tabs and pop it up
function updateAppStageInfo(request,elem){
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
        '<table id="info_appstage_table" class="info_table">\
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
       <table class="info_table" id="appstage_instantiate_table">\
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
              <td class="value_td"><button id="appstage_instantiate_button" value="AppStage.instantiate">'+tr("Instantiate")+'</button></td>\
       </table>'
    }

    var node_tab = {
        title: tr("Node"),
        content: '<table id="appstage_node_table" class="info_table" style="width:80%;">\
            <thead><tr><th colspan="2">'+tr("Node")+'</th></tr></thead>'+
            (elem_info.TEMPLATE.BODY.node ? prettyPrintJSON(elem_info.TEMPLATE.BODY.node) : "" )+
            '</table>'
    }

    Sunstone.updateInfoPanelTab("appstage_info_panel","appstage_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("appstage_info_panel","appstage_node_tab",node_tab);

    Sunstone.popUpInfoPanel("appstage_info_panel");

}

// Prepare the creation dialog
function setupCreateAppStageDialog(){
    dialogs_context.append('<div title="'+tr("Create environment")+'" id="create_appstage_dialog"></div>');
    $create_appstage_dialog =  $('#create_appstage_dialog',dialogs_context);

    var dialog = $create_appstage_dialog;
    dialog.html(create_appstage_tmpl);

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
    $('#add_custom_var_appstage_button', dialog).click(
        function(){
            var name = $('#custom_var_appstage_name',dialog).val();
            var value = $('#custom_var_appstage_value',dialog).val();
            if (!name.length || !value.length) {
                notifyError("Variable name and value must be filled in");
                return false;
            }
            option= '<option value=\''+value+'\' name=\''+name+'\'>'+
                name+'='+value+
                '</option>';
            $('select#custom_var_appstage_box',dialog).append(option);
            return false;
        }
    );

    $('#remove_custom_var_appstage_button', dialog).click(
        function(){
            $('select#custom_var_appstage_box :selected',dialog).remove();
            return false;
        }
    );
*/


    $('#create_appstage_form',dialog).submit(function(){
        var name = $('input[name="name"]', this).val();
        var description = $('input[name="description"]', this).val();
        var cookbooks = $('input[name="cookbooks"]', this).val();
        var node = $('textarea[name="node"]', this).val();

        if (!name){
            notifyError(tr("Name is mandatory!"));
            return false;
        }

        var appstage_obj = {
            name: name,
        }

        if (description) appstage_obj.description = description;
        if (cookbooks) appstage_obj.cookbooks = cookbooks;
        if (node) appstage_obj.node = node;

        var templates = $('select[name="templates"] option[clicked="clicked"]',
                          this);

        if (templates.length){
            var tmpls = []
            templates.each(function(){
                tmpls.push($(this).val())
            });
            appstage_obj.templates = tmpls
        };

        //UNUSED AT THIS POINT
/*
        var variables_array = [];
        var variables;
        $('#custom_var_appstage_box option', this).each(function(){
            var attr_name = $(this).attr('name');
            var attr_value = $(this).val();
            variables_array.push(attr_name +'='+ attr_value);
        });
        variables = variables_array.join(',');

        if (variables) appstage_obj.variables = variables;
*/

        Sunstone.runAction("AppStage.create", { 'DOCUMENT': appstage_obj });
        dialog.dialog('close');
        return false;
    });
}

function popUpCreateAppStageDialog(){
    var dialog = $create_appstage_dialog;
    var tpl_select = makeSelectOptions(dataTable_templates, 1, 4, [], [], true);
    $('select[name="templates"]', dialog).html(tpl_select);
    $('select[name="templates"] option', dialog).each(function(){
        $(this).text('☐ '+$(this).text());
    });

    dialog.dialog('open');
}



function setupAppStageTemplateUpdateDialog(){

    //Append to DOM
    dialogs_context.append('<div id="appstage_template_update_dialog" title="'+tr("Update environment properties")+'"></div>');
    var dialog = $('#appstage_template_update_dialog',dialogs_context);

    //Put HTML in place
    dialog.html(update_appstage_tmpl);

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

    $('#appstage_template_update_select',dialog).change(function(){
        var id = $(this).val();
        $('.permissions_table input',dialog).removeAttr('checked')
        $('.permissions_table',dialog).removeAttr('update');
        if (id && id.length){
            var dialog = $('#appstage_template_update_dialog');
            $('#appstage_template_update_textarea',dialog).val(tr("Loading")+
                                                            "...");
            Sunstone.runAction("AppStage.fetch_update_info", id);
        } else {
            $('#appstage_template_update_textarea',dialog).val("");
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
        var new_node = $('#appstage_template_update_textarea',dialog).val();
        var cookbooks = $('input[name="cookbooks"]',dialog).val();
        var id = $('#appstage_template_update_select',dialog).val();
        if (!id || !id.length) {
            $(this).parents('#appstage_template_update_dialog').dialog('close');
            return false;
        };

        var permissions = $('.permissions_table',dialog);
        if (permissions.attr('update')){
            var perms = {
                octet : buildOctet(permissions)
            };
            Sunstone.runAction("AppStage.chmod",id,perms);
        };

        var appstage_obj = {
            cookbooks: cookbooks,
            templates: templates
        };

        if (new_node) appstage_obj.node = new_node;

        var templates = $('select[name="templates"] option[clicked="clicked"]',
                          this);
        var tmpls = []
        templates.each(function(){
            tmpls.push($(this).val())
        });
        appstage_obj.templates = tmpls

        Sunstone.runAction("AppStage.update", id, {'DOCUMENT' : appstage_obj});
        $(this).parents('#appstage_template_update_dialog').dialog('close');
        return false;
    });
};


function popUpAppStageTemplateUpdateDialog(){
    var select = makeSelectOptions(dataTable_appstages,
                                   1,//id_col
                                   4,//name_col
                                   [],
                                   []
                                  );
    var sel_elems = appStageElements();


    var dialog =  $('#appstage_template_update_dialog');
    $('#appstage_template_update_select',dialog).html(select);
    $('#appstage_template_update_textarea',dialog).val("");
    $('#appstage_template_update_persistent',dialog).removeAttr('checked');
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
        $('#appstage_template_update_select',dialog).html(new_select);
        if (sel_elems.length == 1) {
            $('#appstage_template_update_select option',dialog).attr('selected','selected');
            $('#appstage_template_update_select',dialog).trigger("change");
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

function setupAppStageInstantiate(){
    $('button#appstage_instantiate_button').live('click', function(){
        var vars = [];
        var context = $(this).parents('table#appstage_instantiate_table');

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
            Sunstone.runAction("AppStage.instantiate", id, obj);
        return false;
    });

}


// Set the autorefresh interval for the datatable
function setAppStageAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_appstages);
        var filter = $("#datatable_appstages_filter input",
                       dataTable_appstages.parents("#datatable_appstages_wrapper")).attr('value');
        if (!checked.length && !filter.length){
            Sunstone.runAction("AppStage.autorefresh");
        }
    },INTERVAL+someTime());
};

/*
function setupAppStageCloneDialog(){
    //Append to DOM
    dialogs_context.append('<div id="appstage_clone_dialog" title="'+tr("Clone an environment")+'"></div>');
    var dialog = $('#appstage_clone_dialog',dialogs_context);

    //Put HTML in place

    var html = '<form><fieldset>\
<div class="clone_one">'+tr("Choose a new name for the environment")+':</div>\
<div class="clone_several">'+tr("Several environments are selected, please choose prefix to name the new copies")+':</div>\
<br />\
<label class="clone_one">'+tr("Name")+':</label>\
<label class="clone_several">'+tr("Prefix")+':</label>\
<input type="text" name="name"></input>\
<div class="form_buttons">\
  <button class="button" id="appstage_clone_button" value="AppStage.clone">\
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
        var sel_elems = appStageElements();
        if (!name || !sel_elems.length)
            notifyError('A name or prefix is needed!');
        if (sel_elems.length > 1){
            for (var i=0; i< sel_elems.length; i++)
                //If we are cloning several items we
                //use the name as prefix
                Sunstone.runAction('AppStage.clone',
                                   sel_elems[i],
                                   name + getName(sel_elems[i],
                                                  dataTable_appstages,
                                                  4));
        } else {
            Sunstone.runAction('AppStage.clone',sel_elems[0],name)
        };
        dialog.dialog('close');
        setTimeout(function(){
            Sunstone.runAction('AppStage.refresh');
        }, 1500);
        return false;
    });
}

function popUpAppStageCloneDialog(){
    var dialog = $('#appstage_clone_dialog');
    var sel_elems = appStageElements();
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
                                                 dataTable_appstages, 4));
    };

    $(dialog).dialog('open');
}

*/

//The DOM is ready at this point
$(document).ready(function(){

    dataTable_appstages = $("#datatable_appstages",main_tabs_context).dataTable({
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

    dataTable_appstages.fnClearTable();
    addElement([
        spinner,
        '','','','',''],dataTable_appstages);
    Sunstone.runAction("AppStage.list");

    setupCreateAppStageDialog();
    setupAppStageTemplateUpdateDialog();
    setupAppStageInstantiate();
    setupTips($create_appstage_dialog);
//    setupImageCloneDialog();
    setAppStageAutorefresh();

    initCheckAllBoxes(dataTable_appstages);
    tableCheckboxesListener(dataTable_appstages);
    infoListener(dataTable_appstages,'AppStage.showinfo');

    $('div#appstages_tab div.legend_div').hide();
});
