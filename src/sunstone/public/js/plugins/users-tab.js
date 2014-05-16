/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
  <input type="text" id="custom_auth" name="custom_auth" />\
</div>';

// Used also from groups-tabs.js
var user_creation_div =
'<div class="row">\
  <div class="large-12 columns">\
    <label for="username">'+tr("Username")+'</label>\
    <input type="text" name="username" id="username" />\
  </div>\
</div>\
<div class="row">\
  <div class="large-12 columns">\
    <label for="pass">'+tr("Password")+'</label>\
    <input type="password" name="pass" id="pass" />\
  </div>\
</div>\
<div class="row">\
  <div class="large-12 columns">\
    <label for="driver">'+tr("Authentication")+'</label>\
    '+auth_drivers_div+'\
  </div>\
</div>';

var create_user_tmpl =
'<div class="row">\
  <div class="large-12 columns">\
    <h3 class="subheader" id="create_user_header">'+tr("Create User")+'</h3>\
  </div>\
</div>\
<form id="create_user_form" action="">'+
  user_creation_div +
  '<div class="form_buttons row">\
      <button class="button radius right success" id="create_user_submit" value="user/create">'+tr("Create")+'</button>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>';

var update_pw_tmpl = '<div class="row">\
  <div class="large-12 columns">\
    <h3 id="create_vnet_header" class="subheader">'+tr("Update Password")+'</h3>\
  </div>\
</div>\
<form id="update_user_pw_form" action="">\
      <div class="row">\
        <div class="large-12 columns">\
          <label for="new_password">'+tr("New password")+':\
            <input type="password" name="new_password" id="new_password" />\
          </label>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-12 columns">\
          <label for="confirm_password">'+tr("Confirm Password")+':\
            <input type="password" name="confirm_password" id="confirm_password" />\
          </label>\
        </div>\
      </div>\
      <div class="form_buttons">\
          <button class="button radius right success" id="update_pw_submit" type="submit" value="User.update">'+tr("Change")+'</button>\
      </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>';

var change_password_tmpl = '<div class="row">\
  <div class="large-12 columns">\
    <h3 id="change_password_header" class="subheader">'+tr("Change authentication")+'</h3>\
  </div>\
</div>\
<form id="change_password_form" action="">\
  <div class="row">\
    <div class="large-12 columns">\
      <label for="driver">'+tr("Authentication")+':\
        '+auth_drivers_div+'\
      </label>\
    </div>\
  </div>\
  <div class="form_buttons">\
    <button class="button radius right success" id="change_password_submit" type="submit" value="User.change_authentication">'+tr("Change")+'</button>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>';

