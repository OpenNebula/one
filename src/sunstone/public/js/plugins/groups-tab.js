/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

var dataTable_groups;
var $create_group_dialog;
var $group_quotas_dialog;

var group_acct_graphs = [
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

function create_group_tmpl(dialog_name){
    return '<div class="row">\
  <div class="large-12 columns">\
    <h3 id="create_group_header">'+tr("Create Group")+'</h3>\
    <h3 id="update_group_header">'+tr("Update Group")+'</h3>\
  </div>\
</div>\
<div class="reveal-body">\
  <form id="create_group_form" action="">\
    <div class="row">\
      <div class="columns large-5">\
          <label>'+tr("Name")+':\
            <input type="text" name="name" id="name" />\
          </label>\
      </div>\
      <div class="columns large-7">\
          <dl class="tabs right-info-tabs text-center right" data-tab>\
               <dd class="active"><a href="#resource_views"><i class="fa fa-eye"></i><br>'+tr("Views")+'</a></dd>\
               <dd><a href="#administrators"><i class="fa fa-upload"></i><br>'+tr("Admin")+'</a></dd>\
               <dd><a href="#resource_creation"><i class="fa fa-folder-open"></i><br>'+tr("Permissions")+'</a></dd>\
          </dl>\
      </div>\
    </div>\
    <div class="tabs-content">\
    <div id="resource_views" class="content active">\
      <div class="row">\
        <div class="large-12 columns">\
          <p class="subheader">'
            +tr("Allow users in this group to use the following Sunstone views")+
            '&emsp;<span class="tip">'+tr("Views available to the group users. If the default is unset, the one set in sunstone-views.yaml will be used")+'</span>\
          </p>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-12 columns">'+
            insert_views(dialog_name)
        +'</div>\
      </div>\
    </div>\
    <div id="administrators" class=" content">\
      <div class="row">\
        <div class="large-6 columns">\
          <div class="row">\
            <div class="large-12 columns">\
              <label>\
                <input type="checkbox" id="admin_user" name="admin_user" value="YES" />\
                '+tr("Create an administrator user")+'\
                <span class="tip">'+tr("You can create now an administrator user. More administrators can be added later.")+'</span>\
              </label>\
            </div>\
          </div>' +
          user_creation_div +   // from users-tab.js
        '</div>\
      </div>\
    </div>\
    <div id="resource_creation" class="content">\
      <div class="row">\
        <div class="large-12 columns">\
          <label>\
            <input type="checkbox" id="shared_resources" name="shared_resources" value="YES" />\
            '+tr("Allow users to view the VMs and Services of other users in the same group")+'\
            <span class="tip">'+tr("An ACL Rule will be created to give users in this group access to all the resources in the same group.")+'</span>\
          </label>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-12 columns">\
          <p class="subheader">'
            +tr("Allow users in this group to create the following resources")+
            '&emsp;<span class="tip">'+tr("This will create new ACL Rules to define which virtual resources this group's users will be able to create.")+'</span>\
          </p>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-12 columns">\
          <table class="dataTable" style="table-layout:fixed">\
            <thead><tr>\
              <th>'+tr("VMs")+'</th>\
              <th>'+tr("VNets")+'</th>\
              <th>'+tr("Security Groups")+'</th>\
              <th>'+tr("Images")+'</th>\
              <th>'+tr("Templates")+'</th>\
              <th>'+tr("Documents")+'<span class="tip">'+tr("Documents are a special tool used for general purposes, mainly by OneFlow. If you want to enable users of this group to use service composition via OneFlow, let it checked.")+'</span></th>\
            </tr></thead>\
            <tbody>\
              <tr>\
                <td><input type="checkbox" id="group_res_vm" name="group_res_vm" class="resource_cb" value="VM"></input></td>\
                <td><input type="checkbox" id="group_res_net" name="group_res_net" class="resource_cb" value="NET"></input></td>\
                <td><input type="checkbox" id="group_res_sg" name="group_res_sg" class="resource_cb" value="SECGROUP"></input></td>\
                <td><input type="checkbox" id="group_res_image" name="group_res_image" class="resource_cb" value="IMAGE"></input></td>\
                <td><input type="checkbox" id="group_res_template" name="group_res_template" class="resource_cb" value="TEMPLATE"></input></td>\
                <td><input type="checkbox" id="group_res_document" name="group_res_document" class="resource_cb" value="DOCUMENT"></input></td>\
                <td/>\
              </tr>\
            </tbody>\
          </table>\
        </div>\
      </div>\
    </div>\
  </div>\
  <div class="reveal-footer">\
    <div class="row collapse" id="default_vdc_warning">\
      <div class="large-12 columns text-right">\
        <span class="radius secondary label"><i class="fa fa-warning"/> '+tr("New Groups are automatically added to the default VDC")+'</span>\
      </div>\
    </div>\
    <div class="form_buttons">\
      <button class="button radius right success" id="create_group_submit" value="Group.create">'+tr("Create")+'</button>\
       <button class="button right radius" type="submit" id="update_group_submit">' + tr("Update") + '</button>\
      <button class="button secondary radius" id="create_group_reset_button" type="reset" value="reset">'+tr("Reset")+'</button>\
    </div>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>\
  </form>\
</div>';
}

function group_quotas_tmpl(){
    return '<div class="row" class="subheader">\
      <div class="large-12 columns">\
        <h3 id="create_group_quotas_header">'+tr("Update Quota")+'</h3>\
      </div>\
    </div>\
    <div class="reveal-body">\
    <form id="group_quotas_form" action="">'+
      quotas_tmpl() +
      '<div class="reveal-footer">\
        <div class="form_buttons">\
            <button class="button radius right success" id="create_user_submit" \
            type="submit" value="Group.set_quota">'+tr("Apply changes")+'</button>\
        </div>\
      </div>\
      <a class="close-reveal-modal">&#215;</a>\
    </form>\
    </div>';
}


var group_actions = {
    "Group.create" : {
        type: "create",
        call : OpenNebula.Group.create,
        callback : function(request, response) {
            // Reset the create wizard
            $create_group_dialog.foundation('reveal', 'close');
            $create_group_dialog.empty();
            setupCreateGroupDialog();

            OpenNebula.Helper.clear_cache("USER");

            Sunstone.runAction("Group.list");
            notifyCustom(tr("Group created"), " ID: " + response.GROUP.ID, false);
        },
        error : onError
    },

    "Group.create_dialog" : {
        type: "custom",
        call: popUpCreateGroupDialog
    },

    "Group.list" : {
        type: "list",
        call: OpenNebula.Group.list,
        callback: updateGroupsView,
        error: onError
    },

    "Group.show" : {
        type: "single",
        call: OpenNebula.Group.show,
        callback:   function(request, response) {
            updateGroupElement(request, response);
            if (Sunstone.rightInfoVisible($("#groups-tab"))) {
                updateGroupInfo(request, response);
            }
        },
        error: onError
    },

    "Group.refresh" : {
        type: "custom",
        call: function() {
          var tab = dataTable_groups.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("Group.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_groups);
            Sunstone.runAction("Group.list", {force: true});
          }
        },
        error: onError
    },

    "Group.update_template" : {
        type: "single",
        call: OpenNebula.Group.update,
        callback: function(request) {
            Sunstone.runAction('Group.show',request.request.data[0][0]);
        },
        error: onError
    },

    "Group.update_dialog" : {
        type: "single",
        call: initUpdateGroupDialog
    },

    "Group.show_to_update" : {
        type: "single",
        call: OpenNebula.Group.show,
        callback: function(request, response) {
            popUpUpdateGroupDialog(
                response.GROUP,
                $create_group_dialog);
        },
        error: onError
    },

    "Group.delete" : {
        type: "multiple",
        call : OpenNebula.Group.del,
        callback : deleteGroupElement,
        error : onError,
        elements: groupElements
    },

    "Group.fetch_quotas" : {
        type: "single",
        call: OpenNebula.Group.show,
        callback: function (request,response) {
            populateQuotasDialog(
                response.GROUP,
                default_group_quotas,
                "#group_quotas_dialog",
                $group_quotas_dialog);
        },
        error: onError
    },

    "Group.quotas_dialog" : {
        type: "custom",
        call: popUpGroupQuotasDialog
    },

    "Group.set_quota" : {
        type: "multiple",
        call: OpenNebula.Group.set_quota,
        elements: groupElements,
        callback: function(request,response) {
            Sunstone.runAction('Group.show',request.request.data[0]);
        },
        error: onError
    },

    "Group.accounting" : {
        type: "monitor",
        call: OpenNebula.Group.accounting,
        callback: function(req,response) {
            var info = req.request.data[0].monitor;
            //plot_graph(response,'#group_acct_tabTab','group_acct_', info);
        },
        error: onError
    },

    "Group.add_admin" : {
        type: "single",
        call : OpenNebula.Group.add_admin,
        callback : function (req) {
            Sunstone.runAction('Group.show',req.request.data[0][0]);
        },
        error : onError
    },

    "Group.del_admin" : {
        type: "single",
        call : OpenNebula.Group.del_admin,
        callback : function (req) {
            Sunstone.runAction('Group.show',req.request.data[0][0]);
        },
        error : onError
    }
}

var group_buttons = {
    "Group.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },
    "Group.create_dialog" : {
        type: "create_dialog",
        layout: "create",
        condition: mustBeAdmin
    },
    "Group.update_dialog" : {
        type : "action",
        layout: "main",
        text : tr("Update")
    },
    "Group.quotas_dialog" : {
        type : "action",
        text : tr("Quotas"),
        layout: "main",
        condition: mustBeAdmin
    },
    "Group.delete" : {
        type: "confirm",
        text: tr("Delete"),
        layout: "del",
        condition: mustBeAdmin
    },
};

var group_info_panel = {

};

var groups_tab = {
    title: tr("Groups"),
    resource: 'Group',
    buttons: group_buttons,
    tabClass: 'subTab',
    parentTab: 'system-tab',
    search_input: '<input id="group_search" type="search" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-users"></i>&emsp;'+tr("Groups"),
    info_header: '<i class="fa fa-fw fa-users"></i>&emsp;'+tr("Group"),
    subheader: '<span>\
        <span class="total_groups"/> <small>'+tr("TOTAL")+'</small>\
      </span>',
    table: '<table id="datatable_groups" class="datatable twelve">\
      <thead>\
        <tr>\
          <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
          <th>'+tr("ID")+'</th>\
          <th>'+tr("Name")+'</th>\
          <th>'+tr("Users")+'</th>\
          <th>'+tr("VMs")+'</th>\
          <th>'+tr("Memory")+'</th>\
          <th>'+tr("CPU")+'</th>\
        </tr>\
      </thead>\
      <tbody id="tbodygroups">\
      </tbody>\
    </table>'
};


Sunstone.addActions(group_actions);
Sunstone.addMainTab('groups-tab',groups_tab);
Sunstone.addInfoPanel("group_info_panel",group_info_panel);

function generateViewTable(views, dialog_name) {
  var table_str = '<table class="dataTable extended_table">'+
    "<tr>"+
      "<th style='width: 60%;'></th>"+
      "<th>"+tr("Group Users")+"</th>"+
      "<th>"+tr("Group Admins")+"</th>"+
    "<tr>";

  $.each(views, function(id, view){
      var default_user_checked = view.id == 'cloud' ? "checked" : "";
      var default_admin_checked = view.id == 'groupadmin' ? "checked" : "";

      table_str += "<tr><td>" + 
          view.name +
          ' ' + tr("View") +
          (view.description ? 
            '<span class="tip">'+view.description+'</span>'
            : "") +
        "</td>"+
        '<td>\
          <input class="user_view_input" type="checkbox" \
            id="group_view_'+dialog_name+'_'+view.id+'" \
            value="'+view.id+'" '+default_user_checked+'/>\
        </td>'+
        '<td>\
          <input class="admin_view_input" type="checkbox" \
            id="group_admin_view_'+dialog_name+'_'+view.id+'" \
            value="'+view.id+'" '+default_admin_checked+'/>\
        </td></tr>';
  });

  table_str += '</table>';

  return table_str;
} 

function insert_views(dialog_name){
  var filtered_views = {
    cloud : [],
    advanced : [],
    vcenter : [],
    other : []
  }

  var view_info;
  $.each(config['all_views'], function(index, view_id) {
    view_info = views_info[view_id];
    if (view_info) {
      switch (view_info.type) {
        case 'advanced':
          filtered_views.advanced.push(view_info);
          break;
        case 'cloud':
          filtered_views.cloud.push(view_info);
          break;
        case 'vcenter':
          filtered_views.vcenter.push(view_info);
          break;
        default:
          filtered_views.other.push({
            id: view_id,
            name: view_id,
            description: null,
            type: "other"
          });
          break;
      }
    } else {
      filtered_views.other.push({
        id: view_id,
        name: view_id,
        description: null,
        type: "other"
      });
    }
  })

  var str = "";

  str += '<div class="row">'+
      '<div class="large-6 columns user_view_default_container">'+
      '</div>'+
      '<div class="large-6 columns admin_view_default_container">'+
      '</div>'+
    '</div><br>';

  $.each(filtered_views, function(view_type, views){    
    if (views.length > 0) {
      str += '<div class="row">'+
          '<div class="large-7 columns">'+
            '<h4>'+view_types[view_type].name+
            (view_types[view_type].description ? 
              '<span class="tip">' + view_types[view_type].description + '</span>'
              : "")+
            '</h4>'+
            generateViewTable(views, dialog_name) +
          '</div>'+
          '<div class="large-5 columns" style="text-align: center">'+
            (view_types[view_type].preview ?
              '<img src="images/' + view_types[view_type].preview +'" style="height: 200px;">' :
              '') +
          '</div>'+
        '</div><br>';
    }
  })


  return str;
}

function groupElements(){
    return getSelectedNodes(dataTable_groups);
}

function groupElementArray(group_json){
    var group = group_json.GROUP;

    var users_str = "0";

    if (group.USERS.ID){
        if ($.isArray(group.USERS.ID)){
            users_str = group.USERS.ID.length;
        } else {
            users_str = "1";
        }
    }

    var vms    = '<span class="progress-text right" style="font-size: 12px">-</span>';
    var memory = '<span class="progress-text right" style="font-size: 12px">-</span>';
    var cpu    = '<span class="progress-text right" style="font-size: 12px">-</span>';

    initEmptyQuotas(group);

    if (!$.isEmptyObject(group.VM_QUOTA)){

        vms = quotaBar(
            group.VM_QUOTA.VM.VMS_USED,
            group.VM_QUOTA.VM.VMS,
            default_group_quotas.VM_QUOTA.VM.VMS);

        memory = quotaBarMB(
            group.VM_QUOTA.VM.MEMORY_USED,
            group.VM_QUOTA.VM.MEMORY,
            default_group_quotas.VM_QUOTA.VM.MEMORY);

        cpu = quotaBarFloat(
            group.VM_QUOTA.VM.CPU_USED,
            group.VM_QUOTA.VM.CPU,
            default_group_quotas.VM_QUOTA.VM.CPU);
    }

    return [
        '<input class="check_item" type="checkbox" id="group_'+group.ID+'" name="selected_items" value="'+group.ID+'"/>',
        group.ID,
        group.NAME,
        users_str,
        vms,
        memory,
        cpu
    ];
}

function updateGroupElement(request, group_json){
    var id = group_json.GROUP.ID;
    var element = groupElementArray(group_json);
    updateSingleElement(element,dataTable_groups,'#group_'+id);
    //No need to update select as all items are in it always
}

function deleteGroupElement(request){
    deleteElement(dataTable_groups,'#group_'+request.request.data);
}

function addGroupElement(request,group_json){
    var id = group_json.GROUP.ID;
    var element = groupElementArray(group_json);
    addElement(element,dataTable_groups);
}

//updates the list
function updateGroupsView(request, group_list, quotas_hash){
    group_list_json = group_list;
    var group_list_array = [];

    $.each(group_list,function(){
        // Inject the VM group quota. This info is returned separately in the
        // pool info call, but the groupElementArray expects it inside the GROUP,
        // as it is returned by the individual info call
        var q = quotas_hash[this.GROUP.ID];

        if (q != undefined) {
            this.GROUP.VM_QUOTA = q.QUOTAS.VM_QUOTA;
        }

        group_list_array.push(groupElementArray(this));
    });
    updateView(group_list_array,dataTable_groups);

    // Dashboard info
    $(".total_groups").text(group_list.length);
}

function updateGroupInfo(request,group){
    var info = group.GROUP;

    $(".resource-info-header", $("#groups-tab")).html(info.NAME);

    var info_tab = {
          title: tr("Info"),
          icon: "fa-info-circle",
          content:
          '<div class="row">\
            <div class="large-6 columns">\
              <table id="info_img_table" class="dataTable extended_table">\
                 <thead>\
                  <tr><th colspan="3">'+tr("Information")+'</th></tr>\
                 </thead>\
                 <tr>\
                    <td class="key_td">'+tr("ID")+'</td>\
                    <td class="value_td">'+info.ID+'</td>\
                    <td></td>\
                 </tr>\
                 <tr>\
                  <td class="key_td">'+tr("Name")+'</td>\
                  <td class="value_td_rename">'+info.NAME+'</td>\
                  <td></td>\
                </tr>\
              </table>\
           </div>\
           <div class="large-6 columns">' +
           '</div>\
         </div>\
         <div class="row">\
          <div class="large-9 columns">'+
              insert_extended_template_table(info.TEMPLATE,
                                                 "Group",
                                                 info.ID,
                                                 tr("Attributes")) +
          '</div>\
        </div>'
      }

    var users_tab = {
        title : tr("Users"),
        icon: "fa-users",
        content: group_users_tab_content(info)
    };

    var default_group_quotas = Quotas.default_quotas(info.DEFAULT_GROUP_QUOTAS);

    var quotas_html = initQuotasPanel(info, default_group_quotas,
        "#group_info_panel",
        Config.isTabActionEnabled("groups-tab", "Group.quotas_dialog"));

    var quotas_tab = {
        title : tr("Quotas"),
        icon: "fa-align-left",
        content : quotas_html
    };

    var accounting_tab = {
        title: tr("Accounting"),
        icon: "fa-bar-chart-o",
        content: '<div id="group_accounting"></div>'
    };


    Sunstone.updateInfoPanelTab("group_info_panel","group_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("group_info_panel","group_users_tab",users_tab);
    Sunstone.updateInfoPanelTab("group_info_panel","group_quotas_tab",quotas_tab);
    Sunstone.updateInfoPanelTab("group_info_panel","group_accounting_tab",accounting_tab);

    if (Config.isFeatureEnabled("showback")) {
      var showback_tab = {
          title: tr("Showback"),
          icon: "fa-money",
          content: '<div id="group_showback"></div>'
      };

      Sunstone.updateInfoPanelTab("group_info_panel","group_showback_tab",showback_tab);
    }

    Sunstone.popUpInfoPanel("group_info_panel", 'groups-tab');

    setup_group_users_tab_content(info);

    if (Config.isFeatureEnabled("showback")) {
      showbackGraphs(
          $("#group_showback","#group_info_panel"),
          {   fixed_user: "", fixed_group: info.ID });
    }

    $("#add_rp_button", $("#group_info_panel")).click(function(){
        initUpdateGroupDialog();

        return false;
    });

    accountingGraphs(
        $("#group_accounting","#group_info_panel"),
        {   fixed_group: info.ID,
            init_group_by: "user" });

    setupQuotasPanel(info,
        "#group_info_panel",
        Config.isTabActionEnabled("groups-tab", "Group.quotas_dialog"),
        "Group");
}

function group_users_tab_content(group_info){

    var html = "";

    if (Config.isTabActionEnabled("groups-tab", "Group.edit_admins")) {
        html +=
        '<div class="row">\
          <div class="large-4 columns right">\
            <span>\
              <button class="button secondary small radius" id="edit_admins_button" style="width: 100%;">\
                <span class="fa fa-pencil-square-o"></span> '+tr("Edit administrators")+'\
              </button>\
              <button class="button alert small radius" id="cancel_admins_button" style="display: none">\
                '+tr("Cancel")+'\
              </button>\
              <button class="button success small radius" id="submit_admins_button" style="display: none">\
                '+tr("Apply")+'\
              </button>\
            </span>\
          </div>\
        </div>';
    }

    html += '<div class="group_users_info_table">\
        '+generateUserTableSelect("group_users_list")+'\
      </div>';

    return html;
}

function setup_group_users_tab_content(group_info){

    var users = [];

    if (group_info.USERS.ID != undefined){
        users = group_info.USERS.ID;

        if (!$.isArray(users)){
            users = [users];
        }
    }

    var admins = [];

    if (group_info.ADMINS.ID != undefined){
        admins = group_info.ADMINS.ID;

        if (!$.isArray(admins)){
            admins = [admins];
        }
    }

    var opts = {
        read_only: true,
        fixed_ids: users,
        admin_ids: admins
    }

    setupUserTableSelect($("#group_info_panel"), "group_users_list", opts);

    refreshUserTableSelect($("#group_info_panel"), "group_users_list");

    if (Config.isTabActionEnabled("groups-tab", "Group.edit_admins")) {
        $("#group_info_panel").off("click", "#edit_admins_button");
        $("#group_info_panel").on("click",  "#edit_admins_button", function() {
            $("#edit_admins_button", "#group_info_panel").hide();
            $("#cancel_admins_button", "#group_info_panel").show();
            $("#submit_admins_button", "#group_info_panel").show();

            $("#group_info_panel div.group_users_info_table").html(
                generateUserTableSelect("group_users_edit_list") );


            var opts = {
                multiple_choice: true,
                fixed_ids: users,
                admin_ids: admins
            }

            setupUserTableSelect($("#group_info_panel"), "group_users_edit_list", opts);

            selectUserTableSelect($("#group_info_panel"), "group_users_edit_list", { ids : admins });

            return false;
        });

        $("#group_info_panel").off("click", "#cancel_admins_button");
        $("#group_info_panel").on("click",  "#cancel_admins_button", function() {
            Sunstone.runAction("Group.show", group_info.ID);
            return false;
        });

        $("#group_info_panel").off("click", "#submit_admins_button");
        $("#group_info_panel").on("click",  "#submit_admins_button", function() {
            // Add/delete admins

            var selected_admins_list = retrieveUserTableSelect(
                            $("#group_info_panel"), "group_users_edit_list");

            $.each(selected_admins_list, function(i,admin_id){
                if (admins.indexOf(admin_id) == -1){
                    Sunstone.runAction("Group.add_admin",
                        group_info.ID, {admin_id : admin_id});
                }
            });

            $.each(admins, function(i,admin_id){
                if (selected_admins_list.indexOf(admin_id) == -1){
                    Sunstone.runAction("Group.del_admin",
                        group_info.ID, {admin_id : admin_id});
                }
            });

            return false;
        });
    }


}

function disableAdminUser(dialog){
    $('#username',dialog).attr('disabled','disabled');
    $('#pass',dialog).attr('disabled','disabled');
    $('#driver',dialog).attr('disabled','disabled');
    $('#custom_auth',dialog).attr('disabled','disabled');
};

function enableAdminUser(dialog){
    $('#username',dialog).removeAttr("disabled");
    $('#pass',dialog).removeAttr("disabled");
    $('#driver',dialog).removeAttr("disabled");
    $('#custom_auth',dialog).removeAttr("disabled");
};


function generateUserViewsSelect(dialog, value) {
  var views = [];
  var old_value = $("#user_view_default").val();

  $(".user_view_input:checked", dialog).each(function(){
    views.push({
      value: this.value,
      name: (views_info[this.value] ? views_info[this.value].name : this.value)});
  });

  $(".user_view_default_container", dialog).html(
    generateValueSelect({
      id: 'user_view_default',
      label: tr("Default Users View"),
      options: views,
      custom: false
    }))

  $("#user_view_default", dialog).val(value ? value : old_value).change();
};

function generateAdminViewsSelect(dialog, value) {
  var views = [];
  var old_value = value || $("#admin_view_default").val();

  $(".admin_view_input:checked", dialog).each(function(){
    views.push({
      value: this.value,
      name: (views_info[this.value] ? views_info[this.value].name : this.value)});
  });

  $(".admin_view_default_container", dialog).html(
    generateValueSelect({
      id: 'admin_view_default',
      label: tr("Default Admins View"),
      options: views,
      custom: false
    }))

  if (old_value) {
    $("#admin_view_default", dialog).val(old_value).change();
  }
};

//Prepares the dialog to create
function setupCreateGroupDialog(){
    dialogs_context.append('<div id="create_group_dialog"></div>');
    $create_group_dialog = $('#create_group_dialog',dialogs_context);
    var dialog = $create_group_dialog;

    dialog.html(create_group_tmpl('create'));
    dialog.addClass("reveal-modal large max-height").attr("data-reveal", "");
    $(document).foundation();

    // Hide update buttons
    $('#update_group_submit',$create_group_dialog).hide();
    $('#update_group_header',$create_group_dialog).hide();

    setupTips($create_group_dialog);

    $('#create_group_reset_button').click(function(){
        $create_group_dialog.html("");
        setupCreateGroupDialog();

        popUpCreateGroupDialog();
    });

    setupCustomAuthDialog(dialog);

    $('input#name', dialog).change(function(){
        var val = $(this).val();
        var dialog = $create_group_dialog;

        $('#username',dialog).val(val + "-admin");
    });

    $('input#admin_user', dialog).change(function(){
        var dialog = $create_group_dialog;
        if ($(this).prop('checked')) {
            enableAdminUser(dialog);
        } else {
            disableAdminUser(dialog);
        }
    });

    disableAdminUser(dialog);

    $.each($('[id^="group_res"]', dialog), function(){
        $(this).prop("checked", true);
    });

    $("#group_res_net", dialog).prop("checked", false);

    generateAdminViewsSelect(dialog, "groupadmin");
    $(dialog).off("change", ".admin_view_input");
    $(dialog).on("change", ".admin_view_input", function(){
      generateAdminViewsSelect(dialog);
    })

    generateUserViewsSelect(dialog, "cloud")
    $(dialog).off("change", ".user_view_input")
    $(dialog).on("change", ".user_view_input", function(){
      generateUserViewsSelect(dialog)
    })

    $('#create_group_form',dialog).submit(function(){
        var name = $('#name',this).val();

        var user_json = null;

        if ( $('#admin_user', this).prop('checked') ){
            user_json = buildUserJSON(this);    // from users-tab.js

            if (!user_json) {
                notifyError(tr("User name and password must be filled in"));
                return false;
            }
        }

        var group_json = {
            "group" : {
                "name" : name
            }
        };

        if (user_json){
            group_json["group"]["group_admin"] = user_json["user"];
        }

        var resources = "";
        var separator = "";

        $.each($('[id^="group_res"]:checked', dialog), function(){
            resources += (separator + $(this).val());
            separator = "+";
        });

        group_json['group']['resources'] = resources;

        if ( $('#shared_resources', this).prop('checked') ){
            group_json['group']['shared_resources'] = "VM+DOCUMENT";
        }

        group_json['group']['views'] = [];

        $.each($('[id^="group_view"]:checked', dialog), function(){
            group_json['group']['views'].push($(this).val());
        });

        var default_view = $('#user_view_default', dialog).val();
        if (default_view != undefined){
            group_json['group']['default_view'] = default_view;
        }

        group_json['group']['admin_views'] = [];

        $.each($('[id^="group_admin_view"]:checked', dialog), function(){
            group_json['group']['admin_views'].push($(this).val());
        });

        var default_view = $('#admin_view_default', dialog).val();
        if (default_view != undefined){
            group_json['group']['default_admin_view'] = default_view;
        }

        Sunstone.runAction("Group.create",group_json);
        return false;
    });
}

function popUpCreateGroupDialog(){
    $create_group_dialog.foundation().foundation('reveal', 'open');
    $("input#name",$create_group_dialog).focus();
}

//Prepares the dialog to update
function setupUpdateGroupDialog(){
    if (typeof($update_group_dialog) !== "undefined"){
        $update_group_dialog.html("");
    }

    dialogs_context.append('<div id="update_group_dialog"></div>');
    $update_group_dialog = $('#update_group_dialog',dialogs_context);
    var dialog = $update_group_dialog;

    dialog.html(create_group_tmpl('update'));
    dialog.addClass("reveal-modal large max-height").attr("data-reveal", "");
    $(document).foundation();

    setupTips($update_group_dialog);

    // Hide create button
    $('#default_vdc_warning',$update_group_dialog).hide();
    $('#create_group_submit',$update_group_dialog).hide();
    $('#create_group_header',$update_group_dialog).hide();
    $('#create_group_reset_button',$update_group_dialog).hide();

    // Disable parts of the wizard
    $("input#name", dialog).attr("disabled", "disabled");

    $("a[href='#administrators']", dialog).parents("dd").hide();
    $("a[href='#resource_creation']", dialog).parents("dd").hide();

    $(dialog).off("change", ".admin_view_input")
    $(dialog).on("change", ".admin_view_input", function(){
      generateAdminViewsSelect(dialog);
    })

    $(dialog).off("change", ".user_view_input")
    $(dialog).on("change", ".user_view_input", function(){
      generateUserViewsSelect(dialog)
    })

    $update_group_dialog.foundation();
}

function initUpdateGroupDialog(){
    var selected_nodes = getSelectedNodes(dataTable_groups);

    if ( selected_nodes.length != 1 )
    {
        notifyMessage("Please select one (and just one) group to update.");
        return false;
    }

    // Get proper id
    var group_id = ""+selected_nodes[0];

    setupUpdateGroupDialog();

    Sunstone.runAction("Group.show_to_update", group_id);
}

function popUpUpdateGroupDialog(group, dialog)
{
    var dialog = $update_group_dialog;

    dialog.foundation('reveal', 'open');

    $("input#name",$update_group_dialog).val(group.NAME);

    var views_str = "";

    $('input[id^="group_view"]', dialog).removeAttr('checked');

    if (group.TEMPLATE.SUNSTONE_VIEWS){
        views_str = group.TEMPLATE.SUNSTONE_VIEWS;

        var views = views_str.split(",");
        $.each(views, function(){
            $('input[id^="group_view"][value="'+this.trim()+'"]',
                dialog).attr('checked','checked').change();
        });
    }

    $('input[id^="group_default_view"]', dialog).removeAttr('checked');

    if (group.TEMPLATE.DEFAULT_VIEW){
      $('#user_view_default', dialog).val(group.TEMPLATE.DEFAULT_VIEW.trim()).change();
    } else {
      $('#user_view_default', dialog).val("").change();
    }

    $('input[id^="group_admin_view"]', dialog).removeAttr('checked');

    if (group.TEMPLATE.GROUP_ADMIN_VIEWS){
        views_str = group.TEMPLATE.GROUP_ADMIN_VIEWS;

        var views = views_str.split(",");
        $.each(views, function(){
            $('input[id^="group_admin_view"][value="'+this.trim()+'"]',
                dialog).attr('checked','checked').change();
        });
    }

    $('input[id^="group_default_admin_view"]', dialog).removeAttr('checked');

    if (group.TEMPLATE.GROUP_ADMIN_DEFAULT_VIEW){
      $('#admin_view_default', dialog).val(group.TEMPLATE.GROUP_ADMIN_DEFAULT_VIEW.trim()).change();
    } else {
      $('#admin_view_default', dialog).val("").change();
    }

    $(dialog).off("click", 'button#update_group_submit');
    $(dialog).on("click", 'button#update_group_submit', function(){

        // Update Views
        //-------------------------------------
        var template_json = group.TEMPLATE;

        delete template_json["SUNSTONE_VIEWS"];
        delete template_json["DEFAULT_VIEW"];
        delete template_json["GROUP_ADMIN_VIEWS"];
        delete template_json["GROUP_ADMIN_DEFAULT_VIEW"];

        var views = [];

        $.each($('[id^="group_view"]:checked', dialog), function(){
            views.push($(this).val());
        });

        if (views.length != 0){
            template_json["SUNSTONE_VIEWS"] = views.join(",");
        }

        var default_view = $('#user_view_default', dialog).val();

        if (default_view != undefined){
            template_json["DEFAULT_VIEW"] = default_view;
        }

        var admin_views = [];

        $.each($('[id^="group_admin_view"]:checked', dialog), function(){
            admin_views.push($(this).val());
        });

        if (admin_views.length != 0){
            template_json["GROUP_ADMIN_VIEWS"] = admin_views.join(",");
        }

        var default_admin_view = $('#admin_view_default', dialog).val();

        if (default_admin_view != undefined){
            template_json["GROUP_ADMIN_DEFAULT_VIEW"] = default_admin_view;
        }

        var template_str = convert_template_to_string(template_json);

        Sunstone.runAction("Group.update_template",group.ID,template_str);

        // Close the dialog
        //-------------------------------------

        dialog.foundation('reveal', 'close');

        return false;
    });

}

// Add groups quotas dialog and calls common setup() in sunstone utils.
function setupGroupQuotasDialog(){
    dialogs_context.append('<div id="group_quotas_dialog"></div>');
    $group_quotas_dialog = $('#group_quotas_dialog',dialogs_context);
    var dialog = $group_quotas_dialog;
    dialog.html(group_quotas_tmpl());

    setupQuotasDialog(dialog);
}

function popUpGroupQuotasDialog(){
    var tab = dataTable_groups.parents(".tab");
    if (Sunstone.rightInfoVisible(tab)) {
        $('a[href="#group_quotas_tab"]', tab).click();
        $('#edit_quotas_button', tab).click();
    } else {
        popUpQuotasDialog(
            $group_quotas_dialog,
            'Group',
            groupElements(),
            default_group_quotas,
            "#group_quotas_dialog");
    }
}

$(document).ready(function(){
    var tab_name = 'groups-tab';

    if (Config.isTabEnabled(tab_name)) {
      dataTable_groups = $("#datatable_groups",main_tabs_context).dataTable({
            "bSortClasses" : false,
            "bAutoWidth": false,
            "bDeferRender": true,
            "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check",4,5,6] },
              { "sWidth": "35px", "aTargets": [0] },
              { "sWidth": "150px", "aTargets": [4,5,6] },
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ]
      });

      $('#group_search').keyup(function(){
        dataTable_groups.fnFilter( $(this).val() );
      })

      dataTable_groups.on('draw', function(){
        recountCheckboxes(dataTable_groups);
      })

      Sunstone.runAction("Group.list");
      setupCreateGroupDialog();
      setupGroupQuotasDialog();

      initCheckAllBoxes(dataTable_groups);
      tableCheckboxesListener(dataTable_groups);
      infoListener(dataTable_groups, 'Group.show');

      $('div#groups_tab div.legend_div').hide();
      $('div#groups_tab_non_admin div.legend_div').hide();

      dataTable_groups.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
})
