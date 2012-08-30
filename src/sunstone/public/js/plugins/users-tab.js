/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

var user_acct_graphs = [
    { title : tr("CPU"),
      monitor_resources : "CPU",
      humanize_figures : false
    },
    { title : tr("Memory"),
      monitor_resources : "MEMORY",
      humanize_figures : true
    }
];


var users_tab_content = '\
<h2><i class="icon-user"></i> '+tr("Users")+'</h2>\
<form id="user_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_users" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">'+tr("All")+'</input></th>\
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Name")+'</th>\
      <th>'+tr("Group")+'</th>\
      <th>'+tr("Authentication driver")+'</th>\
      <th>'+tr("VMs")+'</th>\
      <th>'+tr("Used memory")+'</th>\
      <th>'+tr("Used CPU")+'</th>\
      <th>'+tr("Group ID")+'</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyusers">\
  </tbody>\
</table>\
<div class="legend_div">\
<span>?</span>\
<p class="legend_p">\
'+
    tr("Tip: You can save any information in the user template, in the form of VAR=VAL.")+
'\
</p>\
<p class="legend_p">\
'+
    tr("Tip: SSH authentication method is not available for web UI access.")+
'\
</p>\
</div>\
</form>';

var create_user_tmpl =
'<form id="create_user_form" action="">\
  <fieldset>\
        <div>\
                <label for="username">'+tr("Username")+':</label>\
                <input type="text" name="username" id="username" /><br />\
                <label for="pass">'+tr("Password")+':</label>\
                <input type="password" name="pass" id="pass" />\
                <label for="driver">'+tr("Authentication")+':</label>\
                <select name="driver" id="driver">\
                     <option value="core" selected="selected">'+tr("Core")+'</option>\
                     <option value="ssh">'+tr("SSH")+'</option>\
                     <option value="x509">'+tr("x509")+'</option>\
                     <option value="public">'+tr("Public")+'</option>\
                     <option value="custom">'+tr("Custom")+'</option>\
                </select>\
                <div>\
                  <label>'+tr("Custom auth driver")+':</label>\
                  <input type="text" name="custom_auth" /><br />\
                </div>\
        </div>\
        </fieldset>\
        <fieldset>\
        <div class="form_buttons">\
                <button class="button" id="create_user_submit" value="user/create">'+tr("Create")+'</button>\
                <button class="button" type="reset" value="reset">'+tr("Reset")+'</button>\
        </div>\
</fieldset>\
</form>';

var update_pw_tmpl = '<form id="update_user_pw_form" action="">\
  <fieldset>\
        <div>\
                <div>'+tr("This will change the password for the selected users")+':</div>\
                <label for="new_password">'+tr("New password")+':</label>\
                <input type="password" name="new_password" id="new_password" />\
        </div>\
        </fieldset>\
        <fieldset>\
        <div class="form_buttons">\
                <button class="button" id="update_pw_submit" value="User.update">'+tr("Change")+'</button>\
                <button class="button" type="reset" value="reset">'+tr("Reset")+'</button>\
        </div>\
</fieldset>\
</form>';