var quotas_tmpl = '<div class="row">\
    <div class="large-12 columns">\
      <dl class="tabs right-info-tabs text-center" data-tab>\
           <dd class="active"><a href="#vm_quota"><i class="fa fa-cloud"></i><br>'+tr("VM")+'</a></dd>\
           <dd><a href="#datastore_quota"><i class="fa fa-folder-open"></i><br>'+tr("Datastore")+'</a></dd>\
           <dd><a href="#image_quota"><i class="fa fa-upload"></i><br>'+tr("Image")+'</a></dd>\
           <dd><a href="#network_quota"><i class="fa fa-globe"></i><br>'+tr("VNet")+'</a></dd>\
      </dl>\
    </div>\
  </div>\
  <div class="row">\
    <div class="large-4 columns">\
      <div class="tabs-content">\
      <div id="vm_quota" class="content active">\
        <div class="row">\
          <div class="large-12 columns">\
              <label>'+tr("Max VMs")+'\
                <input type="text" name="VMS"></input>\
              </label>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
              <label>'+tr("Max Memory (MB)")+'\
                <input type="text" name="MEMORY"></input>\
              </label>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
              <label>'+tr("Max CPU")+'\
                <input type="text" name="CPU"></input>\
              </label>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
              <label>'+tr("Max Volatile Storage (MB)")+'\
                <input type="text" name="VOLATILE_SIZE"></input>\
              </label>\
          </div>\
        </div>\
      </div>\
      <div id="datastore_quota" class="content">\
        <div class="row">\
          <div class="large-12 columns">\
              <label>'+tr("Datastore")+'\
                <select name="ID"></select>\
              </label>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
              <label>'+tr("Max size (MB)")+'\
                <input type="text" name="SIZE"></input>\
              </label>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
              <label>'+tr("Max images")+'\
                <input type="text" name="IMAGES"></input>\
              </label>\
          </div>\
        </div>\
      </div>\
      <div id="image_quota" class="content">\
        <div class="row">\
          <div class="large-12 columns">\
              <label>'+tr("Image")+'\
                <select name="ID"></select>\
              </label>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
              <label>'+tr("Max RVMs")+'\
                <input type="text" name="RVMS"></input>\
              </label>\
          </div>\
        </div>\
      </div>\
      <div id="network_quota" class="content">\
        <div class="row">\
          <div class="large-12 columns">\
              <label>'+tr("Network")+'\
                <select name="ID"></select>\
              </label>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
              <label>'+tr("Max leases")+'\
                <input type="text" name="LEASES"></input>\
              </label>\
          </div>\
        </div>\
      </div>\
      </div>\
      <button class="button right small radius" id="add_quota_button" value="add_quota">'+tr("Add/edit quota")+'</button>\
    </div>\
    <div class="large-8 columns">\
      <div class="current_quotas">\
         <table class="dataTable extended_table" cellpadding="0" cellspacing="0" border="0">\
            <thead><tr>\
                 <th>'+tr("Type")+'</th>\
                 <th>'+tr("Quota")+'</th>\
                 <th>'+tr("Edit")+'</th></tr></thead>\
            <tbody>\
            </tbody>\
         </table>\
      </div>\
    </div>\
  </div>'
var user_quotas_tmpl = '<div class="row">\
  <div class="large-12 columns">\
    <h3 id="create_vnet_header" class="subheader">'+tr("Update Quota")+'</h3>\
  </div>\
</div>\
<div class="reveal-body">\
<form id="user_quotas_form" action="">'+
  quotas_tmpl +
  '<div class="reveal-footer">\
      <div class="form_buttons">\
          <button class="button radius right success" id="create_user_submit" type="submit" value="User.set_quota">'+tr("Apply changes")+'</button>\
      </div>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>\
  </div>';


var user_actions = {
    "User.create" : {
        type: "create",
        call: OpenNebula.User.create,
        callback: function(request, response) {
            $create_user_dialog.foundation('reveal', 'close');
            $create_user_dialog.empty();
            setupCreateUserDialog();

            addUserElement(request, response);
            notifyCustom(tr("User created"), " ID: " + response.USER.ID, false);
        },
        error: onError
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
          var tab = dataTable_users.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("User.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_users);
            Sunstone.runAction("User.list", {force: true});
          }
        }
    },

    "User.update_password" : {
        type: "custom",
        call: popUpUpdatePasswordDialog
    },

    "User.passwd" : {
        type: "multiple",
        call: OpenNebula.User.passwd,
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
        error: onError
    },
    "User.addgroup" : {
        type: "multiple",
        call: OpenNebula.User.addgroup,
        callback : function(req){
            Sunstone.runAction("User.show",req.request.data[0][0]);
        },
        elements : userElements,
        error: onError
    },
    "User.delgroup" : {
        type: "multiple",
        call: OpenNebula.User.delgroup,
        callback : function(req){
            Sunstone.runAction("User.show",req.request.data[0][0]);
        },
        elements : userElements,
        error: onError
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
        error: onError
    },
    "User.show" : {
        type: "single",
        call: OpenNebula.User.show,
        callback:   function(request, response) {
            updateUserElement(request, response);
            if (Sunstone.rightInfoVisible($("#users-tab"))) {
                updateUserInfo(request, response);
            }
        },
        error: onError
    },

    "User.delete" : {
        type: "multiple",
        call: OpenNebula.User.del,
        callback: deleteUserElement,
        elements: userElements,
        error: onError
    },

    "User.update_template" : {
        type: "single",
        call: OpenNebula.User.update,
        callback: function(request) {
            Sunstone.runAction('User.show',request.request.data[0][0]);
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
            Sunstone.runAction('User.show',request.request.data[0]);
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
    }
}

