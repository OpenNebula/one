/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

/*Users tab plugin*/
var dataTable_users;
var users_select="";
var $create_user_dialog;
var $user_quotas_dialog;
var $update_pw_dialog;
var $change_auth_dialog;

var user_acct_graphs = [
    { title : tr("CPU"),
      monitor_resources : "CPU",
      humanize_figures : false
    },
    { title : tr("Memory"),
      monitor_resources : "MEMORY",
      humanize_figures : true
    },
    { title : tr("Net TX"),
      monitor_resources : "NETTX",
      humanize_figures : true
    },
    { title : tr("Net RX"),
      monitor_resources : "NETRX",
      humanize_figures : true
    }
];


var users_tab_content = '\
<form class="custom" id="user_form" action="">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
        <i class="icon-user"></i> '+tr("Users")+'\
      </span>\
      <span class="header-info">\
        <span id="total_users"/> <small>'+tr("TOTAL")+'</small>\
      </span>\
      <span class="user-login">\
      </span>\
    </h4>\
  </div>\
</div>\
<div class="row">\
  <div class="ten columns">\
    <div class="action_blocks">\
    </div>\
  </div>\
  <div class="two columns">\
    <input id="user_search" type="text" placeholder="'+tr("Search")+'" />\
  </div>\
  <br>\
  <br>\
</div>\
</div>\
  <div class="row">\
    <div class="twelve columns">\
<table id="datatable_users" class="datatable twelve">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Name")+'</th>\
      <th>'+tr("Group")+'</th>\
      <th>'+tr("Auth driver")+'</th>\
      <th>'+tr("VMs")+'</th>\
      <th>'+tr("Memory")+'</th>\
      <th>'+tr("CPU")+'</th>\
      <th>'+tr("Group ID")+'</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyusers">\
  </tbody>\
</table>\
  </div>\
  </div>\
</form>';

// authn = "ssh,x509,ldap,server_cipher,server_x509"

var auth_drivers_div =
'<select name="driver" id="driver">\
     <option value="core" selected="selected">'+tr("Core")+'</option>\
     <option value="ssh">'+tr("SSH")+'</option>\
     <option value="x509">'+tr("x509")+'</option>\
     <option value="ldap">'+tr("LDAP")+'</option>\
     <option value="public">'+tr("Public")+'</option>\
     <option value="custom">'+tr("Custom")+'</option>\
</select>\
<div>\
  <input type="text" name="custom_auth" />\
</div>';

var create_user_tmpl =
'<div class="panel">\
  <h3>\
    <small id="create_vnet_header">'+tr("Create User")+'</small>\
  </h3>\
</div>\
<form id="create_user_form" action="">\
      <div class="row centered">\
          <div class="four columns">\
              <label class="inline right" for="username">'+tr("Username")+':</label>\
          </div>\
          <div class="seven columns">\
              <input type="text" name="username" id="username" />\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
      </div>\
      <div class="row centered">\
          <div class="four columns">\
              <label class="inline right" for="pass">'+tr("Password")+':</label>\
          </div>\
          <div class="seven columns">\
              <input type="password" name="pass" id="pass" />\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
      </div>\
      <div class="row centered">\
          <div class="four columns">\
              <label class="inline right" for="driver">'+tr("Authentication")+':</label>\
          </div>\
          <div class="seven columns">'+auth_drivers_div+'</div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
      </div>\
      <hr>\
      <div class="form_buttons">\
          <button class="button radius right success" id="create_user_submit" value="user/create">'+tr("Create")+'</button>\
          <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
      </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>';

var update_pw_tmpl = '<div class="panel">\
  <h3>\
    <small id="create_vnet_header">'+tr("Update Password")+'</small>\
  </h3>\
</div>\
<form id="update_user_pw_form" action="">\
      <div class="row centered">\
          <div class="four columns">\
              <label class="inline right" for="new_password">'+tr("New password")+':</label>\
          </div>\
          <div class="seven columns">\
              <input type="password" name="new_password" id="new_password" />\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
      </div>\
      <hr>\
      <div class="form_buttons">\
          <button class="button radius right success" id="update_pw_submit" type="submit" value="User.update">'+tr("Change")+'</button>\
          <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
      </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>';