var user_quotas_tmpl = '<form id="user_quotas_form" action="">\
   <fieldset>\
     <div>'+tr("Please add/edit/remove quotas and click on the apply changes button. Note that if several items are selected, changes will be applied to each of them")+'.</div>\
     <div>'+tr("Add quota")+':</div>\
     <div id="quota_types">\
           <label>'+tr("Quota type")+':</label>\
           <input type="radio" name="quota_type" value="vm">'+tr("Virtual Machine")+'</input>\
           <input type="radio" name="quota_type" value="datastore">'+tr("Datastore")+'</input>\
           <input type="radio" name="quota_type" value="image">'+tr("Image")+'</input>\
           <input type="radio" name="quota_type" value="network">'+tr("Network")+'</input>\
      </div>\
      <div id="vm_quota">\
          <label>'+tr("Max VMs")+':</label>\
          <input type="text" name="VMS"></input><br />\
          <label>'+tr("Max Memory (MB)")+':</label>\
          <input type="text" name="MEMORY"></input><br />\
          <label>'+tr("Max CPU")+':</label>\
          <input type="text" name="CPU"></input>\
      </div>\
      <div id="datastore_quota">\
          <label>'+tr("Datastore")+'</label>\
          <select name="ID"></select><br />\
          <label>'+tr("Max size (MB)")+':</label>\
          <input type="text" name="SIZE"></input><br />\
          <label>'+tr("Max images")+':</label>\
          <input type="text" name="IMAGES"></input>\
      </div>\
      <div id="image_quota">\
          <label>'+tr("Image")+'</label>\
          <select name="ID"></select><br />\
          <label>'+tr("Max RVMs")+'</label>\
          <input type="text" name="RVMS"></input>\
      </div>\
      <div id="network_quota">\
          <label>'+tr("Network")+'</label>\
          <select name="ID"></select><br />\
          <label>'+tr("Max leases")+'</label>\
          <input type="text" name="LEASES"></input>\
      </div>\
      <button style="width:100px!important;" class="add_remove_button add_button" id="add_quota_button" value="add_quota">'+tr("Add/edit quota")+'</button>\
      <div class="clear"></div>\
      <div class="clear"></div>\
      <div class="current_quotas">\
         <table class="info_table" style="width:640px;margin-top:0;">\
            <thead><tr>\
                 <th>'+tr("Type")+'</th>\
                 <th style="width:100%;">'+tr("Quota")+'</th>\
                 <th>'+tr("Edit")+'</th></tr></thead>\
            <tbody>\
            </tbody>\
         </table>\
      </div>\
      <div class="form_buttons">\
           <button class="button" type="submit" value="User.set_quota">'+tr("Apply changes")+'</button>\
      </div>\
</fieldset>\
</form>';


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

    // "User.addgroup" : {
    //     type: "multiple",
    //     call: OpenNebula.User.addgroup,
    //     callback : function(req){
    //         Sunstone.runAction("User.show",req.request.data[0]);
    //     },
    //     elements : function() {return getSelectedNodes(dataTable_users);},
    //     error: onError,
    //     notify: true
    // },

    // "User.delgroup" : {
    //     type: "multiple",
    //     call: OpenNebula.User.delgroup,
    //     callback : function(req){
    //         Sunstone.runAction("User.show",req.request.data[0]);
    //     },
    //     elements : function() {return getSelectedNodes(dataTable_users);},
    //     error: onError,
    //     notify: true
    // },

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

    "User.fetch_template" : {
        type: "single",
        call: OpenNebula.User.fetch_template,
        callback: function (request,response) {
            $('#template_update_dialog #template_update_textarea').val(response.template);
        },
        error: onError
    },

    "User.update_dialog" : {
        type: "custom",
        call: function() {
            popUpTemplateUpdateDialog("User",
                                      makeSelectOptions(dataTable_users,
                                                        1,//id_col
                                                        2,//name_col
                                                        [],
                                                        []
                                                       ),
                                      getSelectedNodes(dataTable_users));
        }
    },

    "User.update" : {
        type: "single",
        call: OpenNebula.User.update,
        callback: function() {
            notifyMessage(tr("Template updated correctly"));
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
        callback: function() {
            notifyMessage(tr("Quotas updated correctly"));
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
        text: '<i class="icon-refresh icon-large">',
        alwaysActive: true
    },
    "User.create_dialog" : {
        type: "create_dialog",
        text: tr("+ New"),
        condition: mustBeAdmin
    },
    "User.update_dialog" : {
        type: "action",
        text: tr("Update properties"),
        alwaysActive: true
    },
    "User.update_password" : {
        type : "action",
        text : tr("Change password")
    },
    "User.quotas_dialog" : {
        type : "action",
        text : tr("Update quotas"),
        condition: mustBeAdmin
    },
    "User.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        select: groups_sel,
        tip: tr("This will change the main group of the selected users. Select the new group")+":",
        condition: mustBeAdmin
    },
    "User.chauth" : {
        type: "confirm_with_select",
        text: tr("Change authentication"),
        //We insert our custom select there.
        select: function() {
            return   '<option value="core" selected="selected">'+tr("Core")+'</option>\
                     <option value="ssh">'+tr("SSH")+'</option>\
                     <option value="x509">'+tr("x509")+'</option>\
                     <option value="public">'+tr("Public")+'</option>'
        },
        tip: tr("Please choose the new type of authentication for the selected users")+":",
        condition: mustBeAdmin
    },
    // "User.addgroup" : {
    //     type: "confirm_with_select",
    //     text: "Add to group",
    //     select: function(){ return groups_select; },
    //     tip: "Select the new group to add users:",
    //     condition: True
    // },
    // "User.delgroup" : {
    //     type: "confirm_with_select",
    //     text: "Delete from group",
    //     select: function(){ return groups_select; },
    //     tip: "Select the group from which to delete users:",
    //     condition: True
    // },
    "User.delete" : {
        type: "confirm",
        text: tr("Delete"),
        condition: mustBeAdmin
    },
    "User.help" : {
        type: "action",
        text: '?',
        alwaysActive: true
    }

};