var user_buttons = {
    "User.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },
    "User.create_dialog" : {
        type: "create_dialog",
        layout: "create",
        condition: mustBeAdmin
    },
    "User.update_password" : {
        type : "action",
        layout: "main_buttons",
        text : tr("Password")
    },
    "User.change_authentication" : {
        type : "action",
        layout: "main_buttons",
        text : tr("Auth")
    },
    "User.quotas_dialog" : {
        type : "action",
        layout: "main_buttons",
        text : tr("Quotas"),
        condition: mustBeAdmin
    },
    "User.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        layout: "user_select",
        select: "Group",
        tip: tr("This will change the main group of the selected users. Select the new group")+":",
        condition: mustBeAdmin
    },
    "User.addgroup" : {
        type: "confirm_with_select",
        text: tr("Add to group"),
        layout: "user_select",
        select: "Group",
        tip: tr("This will add the user to a secondary group. Select the new group")+":",
        condition: mustBeAdmin
    },
    "User.delgroup" : {
        type: "confirm_with_select",
        text: tr("Remove from group"),
        layout: "user_select",
        select: "Group",
        tip: tr("This will remove the user from a secondary group. Select the group")+":",
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
    resource: 'User',
    buttons: user_buttons,
    tabClass: 'subTab',
    parentTab: 'system-tab',
    search_input: ' <input id="user_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-user"></i>&emsp;'+tr("Users"),
    info_header: '<i class="fa fa-fw fa-user"></i>&emsp;'+tr("User"),
    subheader: '<span>\
        <span class="total_users"/> <small>'+tr("TOTAL")+'</small>\
      </span>',
    table: '<table id="datatable_users" cellpadding="0" cellspacing="0" border="0" class="tdisplay">\
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
    </table>'
};


Sunstone.addActions(user_actions);
Sunstone.addMainTab('users-tab',users_tab);
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

// Callback to refresh a single element from the dataTable
function updateUserElement(request, user_json){
    var id = user_json.USER.ID;
    var element = userElementArray(user_json);
    updateSingleElement(element,dataTable_users,'#user_'+id);
}

// Callback to delete a single element from the dataTable
function deleteUserElement(req){
    deleteElement(dataTable_users,'#user_'+req.request.data);
}

// Callback to add a single user element
function addUserElement(request,user_json){
    var element = userElementArray(user_json);
    addElement(element,dataTable_users);
}

// Callback to update the list of users
function updateUsersView(request,users_list,quotas_list){
    var user_list_array = [];

    $.each(users_list,function(){
        // Inject the VM user quota. This info is returned separately in the
        // pool info call, but the userElementArray expects it inside the USER,
        // as it is returned by the individual info call
        var q = quotas_list[this.USER.ID];

        if (q != undefined) {
            this.USER.VM_QUOTA = q.QUOTAS.VM_QUOTA;
        }

        user_list_array.push(userElementArray(this));
    });
    updateView(user_list_array,dataTable_users);


    $(".total_users").text(users_list.length);
};