var change_password_tmpl = '<div class="panel">\
  <h3>\
    <small id="change_password_header">'+tr("Change authentication")+'</small>\
  </h3>\
</div>\
<form id="change_password_form" action="">\
  <div class="row">\
    <div id="confirm_with_select_tip">'+tr("Please choose the new type of authentication for the selected users")+':\
    </div>\
  </div>\
  <div class="row">'+auth_drivers_div+'\
  </div>\
  <hr>\
  <div class="form_buttons">\
    <button class="button radius right success" id="change_password_submit" type="submit" value="User.change_authentication">'+tr("Change")+'</button>\
    <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>';

var user_quotas_tmpl = '<div class="panel">\
  <h3>\
    <small id="create_vnet_header">'+tr("Update Quota")+'</small>\
  </h3>\
</div>\
        <div class="reveal-body">\
<form id="user_quotas_form" action="">\
  <div class="row">\
    <div class="six columns">\
     <div id="quota_types">\
           <label>'+tr("Quota type")+':</label>\
           <input type="radio" name="quota_type" value="vm">'+tr("Virtual Machine")+'</input>\
           <input type="radio" name="quota_type" value="datastore">'+tr("Datastore")+'</input>\
           <input type="radio" name="quota_type" value="image">'+tr("Image")+'</input>\
           <input type="radio" name="quota_type" value="network">'+tr("Network")+'</input>\
      </div>\
      <hr>\
      <div id="vm_quota">\
        <div class="row">\
          <div class="four columns">\
              <label class="inline right" >'+tr("Max VMs")+':</label>\
          </div>\
          <div class="seven columns">\
            <input type="text" name="VMS"></input>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
        </div>\
        <div class="row">\
          <div class="four columns">\
              <label class="inline right" >'+tr("Max Memory (MB)")+':</label>\
          </div>\
          <div class="seven columns">\
            <input type="text" name="MEMORY"></input>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
        </div>\
        <div class="row">\
          <div class="four columns">\
              <label class="inline right" >'+tr("Max CPU")+':</label>\
          </div>\
          <div class="seven columns">\
            <input type="text" name="CPU"></input>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
        </div>\
      </div>\
      <div id="datastore_quota">\
        <div class="row">\
          <div class="four columns">\
              <label class="inline right" >'+tr("Datastore")+'</label>\
          </div>\
          <div class="seven columns">\
            <select name="ID"></select>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
        </div>\
        <div class="row">\
          <div class="four columns">\
              <label class="inline right" >'+tr("Max size (MB)")+':</label>\
          </div>\
          <div class="seven columns">\
            <input type="text" name="SIZE"></input>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
        </div>\
        <div class="row">\
          <div class="four columns">\
              <label class="inline right" >'+tr("Max images")+':</label>\
          </div>\
          <div class="seven columns">\
            <input type="text" name="IMAGES"></input>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
        </div>\
      </div>\
      <div id="image_quota">\
        <div class="row">\
          <div class="four columns">\
              <label class="inline right" >'+tr("Image")+'</label>\
          </div>\
          <div class="seven columns">\
            <select name="ID"></select>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
        </div>\
        <div class="row">\
          <div class="four columns">\
              <label class="inline right" >'+tr("Max RVMs")+'</label>\
          </div>\
          <div class="seven columns">\
            <input type="text" name="RVMS"></input>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
        </div>\
      </div>\
      <div id="network_quota">\
        <div class="row">\
          <div class="four columns">\
              <label class="inline right" >'+tr("Network")+'</label>\
          </div>\
          <div class="seven columns">\
            <select name="ID"></select>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
        </div>\
        <div class="row">\
          <div class="four columns">\
              <label class="inline right" >'+tr("Max leases")+'</label>\
          </div>\
          <div class="seven columns">\
            <input type="text" name="LEASES"></input>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
        </div>\
      </div>\
      <br>\
      <button class="button right small radius" id="add_quota_button" value="add_quota">'+tr("Add/edit quota")+'</button>\
    </div>\
    <div class="six columns">\
      <div class="current_quotas">\
         <table class="datatable twelve extended_table">\
            <thead><tr>\
                 <th>'+tr("Type")+'</th>\
                 <th>'+tr("Quota")+'</th>\
                 <th>'+tr("Edit")+'</th></tr></thead>\
            <tbody>\
            </tbody>\
         </table>\
      </div>\
    </div>\
  </div>\
  <div class="reveal-footer">\
      <hr>\
      <div class="form_buttons">\
          <button class="button radius right success" id="create_user_submit" type="submit" value="User.set_quota">'+tr("Apply changes")+'</button>\
          <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
      </div>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>\
  </div>';


