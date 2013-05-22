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
<form class="custom" id="template_form" action="">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
       <i class="icon-magic"></i> '+tr("AppStage - Environments")+'\
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
    <input id="environments_search" type="text" placeholder="'+tr("Search")+'" />\
  </div>\
  <br>\
  <br>\
</div>\
</div>\
  <div class="row">\
    <div class="twelve columns">\
      <table id="datatable_appstages" class="datatable twelve">\
        <thead>\
          <tr>\
            <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
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
  </div>\
  </div>\
</form>';

var create_appstage_tmpl = '\
<div class="panel">\
  <h3>\
    <small id="create_appstage_template_header">'+tr("Create Environment")+'</small>\
  </h3>\
</div>\
<div class="reveal-body create_form">\
  <form id="create_appstage_form" action="">\
    <div class="row">\
        <div class="appstage_param six columns">\
          <div class="row">\
            <div class="four columns">\
                <label class="inline right" for="name">' + tr("Name") + ':</label>\
            </div>\
            <div class="seven columns">\
                <input type="text" name="name" />\
            </div>\
            <div class="one columns">\
                <div class="tip">'+ tr("Name for this environment") +'</div>\
            </div>\
          </div>\
          <div class="row">\
            <div class="four columns">\
                <label class="inline right" for="description">' + tr("Description") + ':</label>\
            </div>\
            <div class="seven columns">\
                <textarea type="text" name="description" rows="3"/>\
            </div>\
            <div class="one columns">\
                <div class="tip">'+ tr("Description for this environment") +'</div>\
            </div>\
          </div>\
        </div>\
        <div class="appstage_param st_man six columns">\
          <fieldset>\
            <legend>'+tr("Compatible templates")+'</legend>\
            <div class="eleven columns">\
              <select type="text" id="env_templates" name="templates" style=\'font-size: 12PX;font-weight: normal;font-family: "Open Sans";width: 100%;\' multiple>\
              </select>\
            </div>\
            <div class="one columns">\
                <div class="tip">'+ tr("Templates compatible with the node. This is useful to instantiate the same environment with different OS installations") +'</div>\
            </div>\
          </fieldset>\
        </div>\
    </div>\
    <div class="row appstage_param">\
      <fieldset>\
        <legend>'+tr("Node")+'</legend>\
            <div class="appstage_param six columns">\
              <div class="row ">\
                  <div class="four columns">\
                      <label class="inline right" for="cookbooks">'+tr("Cookbooks URL")+':</label>\
                  </div>\
                  <div class="seven columns">\
                      <input type="text" name="cookbooks" />\
                  </div>\
                  <div class="one columns">\
                      <div class="tip">'+ tr("URL to extra cookbooks (tar.gz file). Standard recipes will use the chef cookbooks repository") +'</div>\
                  </div>\
              </div>\
              <div class="row ">\
                  <div class="twelve columns">\
                    <textarea name="node" rows="10" placeholder="'+tr("JSON encoded string containing the recipes"+
                      " that are going to be run on the VM and parameters that will be used to install and configure"+
                      " the software. Check the example on the right")+'"></textarea>\
                  </div>\
              </div>\
            </div>\
            <div class="five columns">\
              Example:\
              <pre style=\'font-family: "Open Sans", sans-serif; line-height: 1.6; font-size:12px\'>'+
                JSON.stringify({
                  name: "wordpress",
                  run_list: [
                    "recipe[wordpress]"
                  ],
                  wordpress: {
                    db: {
                      user: "${WP_DB_USER|wordpress}",
                      password: "${WP_DB_PASSWORD|password}"
                    }
                  }
                }, undefined, 2)+
              '</pre>\
            </div>\
      </fieldset>\
    </div>\
    <div class="reveal-footer">\
      <hr>\
      <div class="form_buttons">\
        <button class="button radius right success" type="submit" value="AppStage.create">' + tr("Create") + '</button>\
        <button class="button radius secondary" type="reset" value="reset">' + tr("Reset") + '</button>\
        <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
      </div>\
    </div>\
    <a class="close-reveal-modal">&#215;</a>\
  </form>\
</div>';

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

var instantiate_env_tmpl ='\
        <div class="panel">\
          <h3>\
            <small id="instantiate_env_header">'+tr("Instantiate Environment")+'</small>\
          </h3>\
        </div>\
        <form id="instantiate_env_form" action="">\
          <div id="instantiate_env_form_content">\
          </div>\
          <div class="reveal-footer">\
                <hr>\
              <div class="form_buttons">\
                 <button class="button radius right success" id="instantiate_vm_tenplate_proceed" value="Template.instantiate_vms">'+tr("Instantiate")+'</button>\
                 <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
              </div>\
          </div>\