var user_info_panel = {
    "user_info_tab" : {
        title: tr("User information"),
        content:""
    },
    "user_quotas_tab" : {
        title: tr("User quotas"),
        content:""
    },
    "user_acct_tab" : {
        title: tr("Historical usages"),
        content: ""
    }
};

var users_tab = {
    title: tr("Users"),
    content: users_tab_content,
    buttons: user_buttons,
    tabClass: 'subTab',
    parentTab: 'system_tab',
    condition: mustBeAdmin
};

var users_tab_non_admin = {
    title: tr("User info"),
    content: users_tab_content,
    buttons: user_buttons,
    tabClass: 'subTab',
    parentTab: 'dashboard_tab',
    condition: mustNotBeAdmin
}


SunstoneMonitoringConfig['USER'] = {
    plot: function(monitoring){
        //plot only when i am admin
        if (!mustBeAdmin()) return;

        //plot the number of total users
        $('#totalUsers', $dashboard).text(monitoring['totalUsers'])

        //if (!$dashboard.is(':visible')) return;

        //plot users per group
        var container = $('div#usersPerGroup',$dashboard);
        SunstoneMonitoring.plot('USER',
                                'usersPerGroup',
                                container,
                                monitoring['usersPerGroup']);
    },
    monitor: {
        "usersPerGroup" : {
            //we want to monitor users divided by GNAME to paint bars.
            partitionPath: "GNAME",
            operation: SunstoneMonitoring.ops.partition,
            dataType: "bars",
            plotOptions: {
                series: { bars: {show: true, barWidth: 0.5, align: 'center' }},
                xaxis: { show: true, customLabels: true },
                yaxis: { tickDecimals: 0,
                         min: 0 },
                legend : {
                    show: false,
                    noColumns: 2
                }
            }
        },
        "totalUsers" : {
            operation: SunstoneMonitoring.ops.totalize
        }
    }
}


Sunstone.addActions(user_actions);
Sunstone.addMainTab('users_tab',users_tab);
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
        vms = user.VM_QUOTA.VM.VMS_USED;
        memory = user.VM_QUOTA.VM.MEMORY_USED+' MB';
        cpu = user.VM_QUOTA.VM.CPU_USED;
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
        if (this.USER.ID == uid)
            dashboardQuotasHTML(this.USER);
        user_list_array.push(userElementArray(this));
    });
    updateView(user_list_array,dataTable_users);
    SunstoneMonitoring.monitor('USER', users_list)
    if (mustBeAdmin())
        updateSystemDashboard("users",users_list);
    updateUserSelect();
};