var user_actions = {
    "User.create" : {
        type: "create",
        call: OpenNebula.User.create,
        callback: addUserElement,
        error: onError,
        notify: true
    },

    "User.create_dialog" : {
        type: "custom",
        call: popUpCreateUserDialog
    },

    "User.list" : {
        type: "list",
        call: OpenNebula.User.list,
        callback: updateUsersView,
        error: onError
    },

    "User.refresh" : {
        type: "custom",
        call: function () {
            waitingNodes(dataTable_users);
            Sunstone.runAction("User.list");
        }
    },

    "User.autorefresh" : {
        type: "custom",
        call: function(){
            OpenNebula.User.list({
                timeout: true,
                success: updateUsersView,
                error: onError
            });
        }
    },

    "User.update_password" : {
        type: "custom",
        call: popUpUpdatePasswordDialog
    },

    "User.passwd" : {
        type: "multiple",
        call: OpenNebula.User.passwd,
        callback: function(req,res){
            notifyMessage(tr("Change password successful"));
        },
        elements: userElements,
        error: onError
    },
    "User.chgrp" : {
        type: "multiple",
        call: OpenNebula.User.chgrp,
        callback : function(req){
            Sunstone.runAction("User.show",req.request.data[0][0]);
        },
        elements : userElements,
        error: onError,
        notify: true
    },

    "User.change_authentication" : {
        type: "custom",
        call: popUpChangeAuthenticationDialog
    },
    "User.chauth" : {
        type: "multiple",
        call: OpenNebula.User.chauth,
        callback : function(req){
            Sunstone.runAction("User.show",req.request.data[0][0]);
        },
        elements: userElements,
        error: onError,
        notify: true
    },
    "User.show" : {
        type: "single",
        call: OpenNebula.User.show,
        callback: updateUserElement,
        error: onError
    },

    "User.showinfo" : {
        type: "single",
        call: OpenNebula.User.show,
        callback: updateUserInfo,
        error: onError
    },

    "User.delete" : {
        type: "multiple",
        call: OpenNebula.User.del,
        callback: deleteUserElement,
        elements: userElements,
        error: onError,
        notify: true
    },

    "User.update_template" : {
        type: "single",
        call: OpenNebula.User.update,
        callback: function(request) {
            notifyMessage(tr("Template updated correctly"));
            Sunstone.runAction('User.showinfo',request.request.data[0]);
        },
        error: onError
    },

    "User.fetch_quotas" : {
        type: "single",
        call: OpenNebula.User.show,
        callback: function (request,response) {
            // when we receive quotas we parse them and create an
            // quota objects with html code (<li>) that can be inserted
            // in the dialog
            var parsed = parseQuotas(response.USER,quotaListItem);
            $('.current_quotas table tbody',$user_quotas_dialog).append(parsed.VM);
            $('.current_quotas table tbody',$user_quotas_dialog).append(parsed.DATASTORE);
            $('.current_quotas table tbody',$user_quotas_dialog).append(parsed.IMAGE);
            $('.current_quotas table tbody',$user_quotas_dialog).append(parsed.NETWORK);
        },
        error: onError
    },

    "User.quotas_dialog" : {
        type: "custom",
        call: popUpUserQuotasDialog
    },

    "User.set_quota" : {
        type: "multiple",
        call: OpenNebula.User.set_quota,
        elements: userElements,
        callback: function(request) {
            notifyMessage(tr("Quotas updated correctly"));
            Sunstone.runAction('User.showinfo',request.request.data[0]);
        },
        error: onError
    },

    "User.accounting" : {
        type: "monitor",
        call: OpenNebula.User.accounting,
        callback: function(req,response) {
            var info = req.request.data[0].monitor;
            plot_graph(response,'#user_acct_tab','user_acct_', info);
        },
        error: onError
    },

    "User.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#users_tab div.legend_div').slideToggle();
        }
    }
}