<a class="close-reveal-modal">&#215;</a>\
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

    "AppStage.instantiate_dialog" : {
        type: "custom",
        call: popUpEnvInstantiateDialog
    },

    "AppStage.show_to_instantiate" : {
        type: "single",
        call: AppStage.show,
        callback: fillEnvInstantiateDialog,
        error: onError
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
        error: onError,
        notify: true
    },
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
        layout: "refresh",
        alwaysActive: true
    },
    "AppStage.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "AppStage.update_dialog" : {
        type: "action",
        text: tr("Update"),
        layout: "main"
    },
    "AppStage.instantiate_dialog" : {
        type: "action",
        text: tr("Instantiate"),
        layout: "main"
    },
    "AppStage.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        select: users_sel,
        layout: "user_select",
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "AppStage.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: groups_sel,
        layout: "user_select",
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
    "AppStage.delete" : {
        type: "confirm",
        layout: "del",
        text: tr("Delete")
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
Sunstone.addMainTab('apptools-appstage',appstages_tab);
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

    var defaults = elem_info.TEMPLATE.BODY.defaults;

    var info_tab = {
        title: tr("Information"),
        content:
        '<div class="">\
          <div class="six columns">\
          <table id="info_appstage_table" class="twelve datatable extended_table">\
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
'+ (templates ?
    '<tr><td class="key_td">'+tr("Compatible templates")+'</td><td class="value_td">'+ templates.join(',')+'</td></tr>' : "")
+ (elem_info.TEMPLATE.BODY.cookbooks ?
    '<tr>\
      <td class="key_td">'+tr("Cookbooks")+'</td>\
      <td class="value_td">'+elem_info.TEMPLATE.BODY.cookbooks+'</td>\
    </tr>' : "")+
   (!$.isEmptyObject(defaults) ?
    '<thead><tr><th class="key_td">'+tr("Default variables")+'</th><th></th></tr></thead>' +
    prettyPrintJSON(defaults, 28) : "") + '</table>\
       </div>\
        <div class="six columns">' + insert_permissions_table('apptools-appstage',
                                                              "AppStage",
                                                              elem_info.ID,
                                                              elem_info.UNAME,
                                                              elem_info.GNAME,
                                                              elem_info.UID,
                                                              elem_info.GID) +
        '</div>\
     </div>'
    }

    var node_tab = {
        title: tr("Node"),
        content: '<div class="columns twelve">\
          <div id="datatable_cluster_hosts_info_div">\
          <table id="appstage_node_table" class="twelve datatable extended_table">\
            <thead><tr><th colspan="2">'+tr("Node")+'</th></tr></thead>'+
            (elem_info.TEMPLATE.BODY.node ? prettyPrintJSON(elem_info.TEMPLATE.BODY.node) : "" )+
            '</table>\
          </div'
    }

    Sunstone.updateInfoPanelTab("appstage_info_panel","appstage_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("appstage_info_panel","appstage_node_tab",node_tab);

    Sunstone.popUpInfoPanel("appstage_info_panel", "apptools-appstage");

    setPermissionsTable(elem_info,'');

    $("#appstage_info_panel_refresh", $("#appstage_info_panel")).click(function(){
      $(this).html(spinner);
      Sunstone.runAction('AppStage.showinfo', elem_info.ID);
    })
}