function updateUserInfo(request,user){
    var info = user.USER;

    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content :
        '<div class="row">\
          <div class="large-6 columns">\
          <table id="info_user_table" class="dataTable extended_table" cellpadding="0" cellspacing="0" border="0">\
            <thead>\
               <tr><th colspan="2">' + tr("Information") + '</th><th></th></tr>\
            </thead>\
            <tbody>\
            <tr>\
                <td class="key_td">' + tr("ID") + '</td>\
                <td class="value_td">'+info.ID+'</td>\
                <td></td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("Name") + '</td>\
                <td class="value_td">'+info.NAME+'</td>\
                <td></td>\
            </tr>\
            <tr>' +
                insert_group_dropdown("User",info.ID,info.GNAME,info.GID,"#info_user_table") +
            '</tr>\
            <tr>\
                <td class="key_td">' + tr("Secondary groups") + '</td>\
                <td class="value_td">'+(typeof info.GROUPS.ID == "object" ? info.GROUPS.ID.join(",") : "-")+'</td>\
                <td></td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("Authentication driver") + '</td>\
                <td class="value_td">'+info.AUTH_DRIVER+'</td>\
                <td></td>\
            </tr>\
            </tbody>\
         </table>\
       </div>\
       <div class="large-6 columns">' +
       '</div>\
     </div>\
     <div class="row">\
          <div class="large-9 columns">'+
               insert_extended_template_table(info.TEMPLATE,
                                              "User",
                                              info.ID,
                                              tr("Attributes")) +
       '</div>\
     </div>'
    };

    var default_user_quotas = Quotas.default_quotas(info.DEFAULT_USER_QUOTAS);
    var vms_quota = Quotas.vms(info, default_user_quotas);
    var cpu_quota = Quotas.cpu(info, default_user_quotas);
    var memory_quota = Quotas.memory(info, default_user_quotas);
    var volatile_size_quota = Quotas.volatile_size(info, default_user_quotas);
    var image_quota = Quotas.image(info, default_user_quotas);
    var network_quota = Quotas.network(info, default_user_quotas);
    var datastore_quota = Quotas.datastore(info, default_user_quotas);

    var quotas_html;
    if (vms_quota || cpu_quota || memory_quota || volatile_size_quota || image_quota || network_quota || datastore_quota) {
      quotas_html = '<div class="large-6 columns">' + vms_quota + '</div>';
      quotas_html += '<div class="large-6 columns">' + cpu_quota + '</div>';
      quotas_html += '<div class="large-6 columns">' + memory_quota + '</div>';
      quotas_html += '<div class="large-6 columns">' + volatile_size_quota+ '</div>';
      quotas_html += '<br><br>';
      quotas_html += '<div class="large-6 columns">' + image_quota + '</div>';
      quotas_html += '<div class="large-6 columns">' + network_quota + '</div>';
      quotas_html += '<br><br>';
      quotas_html += '<div class="large-12 columns">' + datastore_quota + '</div>';
    } else {
      quotas_html = '<div class="row">\
              <div class="large-12 columns">\
                <p class="subheader">'+tr("No quotas defined")+'</p>\
              </div>\
            </div>'
    }

    var quotas_tab = {
        title : tr("Quotas"),
        icon: "fa-align-left",
        content : quotas_html
    };

    var accounting_tab = {
        title: tr("Accounting"),
        icon: "fa-bar-chart-o",
        content: '<div id="user_accounting"></div>'
    };

    Sunstone.updateInfoPanelTab("user_info_panel","user_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("user_info_panel","user_quotas_tab",quotas_tab);
    Sunstone.updateInfoPanelTab("user_info_panel","user_accouning_tab",accounting_tab);
    //Sunstone.updateInfoPanelTab("user_info_panel","user_acct_tab",acct_tab);
    Sunstone.popUpInfoPanel("user_info_panel", 'users-tab');

    accountingGraphs(
        $("#user_accounting","#user_info_panel"),
        {   fixed_user: info.ID,
            init_group_by: "vm" });

};

// Used also from groups-tabs.js
function setupCustomAuthDialog(dialog){
    $('input[name="custom_auth"]',dialog).parent().hide();
    $('select#driver',dialog).change(function(){
        if ($(this).val() == "custom")
            $('input[name="custom_auth"]',dialog).parent().show();
        else
            $('input[name="custom_auth"]',dialog).parent().hide();
    });
};

function buildUserJSON(dialog){
    var user_name = $('#username',dialog).val();
    var user_password = $('#pass',dialog).val();
    var driver = $('#driver', dialog).val();

    if (driver == 'custom'){
        driver = $('input[name="custom_auth"]', dialog).val();
    }

    if (!user_name.length || !user_password.length){
        return false;
    }

    var user_json = { "user" :
                      { "name" : user_name,
                        "password" : user_password,
                        "auth_driver" : driver
                      }
                    };

    return user_json;
};