function updateUserInfo(request,user){
    var user_info = user.USER;

    var info_tab = {
        title : tr("User information"),
        content :
        '<table id="info_user_table" class="info_table">\
            <thead>\
               <tr><th colspan="2">' + tr("User information") + ' - '+user_info.NAME+'</th></tr>\
            </thead>\
            <tbody>\
            <tr>\
                <td class="key_td">' + tr("ID") + '</td>\
                <td class="value_td">'+user_info.ID+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("Group") + '</td>\
                <td class="value_td">'+user_info.GNAME+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">' + tr("Authentication driver") + '</td>\
                <td class="value_td">'+user_info.AUTH_DRIVER+'</td>\
            </tr>\
            </tbody>\
         </table>\
        <table id="user_template_table" class="info_table">\
                <thead><tr><th colspan="2">' + tr("User template") + '</th></tr></thead>'+
            prettyPrintJSON(user_info.TEMPLATE)+
        '</table>'
    };

    var quotas_tab_html = '';

    if (!$.isEmptyObject(user_info.VM_QUOTA))
        quotas_tab_html += '<table class="info_table">\
            <tbody>'+prettyPrintJSON(user_info.VM_QUOTA)+'</tbody>\
          </table>'

    if (!$.isEmptyObject(user_info.DATASTORE_QUOTA))
        quotas_tab_html += '<table class="info_table">\
            <tbody>'+prettyPrintJSON(user_info.DATASTORE_QUOTA)+'</tbody>\
          </table>'

    if (!$.isEmptyObject(user_info.IMAGE_QUOTA))
        quotas_tab_html += '<table class="info_table">\
            <tbody>'+prettyPrintJSON(user_info.IMAGE_QUOTA)+'</tbody>\
          </table>';

    if (!$.isEmptyObject(user_info.NETWORK_QUOTA))
        quotas_tab_html += '<table class="info_table">\
            <tbody>'+prettyPrintJSON(user_info.NETWORK_QUOTA)+'</tbody>\
          </table>';

    var quotas_tab = {
        title : tr("User quotas"),
        content : quotas_tab_html
    };

    var acct_tab = {
        title : tr("Historical usages"),
        content : '<div><table class="info_table" style="margin-bottom:0">\
  <tr>\
    <td class="key_td"><label for="from">'+tr('From / to')+'</label></td>\
    <td class="value_td">\
       <input type="text" id="user_acct_from" name="from"/>\
       <input type="text" id="user_acct_to" name="to"/>\
       <button id="user_acct_date_ok"><i class="icon-ok"></i></button>\
    </td>\
  </tr>\
<!--\
  <tr>\
    <td class="key_td"><label for="from">'+tr('Meters')+'</label></td>\
    <td class="value_td">\
       <select style="width:173px" id="user_acct_meter1" name="meter1">\
       </select>\
       <select style="width:173px" id="user_acct_meter2" name="meter2">\
       </select>\
    </td>\
  </tr>\
-->\
</table></div>' + generateMonitoringDivs(user_acct_graphs, "user_acct_")
    };

    Sunstone.updateInfoPanelTab("user_info_panel","user_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("user_info_panel","user_quotas_tab",quotas_tab);
    Sunstone.updateInfoPanelTab("user_info_panel","user_acct_tab",acct_tab);
    Sunstone.popUpInfoPanel("user_info_panel");

    //Enable datepicker
    var info_dialog = $('div#user_acct_tab');
    $("#user_acct_from", info_dialog).datepicker({
        defaultDate: "-1d",
        changeMonth: true,
        numberOfMonths: 1,
        dateFormat: "dd/mm/yy",
        defaultDate: '-1',
        onSelect: function( selectedDate ) {
            $( "#user_acct_to", info_dialog).datepicker("option",
                                                        "minDate",
                                                        selectedDate );
        }
    });
    $("#user_acct_from", info_dialog).datepicker('setDate', '-1');

    $("#user_acct_to", info_dialog).datepicker({
        defaultDate: "0",
        changeMonth: true,
        numberOfMonths: 1,
        dateFormat: "dd/mm/yy",
        maxDate: '+1',
        onSelect: function( selectedDate ) {
            $( "#user_acct_from", info_dialog).datepicker( "option",
                                                           "maxDate",
                                                           selectedDate );
        }
    });
    $("#user_acct_to", info_dialog).datepicker('setDate', 'Now');

    //Listen to set date button
    $('button#user_acct_date_ok', info_dialog).click(function(){
        var from = $("#user_acct_from", info_dialog).val();
        var to = $("#user_acct_to", info_dialog).val();

        var start = $.datepicker.parseDate('dd/mm/yy', from)
        if (start){
            start = start.getTime();
            start = Math.floor(start / 1000);
        }

        var end = $.datepicker.parseDate('dd/mm/yy', to);
        if (end){
            end = end.getTime();
            end = Math.floor(end / 1000);
        }

        loadAccounting('User', user_info.ID, user_acct_graphs,
                  { start : start, end: end });
        return false;
    });

    //preload acct
    loadAccounting('User', user_info.ID, user_acct_graphs);
};

// Prepare the user creation dialog
function setupCreateUserDialog(){
    dialogs_context.append('<div title=\"'+tr("Create user")+'\" id="create_user_dialog"></div>');
    $create_user_dialog = $('#create_user_dialog',dialogs_context);
    var dialog = $create_user_dialog;
    dialog.html(create_user_tmpl);

    //Prepare jquery dialog
    dialog.dialog({
        autoOpen: false,
        modal:true,
        width: 400
    });

    $('button',dialog).button();

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
        $create_user_dialog.dialog('close');
        return false;
    });
}