// Prepare the creation dialog
function setupCreateAppStageDialog(){
    dialogs_context.append('<div id="create_appstage_dialog"></div>');
    $create_appstage_dialog =  $('#create_appstage_dialog',dialogs_context);

    var dialog = $create_appstage_dialog;
    dialog.html(create_appstage_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window

    //Prepare jquery dialog
    dialog.addClass("reveal-modal xlarge max-height");

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

        Sunstone.runAction("AppStage.create", { 'DOCUMENT': appstage_obj });
        dialog.trigger("reveal:close")
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

    dialog.reveal();
}

function popUpEnvInstantiateDialog(){
    var selected_nodes = getSelectedNodes(dataTable_appstages);

    if ( selected_nodes.length != 1 )
    {
      notifyMessage("Please select one (and just one) environment to instantiate.");
      return false;
    }

    var env_id   = ""+selected_nodes[0];
    Sunstone.runAction("AppStage.show_to_instantiate", env_id);
}

function setupEnvInstantiateDialog(){
    //Append to DOM
    dialogs_context.append('<div id="appstage_env_instantiate_dialog"></div>');
    var dialog = $('#appstage_env_instantiate_dialog',dialogs_context);

    //Put HTML in place
    dialog.html(instantiate_env_tmpl);

    //Convert into jQuery
    dialog.addClass("reveal-modal large max-height");

    $("#appstage_env_instantiate_dialog").submit(function(){
        var vars = [];

        var id = $('input[type="hidden"]', this).val();
        var template_id = $('select', this).val();

        $('input[type="text"]', this).each(function(){
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
    })
}

function fillEnvInstantiateDialog(request, response){
    var elem_info = response.DOCUMENT;
    elem_info.TEMPLATE.BODY = JSON.parse(elem_info.TEMPLATE.BODY);

    var str = '<input type="hidden" name="id" value="'+elem_info.ID+'"/>'

    // Form options of compatible templates
    var templates = elem_info.TEMPLATE.BODY.templates;
    if (templates) {
        str += '<div class="row">\
                  <div class="four columns">\
                      <label class="inline right" for="env_template">'+tr("Template")+':</label>\
                  </div>\
                  <div class="seven columns">\
                      <select name="env_template">';

        for (var i = 0; i < templates.length; i++) {
          str += '<option value="'+ templates[i] +'">\
                      '+ getTemplateName(templates[i]) +'\
                  </option>';
        }

        str += '</select>\
              </div>\
              <div class="one columns">\
              </div>\
          </div>'
    }

    // Form variables
    var defaults = elem_info.TEMPLATE.BODY.defaults;
    if (!$.isEmptyObject(defaults)){
        str += '<div class="row">\
                  <fieldset>\
                    <legend>'+tr("Variables")+'</legend>'

        for (key in defaults){
          str += '<div class="row centered">\
                    <div class="four columns">\
                        <label class="inline right" for="'+key+'">'+key+':</label>\
                    </div>\
                    <div class="seven columns">\
                        <input type="text" name="'+ key +'"value="'+ defaults[key] +'"></input>\
                    </div>\
                    <div class="one columns">\
                    </div>\
                  </div>'
        };

        str += '</fieldset>\
              </div>'
    }

    $("#instantiate_env_form_content").html(str);
    $('#appstage_env_instantiate_dialog',dialogs_context).reveal();
}


function setupAppStageTemplateUpdateDialog(){

    //Append to DOM
    dialogs_context.append('<div id="appstage_template_update_dialog" title="'+tr("Update environment properties")+'"></div>');
    var dialog = $('#appstage_template_update_dialog',dialogs_context);

    //Put HTML in place
    dialog.html(update_appstage_tmpl);

    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window
    //Convert into jQuery
    dialog.addClass("reveal-modal xlarge");

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
            $(this).parents('#appstage_template_update_dialog').trigger("reveal:close")
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
        $(this).parents('#appstage_template_update_dialog').trigger("reveal:close")
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

    dialog.reveal();

    return false;
};

// Set the autorefresh interval for the datatable
function setAppStageAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_appstages);
        var filter = $("#environments_search").attr('value');
        if (!checked.length && !filter.length){
            Sunstone.runAction("AppStage.autorefresh");
        }
    },INTERVAL+someTime());
};

//The DOM is ready at this point
$(document).ready(function(){

    dataTable_appstages = $("#datatable_appstages",main_tabs_context).dataTable({
        "sDom" : "<'H'>t<'row'<'six columns'i><'six columns'p>>",
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "100px", "aTargets": [2,3] },
            { "sWidth": "200px", "aTargets": [4] },
            { "sWidth": "35px", "aTargets": [1] }
        ]
    });

    $('#environments_search').keyup(function(){
      dataTable_appstages.fnFilter( $(this).val() );
    })

    Sunstone.runAction("AppStage.list");

    setupCreateAppStageDialog();
    setupAppStageTemplateUpdateDialog();
    setupEnvInstantiateDialog();
    setupTips($create_appstage_dialog);
    setAppStageAutorefresh();

    initCheckAllBoxes(dataTable_appstages);
    tableCheckboxesListener(dataTable_appstages);
    infoListener(dataTable_appstages,'AppStage.showinfo');

    $('div#appstages_tab div.legend_div').hide();
  });