var user_buttons = {
    "User.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
    "User.create_dialog" : {
        type: "create_dialog",
        layout: "create",
        condition: mustBeAdmin
    },
    "User.update_password" : {
        type : "action",
        layout: "more_select",
        text : tr("Change password")
    },
    "User.change_authentication" : {
        type : "action",
        layout: "more_select",
        text : tr("Change authentication")
    },
    "User.quotas_dialog" : {
        type : "action",
        layout: "more_select",
        text : tr("Update quotas"),
        condition: mustBeAdmin
    },
    "User.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        layout: "user_select",
        select: groups_sel,
        tip: tr("This will change the main group of the selected users. Select the new group")+":",
        condition: mustBeAdmin
    },
    "User.delete" : {
        type: "confirm",
        text: tr("Delete"),
        layout: "del",
        condition: mustBeAdmin
    },
};

var user_info_panel = {
    "user_info_tab" : {
        title: tr("Information"),
        content:""
    },
    "user_quotas_tab" : {
        title: tr("Quotas"),
        content:""
    },
    //"user_acct_tab" : {
    //    title: tr("Historical usages"),
    //    content: ""
    //}
};

var users_tab = {
    title: tr("Users"),
    content: users_tab_content,
    buttons: user_buttons,
    tabClass: 'subTab',
    parentTab: 'system-tab',
    condition: mustBeAdmin
};

var users_tab_non_admin = {
    title: tr("User info"),
    content: users_tab_content,
    buttons: user_buttons,
    tabClass: 'subTab',
    parentTab: 'dashboard-tab',
    condition: mustNotBeAdmin
}

Sunstone.addActions(user_actions);
Sunstone.addMainTab('users-tab',users_tab);
Sunstone.addMainTab('users_tab_non_admin',users_tab_non_admin);
Sunstone.addInfoPanel("user_info_panel",user_info_panel);

function userElements(){
    return getSelectedNodes(dataTable_users);
}

// Returns an array with the values from the user_json ready to be
// added to the dataTable
function userElementArray(user_json){
    var user = user_json.USER;

    var vms = "-";
    var memory = "-";
    var cpu = "-";

    if (!$.isEmptyObject(user.VM_QUOTA)){

        var vms = quotaBar(
            user.VM_QUOTA.VM.VMS_USED,
            user.VM_QUOTA.VM.VMS,
            default_user_quotas.VM_QUOTA.VM.VMS);

        var memory = quotaBarMB(
            user.VM_QUOTA.VM.MEMORY_USED,
            user.VM_QUOTA.VM.MEMORY,
            default_user_quotas.VM_QUOTA.VM.MEMORY);

        var cpu = quotaBarFloat(
            user.VM_QUOTA.VM.CPU_USED,
            user.VM_QUOTA.VM.CPU,
            default_user_quotas.VM_QUOTA.VM.CPU);
    }


    return [
        '<input class="check_item" type="checkbox" id="user_'+user.ID+'" name="selected_items" value="'+user.ID+'"/>',
        user.ID,
        user.NAME,
        user.GNAME,
        user.AUTH_DRIVER,
        vms,
        memory,
        cpu,
        user.GID
    ]
};

function updateUserSelect(){
    users_select = makeSelectOptions(dataTable_users,
                                     1,//id_col
                                     2,//name_col
                                     [],//status_cols
                                     []//bad status values
                                     );
}

// Callback to refresh a single element from the dataTable
function updateUserElement(request, user_json){
    var id = user_json.USER.ID;
    var element = userElementArray(user_json);
    updateSingleElement(element,dataTable_users,'#user_'+id);
}

// Callback to delete a single element from the dataTable
function deleteUserElement(req){
    deleteElement(dataTable_users,'#user_'+req.request.data);
    updateUserSelect();
}

// Callback to add a single user element
function addUserElement(request,user_json){
    var element = userElementArray(user_json);
    addElement(element,dataTable_users);
    updateUserSelect();
}

// Callback to update the list of users
function updateUsersView(request,users_list){
    var user_list_array = [];

    $.each(users_list,function(){
        //if (this.USER.ID == uid)
        //    dashboardQuotasHTML(this.USER);
        user_list_array.push(userElementArray(this));
    });
    updateView(user_list_array,dataTable_users);

    updateUserSelect();

    $("#total_users", $dashboard).text(users_list.length);

    var form = $("#user_form");

    $("#total_users", form).text(users_list.length);
};