// Prepare the user creation dialog
function setupCreateUserDialog(){
    dialogs_context.append('<div id="create_user_dialog"  class="reveal-modal tiny" data-reveal></div>');
    $create_user_dialog = $('#create_user_dialog',dialogs_context);
    var dialog = $create_user_dialog;
    dialog.html(create_user_tmpl);
    $(document).foundation();

    //dialog.addClass("reveal-modal").attr("data-reveal", "");

    //$('button',dialog).button();

    setupCustomAuthDialog(dialog);

    $('#create_user_form',dialog).submit(function(){
        var user_json = buildUserJSON(this);

        if (!user_json) {
            notifyError(tr("User name and password must be filled in"));
            return false;
        }

        Sunstone.runAction("User.create",user_json);
        return false;
    });
}

function setupUpdatePasswordDialog(){
    dialogs_context.append('<div title="'+tr("Change password")+'" id="update_user_pw_dialog"></div>');
    $update_pw_dialog = $('#update_user_pw_dialog',dialogs_context);
    var dialog = $update_pw_dialog;
    dialog.html(update_pw_tmpl);

    dialog.addClass("reveal-modal").attr("data-reveal", "");

    $('#update_user_pw_form',dialog).submit(function(){
        var pw=$('#new_password',this).val();
        var confirm_password=$('#confirm_password',this).val();

        if (!pw.length){
            notifyError(tr("Fill in a new password"));
            return false;
        }

        if (pw !== confirm_password){
            notifyError(tr("Passwords do not match"));
            return false;
        }

        Sunstone.runAction("User.passwd",getSelectedNodes(dataTable_users),pw);
        $update_pw_dialog.foundation('reveal', 'close');
        return false;
    });
};

function setupChangeAuthenticationDialog(){
    dialogs_context.append('<div title="'+tr("Change authentication")+'" id="change_user_auth_dialog"></div>');
    $change_auth_dialog = $('#change_user_auth_dialog',dialogs_context);
    var dialog = $change_auth_dialog;
    dialog.html(change_password_tmpl);

    dialog.addClass("reveal-modal").attr("data-reveal", "");

    $('input[name="custom_auth"]',dialog).parent().hide();
    $('select#driver', dialog).change(function(){
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
        $change_auth_dialog.foundation('reveal', 'close');
        return false;
    });
};

//add a setup quota dialog and call the sunstone-util.js initialization
function setupUserQuotasDialog(){
    dialogs_context.append('<div title="'+tr("User quotas")+'" id="user_quotas_dialog"></div>');
    $user_quotas_dialog = $('#user_quotas_dialog',dialogs_context);
    var dialog = $user_quotas_dialog;
    dialog.html(user_quotas_tmpl);

    $(document).foundation();

    setupQuotasDialog(dialog);
}

function popUpUserQuotasDialog(){
    popUpQuotasDialog($user_quotas_dialog, 'User', userElements());
}

function popUpCreateUserDialog(){
    $create_user_dialog.foundation().foundation('reveal', 'open');;
    $("input#username",$create_user_dialog).focus();
}


function popUpUpdatePasswordDialog(){
    $('#new_password',$update_pw_dialog).val("");
    $update_pw_dialog.foundation().foundation('reveal', 'open');;
    $("input#new_password",$update_pw_dialog).focus();
}

function popUpChangeAuthenticationDialog(){
    $('#driver',$change_auth_dialog).val("");
    $change_auth_dialog.foundation().foundation('reveal', 'open');;
}

$(document).ready(function(){
    var tab_name = 'users-tab';

    if (Config.isTabEnabled(tab_name)) {
      //if we are not oneadmin, our tab will not even be in the DOM.
      dataTable_users = $("#datatable_users",main_tabs_context).dataTable({
            "bSortClasses": false,
            "bAutoWidth": false,
            "bDeferRender": true,
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
      //Setup quota icons
      //Also for group tab
      setupQuotaIcons();

      initCheckAllBoxes(dataTable_users);
      tableCheckboxesListener(dataTable_users);
      infoListener(dataTable_users,'User.show');

      $('div#users_tab div.legend_div').hide();
      $('div#users_tab_non_admin div.legend_div').hide();

      dataTable_users.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});