function setupUpdatePasswordDialog(){
    dialogs_context.append('<div title="'+tr("Change password")+'" id="update_user_pw_dialog"></div>');
    $update_pw_dialog = $('#update_user_pw_dialog',dialogs_context);
    var dialog = $update_pw_dialog;
    dialog.html(update_pw_tmpl);

    //Prepare jquery dialog
    dialog.dialog({
        autoOpen: false,
        modal:true,
        width: 400
    });

    $('button',dialog).button();

    $('#update_user_pw_form',dialog).submit(function(){
        var pw=$('#new_password',this).val();

        if (!pw.length){
            notifyError(tr("Fill in a new password"));
            return false;
        }

        Sunstone.runAction("User.passwd",getSelectedNodes(dataTable_users),pw);
        $update_pw_dialog.dialog('close');
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
    $create_user_dialog.dialog('open');

}


function popUpUpdatePasswordDialog(){
    $('#new_password',$update_pw_dialog).val("");
    $update_pw_dialog.dialog('open');
}

// Prepare the autorefresh of the list
function setUserAutorefresh(){
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_users);
        var filter = $("#datatable_users_filter input",
                       dataTable_users.parents("#datatable_users_wrapper")).attr('value');
        if (!checked.length && !filter.length){
            Sunstone.runAction("User.autorefresh");
        }
    },INTERVAL+someTime());
}

$(document).ready(function(){
    //if we are not oneadmin, our tab will not even be in the DOM.
    dataTable_users = $("#datatable_users",main_tabs_context).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sPaginationType": "full_numbers",
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "bAutoWidth":false,
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "35px", "aTargets": [1,5,6,7,8] },
            { "sWidth": "150px", "aTargets": [4] },
            { "bVisible": false, "aTargets": [8]}
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });
    dataTable_users.fnClearTable();
    addElement([
        spinner,
        '','','','','','','',''],dataTable_users);

    Sunstone.runAction("User.list");

    setupCreateUserDialog();
    setupUpdatePasswordDialog();
    setupUserQuotasDialog();
    setUserAutorefresh();
    //Setup quota icons
    //Also for group tab
    setupQuotaIcons();



    initCheckAllBoxes(dataTable_users);
    tableCheckboxesListener(dataTable_users);
    //shortenedInfoFields('#datatable_users');
    infoListener(dataTable_users,'User.showinfo');

    $('div#users_tab div.legend_div').hide();
    $('div#users_tab_non_admin div.legend_div').hide();
});