function updateUserInfo(request,user){
    var info = user.USER;

    var info_tab = {
        title : tr("User information"),
        content :
        '<div class="">\
          <div class="six columns">\
          <table id="info_user_table" class="twelve datatable extended_table">\
            <thead>\
               <tr><th colspan="2">' + tr("User") + ' - '+info.NAME+'</th><th></th></tr>\
            </thead>\
            <tbody>\
            <tr>\
                <td class="key_td">' + tr("ID") + '</td>\
                <td class="value_td">'+info.ID+'</td>\
                <td></td>\
            </tr>\
            <tr>' +
                insert_group_dropdown("User",info.ID,info.GNAME,info.GID) +
            '</tr>\
            <tr>\
                <td class="key_td">' + tr("Authentication driver") + '</td>\
                <td class="value_td">'+info.AUTH_DRIVER+'</td>\
                <td></td>\
            </tr>\
            </tbody>\
         </table>\
       </div>\
       <div class="six columns">' +
               insert_extended_template_table(info.TEMPLATE,
                                              "User",
                                              info.ID,
                                              tr("Configuration Attributes")) +
       '</div>\
     </div>'
    };

    var default_user_quotas = Quotas.default_quotas(info.DEFAULT_USER_QUOTAS)
    var quotas_tab_html = '<div class="four columns">' + Quotas.vms(info, default_user_quotas) + '</div>';
    quotas_tab_html += '<div class="four columns">' + Quotas.cpu(info, default_user_quotas) + '</div>';
    quotas_tab_html += '<div class="four columns">' + Quotas.memory(info, default_user_quotas) + '</div>';
    quotas_tab_html += '<br><br>';
    quotas_tab_html += '<div class="six columns">' + Quotas.image(info, default_user_quotas) + '</div>';
    quotas_tab_html += '<div class="six columns">' + Quotas.network(info, default_user_quotas) + '</div>';
    quotas_tab_html += '<br><br>';
    quotas_tab_html += '<div class="twelve columns">' + Quotas.datastore(info, default_user_quotas) + '</div>';
    var quotas_tab = {
        title : tr("Quotas"),
        content : quotas_tab_html
    };

    Sunstone.updateInfoPanelTab("user_info_panel","user_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("user_info_panel","user_quotas_tab",quotas_tab);
    //Sunstone.updateInfoPanelTab("user_info_panel","user_acct_tab",acct_tab);
    Sunstone.popUpInfoPanel("user_info_panel", 'users-tab');

    $("#user_info_panel_refresh", $("#user_info_panel")).click(function(){
      $(this).html(spinner);
      Sunstone.runAction('User.showinfo', info.ID);
    })
};

// Prepare the user creation dialog
function setupCreateUserDialog(){
    dialogs_context.append('<div title=\"'+tr("Create user")+'\" id="create_user_dialog"></div>');
    $create_user_dialog = $('#create_user_dialog',dialogs_context);
    var dialog = $create_user_dialog;
    dialog.html(create_user_tmpl);

    //Prepare jquery dialog
    //dialog.dialog({
    //    autoOpen: false,
    //    modal:true,
    //    width: 400
    //});

    dialog.addClass("reveal-modal");

    //$('button',dialog).button();

    $('input[name="custom_auth"]',dialog).parent().hide();
    $('select#driver').change(function(){
        if ($(this).val() == "custom")
            $('input[name="custom_auth"]',dialog).parent().show();
        else
            $('input[name="custom_auth"]',dialog).parent().hide();
    });


    $('#create_user_form',dialog).submit(function(){
        var user_name=$('#username',this).val();
        var user_password=$('#pass',this).val();
        var driver = $('#driver', this).val();
        if (driver == 'custom')
            driver = $('input[name="custom_auth"]').val();

        if (!user_name.length || !user_password.length){
            notifyError(tr("User name and password must be filled in"));
            return false;
        };

        var user_json = { "user" :
                          { "name" : user_name,
                            "password" : user_password,
                            "auth_driver" : driver
                          }
                        };
        Sunstone.runAction("User.create",user_json);
        $create_user_dialog.trigger("reveal:close")
        return false;
    });
}

function setupUpdatePasswordDialog(){
    dialogs_context.append('<div title="'+tr("Change password")+'" id="update_user_pw_dialog"></div>');
    $update_pw_dialog = $('#update_user_pw_dialog',dialogs_context);
    var dialog = $update_pw_dialog;
    dialog.html(update_pw_tmpl);

    dialog.addClass("reveal-modal");

    $('#update_user_pw_form',dialog).submit(function(){
        var pw=$('#new_password',this).val();

        if (!pw.length){
            notifyError(tr("Fill in a new password"));
            return false;
        }

        Sunstone.runAction("User.passwd",getSelectedNodes(dataTable_users),pw);
        $update_pw_dialog.trigger("reveal:close")
        return false;
    });
};

function setupChangeAuthenticationDialog(){
    dialogs_context.append('<div title="'+tr("Change authentication")+'" id="change_user_auth_dialog"></div>');
    $change_auth_dialog = $('#change_user_auth_dialog',dialogs_context);
    var dialog = $change_auth_dialog;
    dialog.html(change_password_tmpl);

    dialog.addClass("reveal-modal");

    $('input[name="custom_auth"]',dialog).parent().hide();
    $('select#driver').change(function(){
        if ($(this).val() == "custom")
            $('input[name="custom_auth"]',dialog).parent().show();
        else
            $('input[name="custom_auth"]',dialog).parent().hide();
    });

    $('#change_password_form',dialog).submit(function(){
        var driver = $('#driver', this).val();
        if (driver == 'custom')
            driver = $('input[name="custom_auth"]', this).val();

        if (!driver.length){
            notifyError(tr("Fill in a new auth driver"));
            return false;
        }

        Sunstone.runAction("User.chauth",getSelectedNodes(dataTable_users), driver);
        $change_auth_dialog.trigger("reveal:close")
        return false;
    });
};

//add a setup quota dialog and call the sunstone-util.js initialization
function setupUserQuotasDialog(){
    dialogs_context.append('<div title="'+tr("User quotas")+'" id="user_quotas_dialog"></div>');
    $user_quotas_dialog = $('#user_quotas_dialog',dialogs_context);
    var dialog = $user_quotas_dialog;
    dialog.html(user_quotas_tmpl);

    setupQuotasDialog(dialog);
}

function popUpUserQuotasDialog(){
    popUpQuotasDialog($user_quotas_dialog, 'User', userElements())
}

function popUpCreateUserDialog(){
    $create_user_dialog.reveal();

}


function popUpUpdatePasswordDialog(){
    $('#new_password',$update_pw_dialog).val("");
    $update_pw_dialog.reveal();
}

function popUpChangeAuthenticationDialog(){
    $('#driver',$change_auth_dialog).val("");
    $change_auth_dialog.reveal();
}

// Prepare the autorefresh of the list
function setUserAutorefresh(){
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_users);
        var filter = $("#user_search").attr('value');
        if ((checked.length==0) && !filter){
            Sunstone.runAction("User.autorefresh");
        }
    },INTERVAL+someTime());
}

$(document).ready(function(){
    var tab_name = 'users-tab';

    if (Config.isTabEnabled(tab_name)) {
      //if we are not oneadmin, our tab will not even be in the DOM.
      dataTable_users = $("#datatable_users",main_tabs_context).dataTable({
          "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check",5,6,7] },
              { "sWidth": "35px", "aTargets": [0] },
              { "sWidth": "150px", "aTargets": [5,6,7] },
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ]
      });

      $('#user_search').keyup(function(){
        dataTable_users.fnFilter( $(this).val() );
      })

      dataTable_users.on('draw', function(){
        recountCheckboxes(dataTable_users);
      })

      Sunstone.runAction("User.list");

      setupCreateUserDialog();
      setupUpdatePasswordDialog();
      setupChangeAuthenticationDialog();
      setupUserQuotasDialog();
      setUserAutorefresh();
      //Setup quota icons
      //Also for group tab
      setupQuotaIcons();

      initCheckAllBoxes(dataTable_users);
      tableCheckboxesListener(dataTable_users);
      infoListener(dataTable_users,'User.showinfo');

      $('div#users_tab div.legend_div').hide();
      $('div#users_tab_non_admin div.legend_div').hide();
    }
});
