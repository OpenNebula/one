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

var groups_select="";
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

var groups_tab_content = '\
<form class="custom" id="group_form" action="">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
        <i class="icon-group"></i> '+tr("Groups")+'\
      </span>\
      <span class="header-info">\
        <span id="total_groups"/> <small>'+tr("TOTAL")+'</small>\
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
    <input id="group_search" type="text" placeholder="'+tr("Search")+'" />\
  </div>\
  <br>\
  <br>\
</div>\
</div>\
  <div class="row">\
    <div class="twelve columns">\
<table id="datatable_groups" class="datatable twelve">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Name")+'</th>\
      <th>'+tr("Users")+'</th>\
      <th style="width:18%">'+tr("VMs")+'</th>\
      <th style="width:18%">'+tr("Memory")+'</th>\
      <th style="width:18%">'+tr("CPU")+'</th>\
    </tr>\
  </thead>\
  <tbody id="tbodygroups">\
  </tbody>\
</table>\
</form>';

var create_group_tmpl =
'<div class="panel">\
  <h3>\
    <small id="create_vnet_header">'+tr("Create Group")+'</small>\
  </h3>\
</div>\
<div class="reveal-body">\
  <form id="create_group_form" action="">\
    <div class="row centered">\
      <div class="columns eight centered">\
        <div class="two columns">\
          <label class="inline right" for="name">'+tr("Name")+':</label>\
        </div>\
        <div class="nine columns">\
          <input type="text" name="name" id="name" /><br />\
        </div>\
        <div class="one columns">\
          <div class=""></div>\
        </div>\
      </div>\
    </div>\
    <div class="row">\
      <fieldset>\
        <legend>'+tr("Resource Providers")+':</legend>\
        <dl class="tabs" id="group_zones_tabs">\
          <dt>' + tr("Zones") +':</dt>\
        </dl>\
        <ul class="tabs-content" id="group_zones_tabs_content">\
        </ul>\
      </fieldset>\
    </div>\
    <br/>\
    <div class="row">\
      <fieldset>\
        <legend>'+tr("Resource creation")+':</legend>\
        <div class="row">\
          <div class="eleven columns">'
            +tr("Allow users in this group to create the following resources")+
          '</div>\
          <div class="one columns">\
            <div class="tip">'+tr("This will create new ACL Rules to define which virtual resources this group's users will be able to create. You can set different resources for the administrator group, and decide if the administrators will be allowed to create new users.")+'</div>\
          </div>\
        </div>\
        <table class="datatable twelve extended_table" style="table-layout:fixed">\
          <thead><tr>\
            <th/>\
            <th>'+tr("Virtual Machines")+'</th>\
            <th>'+tr("Virtual Networks")+'</th>\
            <th>'+tr("Images")+'</th>\
            <th>'+tr("Templates")+'</th>\
            <th>'+tr("Documents")+'</th>\
            <th>'+tr("Users")+'</th>\
          </tr></thead>\
          <tbody>\
            <tr>\
              <th>'+tr("Group Users")+'</th>\
              <td><input type="checkbox" id="group_res_vm" name="group_res_vm" class="resource_cb" value="VM"></input></td>\
              <td><input type="checkbox" id="group_res_net" name="group_res_net" class="resource_cb" value="NET"></input></td>\
              <td><input type="checkbox" id="group_res_image" name="group_res_image" class="resource_cb" value="IMAGE"></input></td>\
              <td><input type="checkbox" id="group_res_template" name="group_res_template" class="resource_cb" value="TEMPLATE"></input></td>\
              <td><input type="checkbox" id="group_res_document" name="group_res_document" class="resource_cb" value="DOCUMENT"></input></td>\
              <td/>\
            </tr>\
            <tr>\
              <th>'+tr("Admin Group Users")+'</th>\
              <td><input type="checkbox" id="group_admin_res_vm" name="group_admin_res_vm" class="resource_cb" value="VM"></input></td>\
              <td><input type="checkbox" id="group_admin_res_net" name="group_admin_res_net" class="resource_cb" value="NET"></input></td>\
              <td><input type="checkbox" id="group_admin_res_image" name="group_admin_res_image" class="resource_cb" value="IMAGE"></input></td>\
              <td><input type="checkbox" id="group_admin_res_template" name="group_admin_res_template" class="resource_cb" value="TEMPLATE"></input></td>\
              <td><input type="checkbox" id="group_admin_res_document" name="group_admin_res_document" class="resource_cb" value="DOCUMENT"></input></td>\
              <td><input type="checkbox" id="group_admin_res_user" name="group_admin_res_user" class="resource_cb" value="USER"></input></td>\
            </tr>\
          </tbody>\
        </table>\
      </fieldset>\
    </div>\
    <br/>\
    <div class="row">\
      <fieldset>\
        <legend>'+tr("Administrators")+':</legend>\
        <div class="row">\
          <div class="one columns">\
           <input type="checkbox" id="admin_group" name="admin_group" value="YES" />\
          </div>\
          <div class="ten columns">\
            <label class="inline left" for="admin_group">'+tr("Create an administrator group")+'.</label>\
          </div>\
          <div class="one columns">\
            <div class="tip">'+tr("This admin group will contain users with administrative privileges for the new regular group, not for all the resources in the OpenNebula cloud as the 'oneadmin' group users have.")+'</div>\
          </div>\
        </div>\
        <div class="row centered">\
          <div class="four columns">\
            <label class="inline right" for="admin_group_name">'+tr("Group name")+':</label>\
          </div>\
          <div class="seven columns">\
            <input type="text" name="admin_group_name" id="admin_group_name" />\
          </div>\
          <div class="one columns">\
            <div class=""></div>\
          </div>\
        </div>\
        <div class="row">\
          <div class="one columns">\
           <input type="checkbox" id="admin_user" name="admin_user" value="YES" />\
          </div>\
          <div class="ten columns">\
            <label class="inline left" for="admin_user">'+tr("Create an administrator user")+'.</label>\
          </div>\
          <div class="one columns">\
            <div class="tip">'+tr("You can create now an administrator user that will be assigned to the new regular group, with the administrator group as a secondary one.")+'</div>\
          </div>\
        </div>' +
        user_creation_div +   // from users-tab.js
      '</fieldset>\
    </div>\
    <div class="reveal-footer">\
      <hr>\
      <div class="form_buttons">\
        <button class="button radius right success" id="create_group_submit" value="Group.create">'+tr("Create")+'</button>\
        <button class="button secondary radius" id="create_group_reset_button" type="reset" value="reset">'+tr("Refresh")+'</button>\
        <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
      </div>\
    </div>\
    <a class="close-reveal-modal">&#215;</a>\
  </form>\
</div>';

var group_quotas_tmpl = '<div class="panel">\
  <h3>\
    <small id="create_vnet_header">'+tr("Update Quota")+'</small>\
  </h3>\
</div>\
<div class="reveal-body">\
<form id="group_quotas_form" action="">\
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
          <div class="six columns">\
              <label class="inline right" >'+tr("Max VMs")+':</label>\
          </div>\
          <div class="five columns">\
            <input type="text" name="VMS"></input>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
        </div>\
        <div class="row">\
          <div class="six columns">\
              <label class="inline right" >'+tr("Max Memory (MB)")+':</label>\
          </div>\
          <div class="five columns">\
            <input type="text" name="MEMORY"></input>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
        </div>\
        <div class="row">\
          <div class="six columns">\
              <label class="inline right" >'+tr("Max CPU")+':</label>\
          </div>\
          <div class="five columns">\
            <input type="text" name="CPU"></input>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
        </div>\
        <div class="row">\
          <div class="six columns">\
              <label class="inline right" >'+tr("Max Volatile Storage (MB)")+':</label>\
          </div>\
          <div class="five columns">\
            <input type="text" name="VOLATILE_SIZE"></input>\
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
        <button class="button radius right success" id="create_user_submit" type="submit" value="Group.set_quota">'+tr("Apply changes")+'</button>\
        <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
    </div>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>\
</div>';


var group_actions = {
    "Group.create" : {
        type: "create",
        call : OpenNebula.Group.create,
        callback : function (request,group_json){
            // Reset the create wizard
            $create_group_dialog.empty();
            setupCreateGroupDialog();

            Sunstone.runAction("Group.list");
        },
        error : onError,
        notify: true
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
        callback: updateGroupElement,
        error: onError
    },

    "Group.showinfo" : {
        type: "single",
        call: OpenNebula.Group.show,
        callback: updateGroupInfo,
        error: onError
    },

    "Group.autorefresh" : {
        type: "custom",
        call: function () {
            OpenNebula.Group.list({timeout: true, success: updateGroupsView,error: onError});
        }
    },

    "Group.refresh" : {
        type: "custom",
        call: function() {
            waitingNodes(dataTable_groups);
            Sunstone.runAction("Group.list");
        },
        error: onError
    },

    "Group.delete" : {
        type: "multiple",
        call : OpenNebula.Group.del,
        callback : deleteGroupElement,
        error : onError,
        elements: groupElements,
        notify:true
    },

    "Group.fetch_quotas" : {
        type: "single",
        call: OpenNebula.Group.show,
        callback: function (request,response) {
            var parsed = parseQuotas(response.GROUP,quotaListItem);
            $('.current_quotas table tbody',$group_quotas_dialog).append(parsed.VM);
            $('.current_quotas table tbody',$group_quotas_dialog).append(parsed.DATASTORE);
            $('.current_quotas table tbody',$group_quotas_dialog).append(parsed.IMAGE);
            $('.current_quotas table tbody',$group_quotas_dialog).append(parsed.NETWORK);
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
        callback: function() {
            notifyMessage(tr("Quotas updated correctly"));
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

    "Group.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#groups_tab div.legend_div').slideToggle();
        }
    },

    "Group.add_provider_action" : {
        type: "single",
        call: OpenNebula.Group.add_provider,
        callback: function(request) {
           Sunstone.runAction('Group.showinfo',request.request.data[0][0]);
        },
        error: onError,
        notify: true
    },

    "Group.del_provider_action" : {
        type: "single",
        call: OpenNebula.Group.del_provider,
        callback: function(request) {
          Sunstone.runAction('Group.showinfo',request.request.data[0][0]);
        },
        error: onError,
        notify: true
    },

    "Group.add_provider" : {
        type: "multiple",
        call: function(params){
            var cluster = params.data.extra_param;
            var group   = params.data.id;

            extra_param = {
                "zone_id" : 0,
                "cluster_id" : cluster
            }

            Sunstone.runAction("Group.add_provider_action", group, extra_param);
        },
        callback: function(request) {
            Sunstone.runAction('Group.showinfo',request.request.data[0]);
        },
        elements: groupElements,
        notify:true
    },

    "Group.del_provider" : {
        type: "multiple",
        call: function(params){
            var cluster = params.data.extra_param;
            var group   = params.data.id;

            extra_param = {
                "zone_id" : 0,
                "cluster_id" : cluster
            }

            Sunstone.runAction("Group.del_provider_action", group, extra_param);
        },
        callback: function(request) {
            Sunstone.runAction('Group.showinfo',request.request.data[0]);
        },
        elements: groupElements,
        notify:true
    }
}

var group_buttons = {
    "Group.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
    "Group.create_dialog" : {
        type: "create_dialog",
        layout: "create",
        condition: mustBeAdmin
    },
    "Group.quotas_dialog" : {
        type : "action",
        text : tr("Update quotas"),
        layout: "more_select",
        condition: mustBeAdmin
    },
    "Group.delete" : {
        type: "confirm",
        text: tr("Delete"),
        layout: "del",
        condition: mustBeAdmin
    }
};

var group_info_panel = {
};

var groups_tab = {
    title: tr("Groups"),
    content: groups_tab_content,
    buttons: group_buttons,
    tabClass: 'subTab',
    parentTab: 'system-tab',
    condition: mustBeAdmin
};

var groups_tab_non_admin = {
    title: tr("Group info"),
    content: groups_tab_content,
    buttons: group_buttons,
    tabClass: 'subTab',
    parentTab: 'dashboard_tab',
    condition: mustNotBeAdmin
}

Sunstone.addActions(group_actions);
Sunstone.addMainTab('groups-tab',groups_tab);
Sunstone.addMainTab('groups_tab_non_admin',groups_tab_non_admin);
Sunstone.addInfoPanel("group_info_panel",group_info_panel);

function groupElements(){
    return getSelectedNodes(dataTable_groups);
}

function groupElementArray(group_json){
    var group = group_json.GROUP;

    var users_str = group.USERS.ID ? group.USERS.ID.length : 0;

    var vms = "-";
    var memory = "-";
    var cpu = "-";

    if (!$.isEmptyObject(group.VM_QUOTA)){

        var vms = quotaBar(
            group.VM_QUOTA.VM.VMS_USED,
            group.VM_QUOTA.VM.VMS,
            default_group_quotas.VM_QUOTA.VM.VMS);

        var memory = quotaBarMB(
            group.VM_QUOTA.VM.MEMORY_USED,
            group.VM_QUOTA.VM.MEMORY,
            default_group_quotas.VM_QUOTA.VM.MEMORY);

        var cpu = quotaBarFloat(
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

function updateGroupSelect(){
    groups_select = makeSelectOptions(dataTable_groups,
                                      1,//id_col
                                      2,//name_col
                                      [],//status_cols
                                      []//bad_status_cols
                                     );
}

function updateGroupElement(request, group_json){
    var id = group_json.GROUP.ID;
    var element = groupElementArray(group_json);
    updateSingleElement(element,dataTable_groups,'#group_'+id);
    //No need to update select as all items are in it always
}

function deleteGroupElement(request){
    deleteElement(dataTable_groups,'#group_'+request.request.data);
    updateGroupSelect();
}

function addGroupElement(request,group_json){
    var id = group_json.GROUP.ID;
    var element = groupElementArray(group_json);
    addElement(element,dataTable_groups);
    updateGroupSelect();
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
    updateGroupSelect(group_list);

    // Dashboard info
    $("#total_groups", $dashboard).text(group_list.length);

    var form = $("#group_form");

    $("#total_groups", form).text(group_list.length);
}

function fromJSONtoProvidersTable(group_info){
    providers_array=group_info.RESOURCE_PROVIDER
    var str = ""
    if (!providers_array){ return "";}
    if (!$.isArray(providers_array))
    {
        var tmp_array   = new Array();
        tmp_array[0]    = providers_array;
        providers_array = tmp_array;
    }

    $.each(providers_array, function(index, provider){
       var cluster_id = (provider.CLUSTER_ID == "10") ? tr("All") : provider.CLUSTER_ID;
       str +=
        '<tr>\
            <td>' + provider.ZONE_ID + '</td>\
            <td>' + cluster_id + '</td>\
            <td>\
             <div id="div_minus_rp">\
               <a id="div_minus_rp_a_'+provider.ZONE_ID+'" class="cluster_id_'+cluster_id+' group_id_'+group_info.ID+'" href="#"><i class="icon-trash"/></a>\
             </div>\
            </td>\
        </tr>';
    });

    $("#div_minus_rp").die();

        // Listener for key,value pair remove action
    $("#div_minus_rp").live("click", function() {
        // Remove div_minus from the id
        zone_id = this.firstElementChild.id.substring(15,this.firstElementChild.id.length);

        var list_of_classes = this.firstElementChild.className.split(" ");

        $.each(list_of_classes, function(index, value) {
            if (value.match(/^cluster_id_/))
            {
              cluster_id=value.substring(11,value.length);
            }
            else
            {
              if (value.match(/^group_id_/))
              {
                group_id=value.substring(9,value.length);
              }
            }
              
        });

        extra_param = {
            "zone_id" : zone_id,
            "cluster_id" :  (cluster_id == "All") ? 10 : cluster_id
        }

        Sunstone.runAction("Group.del_provider_action", group_id, extra_param);
    });

    return str;
}

function updateGroupInfo(request,group){
    var info = group.GROUP;

    var  default_group_quotas = Quotas.default_quotas(info.DEFAULT_GROUP_QUOTAS);
    var quotas_tab_html = '<div class="three columns">' + Quotas.vms(info, default_group_quotas) + '</div>';
    quotas_tab_html += '<div class="three columns">' + Quotas.cpu(info, default_group_quotas) + '</div>';
    quotas_tab_html += '<div class="three columns">' + Quotas.memory(info, default_group_quotas) + '</div>';
    quotas_tab_html += '<div class="three columns">' + Quotas.volatile_size(info, default_group_quotas) + '</div>';
    quotas_tab_html += '<br><br>';
    quotas_tab_html += '<div class="six columns">' + Quotas.image(info, default_group_quotas) + '</div>';
    quotas_tab_html += '<div class="six columns">' + Quotas.network(info, default_group_quotas) + '</div>';
    quotas_tab_html += '<br><br>';
    quotas_tab_html += '<div class="twelve columns">' + Quotas.datastore(info, default_group_quotas) + '</div>';

    var quotas_tab = {
        title : tr("Quotas"),
        content : quotas_tab_html
    };


    var providers_tab = {
        title : tr("Resource Providers"),
        content :
        '<div class="">\
            <div class="six columns">\
              <button id="add_rp_button" class="button small secondary radius" >' + tr("Add Resource Provider") +'</button>\
               <br><br>\
                <table id="info_user_table" class="twelve datatable extended_table">\
                    <thead>\
                        <tr>\
                            <th>' + tr("Zone ID") + '</th>\
                            <th>' + tr("Cluster ID") + '</th>\
                            <th></th>\
                        </tr>\
                    </thead>\
                    <tbody>' +
                        fromJSONtoProvidersTable(info) +
                    '</tbody>\
                </table>\
            </div>\
        </div>'
    };


    Sunstone.updateInfoPanelTab("group_info_panel","group_quotas_tab",quotas_tab);
    Sunstone.updateInfoPanelTab("group_info_panel","group_providers_tab",providers_tab);
    Sunstone.popUpInfoPanel("group_info_panel", 'groups-tab');


    $("#group_info_panel_refresh", $("#group_info_panel")).click(function(){
      $(this).html(spinner);
      Sunstone.runAction('Group.showinfo', info.ID);
    })


    $("#add_rp_button", $("#group_info_panel")).click(function(){
      setup_add_rp_dialog(info.ID);
      $('#add_rp_dialog',dialogs_context).addClass("reveal-modal large max-height");
      $('#add_rp_dialog',dialogs_context).reveal();

      return false;
    })
}


function setup_add_rp_dialog(group_id){
    dialogs_context.append('<div id="add_rp_dialog"></div>');

    var dialog = $('#add_rp_dialog',dialogs_context);

    dialog.html(
        '<div class="panel">\
            <h3>\
              <small id="create_vnet_header">'
              +tr("Select Resource Providers")+
              '</small>\
            </h3>\
        </div>\
        <div class="reveal-body">\
            <div class="row">\
              <fieldset>\
                <legend>'+tr("Resource Providers")+':</legend>\
                <dl class="tabs" id="group_zones_tabs">\
                  <dt>' + tr("Zones") +':</dt>\
                </dl>\
                <ul class="tabs-content" id="group_zones_tabs_content">\
                </ul>\
              </fieldset>\
            </div>\
            <div class="reveal-footer">\
              <hr>\
              <div class="form_buttons">\
                <button class="button radius right success" id="add_rp_submit">'+tr("Add")+'</button>\
                <button class="close-reveal-modal button secondary radius" type="button" id="add_rp_close" value="close">' + tr("Close") + '</button>\
              </div>\
            </div>\
        </div>');

     $('#add_rp_submit',dialog).die();
     $('#add_rp_submit',dialog).live( "click", function() {

       $.each(selected_group_clusters, function(zone_id, zone_clusters) {
           var str_zone_tab_id = 'zone' + zone_id + "_add_rp";

           var resource_selection = $("input[name='"+str_zone_tab_id+"']:checked", dialog).val();
           switch (resource_selection){
           case "all":
               // 10 is the special ID for ALL, see ClusterPool.h
              extra_param = {
                   "zone_id" : zone_id,
                   "cluster_id" : 10
               }

              Sunstone.runAction("Group.add_provider_action", 
                                 group_id, 
                                 extra_param);

              break;
           case "cluster":
               $.each(selected_group_clusters[zone_id], function(key, value) {
                 extra_param = {
                     "zone_id" : zone_id,
                     "cluster_id" : key
                 }

                 Sunstone.runAction("Group.add_provider_action", 
                                     group_id, 
                                     extra_param);
               });

               break;
           default: // "none"

           }
       });

     dialog.trigger('reveal:close');
     dialog.remove();

    });

    $('#add_rp_close',dialog).die();
    $('#add_rp_close',dialog).live( "click", function() {
       dialog.trigger('reveal:close');
       dialog.remove();
    });

    OpenNebula.Zone.list({
      timeout: true,
      success: function (request, obj_list){
          $.each(obj_list,function(){
              add_resource_tab(this.ZONE.ID, this.ZONE.NAME, dialog, "add_rp");
          });
      },
      error: onError
    });
}

function setup_group_resource_tab_content(zone_id, zone_section, str_zone_tab_id, str_datatable_id, id_suffix) {
    // Show the clusters dataTable when the radio button is selected
    $("input[name='"+str_zone_tab_id+"']", zone_section).change(function(){
        if ($("input[name='"+str_zone_tab_id+"']:checked", zone_section).val() == "cluster") {
            $("div.group_cluster_select", zone_section).show();
        }
        else {
            $("div.group_cluster_select", zone_section).hide();
        }
    });

    if (zone_id == 0 && !id_suffix)
    {
      $('#'+str_zone_tab_id+'resources_all', zone_section).click();
    }
    else
    {
      $('#'+str_zone_tab_id+'resources_none', zone_section).click();
    }

    var dataTable_group_clusters = $('#'+str_datatable_id, zone_section).dataTable({
        "iDisplayLength": 4,
        "sDom" : '<"H">t<"F"p>',
        "bAutoWidth":false,
        "aoColumnDefs": [
            { "sWidth": "35px", "aTargets": [0,1] },
            { "bVisible": false, "aTargets": []}
        ]
    });

    // Retrieve the clusters to fill the datatable
    update_datatable_group_clusters(dataTable_group_clusters, zone_id);

    $('#'+str_zone_tab_id+'_search', zone_section).keyup(function(){
        dataTable_group_clusters.fnFilter( $(this).val() );
    })

    dataTable_group_clusters.fnSort( [ [1,config['user_config']['table_order']] ] );

    $('#'+str_datatable_id + '  tbody', zone_section).delegate("tr", "click", function(e){
        var aData   = dataTable_group_clusters.fnGetData(this);

        if (!aData){
            return true;
        }

        var cluster_id = aData[1];

        if ($.isEmptyObject(selected_group_clusters[zone_id])) {
            $('#you_selected_group_clusters'+str_zone_tab_id,  zone_section).show();
            $("#select_group_clusters"+str_zone_tab_id, zone_section).hide();
        }

        if(!$("td:first", this).hasClass('markrowchecked'))
        {
            $('input.check_item', this).attr('checked','checked');
            selected_group_clusters[zone_id][cluster_id] = 1;
            group_clusters_row_hash[zone_id][cluster_id] = this;
            $(this).children().each(function(){$(this).addClass('markrowchecked');});
            if ($('#tag_cluster_'+aData[1], $('div#selected_group_clusters', zone_section)).length == 0 ) {
                $('div#selected_group_clusters', zone_section).append('<span id="tag_cluster_'+aData[1]+'" class="radius label">'+aData[2]+' <span class="icon-remove blue"></span></span> ');
            }
        }
        else
        {
            $('input.check_item', this).removeAttr('checked');
            delete selected_group_clusters[zone_id][cluster_id];
            $(this).children().each(function(){$(this).removeClass('markrowchecked');});
            $('div#selected_group_clusters span#tag_cluster_'+cluster_id, zone_section).remove();
        }

        if ($.isEmptyObject(selected_group_clusters[zone_id])) {
            $('#you_selected_group_clusters'+str_zone_tab_id,  zone_section).hide();
            $('#select_group_clusters'+str_zone_tab_id, zone_section).show();
        }

        $('.alert-box', $('.group_cluster_select')).hide();

        return true;
    });

    $( "#selected_group_clusters span.icon-remove", zone_section ).live( "click", function() {
        $(this).parent().remove();
        var id = $(this).parent().attr("ID");

        var cluster_id=id.substring(12,id.length);
        delete selected_group_clusters[zone_id][cluster_id];
        $('td', group_clusters_row_hash[zone_id][cluster_id]).removeClass('markrowchecked');
        $('input.check_item', group_clusters_row_hash[zone_id][cluster_id]).removeAttr('checked');

        if ($.isEmptyObject(selected_group_clusters[zone_id])) {
            $('#you_selected_group_clusters'+str_zone_tab_id, zone_section).hide();
            $('#select_group_clusters'+str_zone_tab_id, zone_section).show();
        }
    });

    setupTips(zone_section);
}

function generate_group_resource_tab_content(str_zone_tab_id, str_datatable_id, zone_id){
    var html =
    '<div class="row">\
      <div class="four columns">\
        <label class="inline right" for="resources">' +  tr("Assign physical resources") + ':</label>\
      </div>\
      <div class="seven columns" style="text-align:center">\
        <input type="radio" name="'+str_zone_tab_id+'" id="'+str_zone_tab_id+'resources_all" value="all">'+ tr("All")+'&emsp;</input> \
        <input type="radio" name="'+str_zone_tab_id+'" id="'+str_zone_tab_id+'resources_cluster" value="cluster"> '+tr("Select clusters")+'</input> &emsp;\
        <input type="radio" name="'+str_zone_tab_id+'" id="'+str_zone_tab_id+'resources_none" value="none"> '+tr("None")+'</input> &emsp;\
      </div>\
      <div class="one columns">\
        <div class="tip">'+tr("For each OpenNebula Zone, you can assign cluster resources (set of physical hosts, datastores and virtual networks) to this group.")+'</div>\
      </div>\
    </div>\
    <div class="row">\
      <div class="ten columns centered">\
      <div id="req_type" class="group_cluster_select hidden">\
          <div class="row collapse ">\
            <div class="seven columns">\
             <button id="refresh_group_clusters_table_button_class'+str_zone_tab_id+'" type="button" class="refresh button small radius secondary"><i class="icon-refresh" /></button>\
            </div>\
            <div class="five columns">\
              <input id="'+str_zone_tab_id+'_search" type="text" placeholder="'+tr("Search")+'"/>\
            </div>\
          </div>\
          <table id="'+str_datatable_id+'" class="datatable twelve">\
            <thead>\
            <tr>\
              <th></th>\
              <th>' + tr("ID") + '</th>\
              <th>' + tr("Name") + '</th>\
              <th>' + tr("Hosts") + '</th>\
              <th>' + tr("VNets") + '</th>\
              <th>' + tr("Datastores") + '</th>\
            </tr>\
            </thead>\
            <tbody id="tbodyclusters">\
            </tbody>\
          </table>\
          <br>\
          <div id="selected_group_clusters">\
            <span id="select_group_clusters'+str_zone_tab_id+'" class="radius secondary label">'+tr("Please select one or more clusters from the list")+'</span> \
            <span id="you_selected_group_clusters'+str_zone_tab_id+'" class="radius secondary label hidden">'+tr("You selected the following clusters:")+'</span> \
          </div>\
          <br>\
      </div\
      </div>\
    </div>';

    $("#refresh_group_clusters_table_button_class"+str_zone_tab_id).die();
    $("#refresh_group_clusters_table_button_class"+str_zone_tab_id).live('click', function(){
        update_datatable_group_clusters($('table[id='+str_datatable_id+']').dataTable(), zone_id);
    });

    return html;
}

// TODO: Refactor? same function in templates-tab.js
function update_datatable_group_clusters(datatable, zone_id) {

   OpenNebula.Cluster.list_in_zone({
    data:{zone_id:zone_id},
    timeout: true,
    success: function (request, obj_list){
        var obj_list_array = [];

        $.each(obj_list,function(){
            //Grab table data from the obj_list
            obj_list_array.push(clusterElementArray(this));
        });

        updateView(obj_list_array, datatable);
    }
  });
};

// TODO: one array per zone
var selected_group_clusters = {};
var group_clusters_row_hash = {};

var add_resource_tab = function(zone_id, zone_name, dialog, id_suffix) {
    var str_zone_tab_id  = 'zone' + zone_id;
    var str_datatable_id = 'datatable_group_clusters_zone' + zone_id;

    if (id_suffix)
    {
      str_zone_tab_id += "_" + id_suffix;
      str_datatable_id += "_" + id_suffix;
    }

    selected_group_clusters[zone_id] = {};
    group_clusters_row_hash[zone_id] = {};

    // Append the new div containing the tab and add the tab to the list
    var html_tab_content = '<li id="'+str_zone_tab_id+'Tab" style="display: block;">'+
        generate_group_resource_tab_content(str_zone_tab_id, str_datatable_id, zone_id) +
        '</li>'
    $(html_tab_content).appendTo($("ul#group_zones_tabs_content", dialog));

    var a = $("<dd>\
        <a id='zone_tab"+str_zone_tab_id+"' href='#"+str_zone_tab_id+"'>"+zone_name+"</a>\
        </dd>").appendTo($("dl#group_zones_tabs", dialog));

    $(document).foundationTabs("set_tab", a);

    var zone_section = $('li#' +str_zone_tab_id+'Tab', dialog);
    setup_group_resource_tab_content(zone_id, zone_section, str_zone_tab_id, str_datatable_id, id_suffix);
};

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

//Prepares the dialog to create
function setupCreateGroupDialog(){
    dialogs_context.append('<div id="create_group_dialog"></div>');
    $create_group_dialog = $('#create_group_dialog',dialogs_context);
    var dialog = $create_group_dialog;

    dialog.html(create_group_tmpl);
    dialog.addClass("reveal-modal large max-height");

    setupTips($create_group_dialog);

    $('#create_group_reset_button').click(function(){
        $create_group_dialog.trigger('reveal:close');
        $create_group_dialog.remove();
        setupCreateGroupDialog();

        popUpCreateGroupDialog();
    });

    setupCustomAuthDialog(dialog);

    $('input#name', dialog).change(function(){
        var val = $(this).val();
        var dialog = $create_group_dialog;

        $('#admin_group_name',dialog).val(val + "-admin");
        $('#username',dialog).val(val + "-admin");
    });

    $('input#admin_group', dialog).change(function(){
        var dialog = $create_group_dialog;
        if ($(this).prop('checked')) {
            $('#admin_group_name',dialog).removeAttr("disabled");

            $('#admin_user',dialog).removeAttr("disabled");
            $('#admin_user',dialog).prop("checked", "true");

            enableAdminUser(dialog);

            $.each($('[id^="group_admin_res"]', dialog), function(){
                $(this).removeAttr("disabled");
            });
        } else {
            $('#admin_group_name',dialog).attr('disabled','disabled');
            $('#admin_user',dialog).attr('disabled','disabled');
            disableAdminUser(dialog);

            $.each($('[id^="group_admin_res"]', dialog), function(){
                $(this).attr('disabled', 'disabled');
            });
        }
    });

    $('input#admin_user', dialog).change(function(){
        var dialog = $create_group_dialog;
        if ($(this).prop('checked')) {
            enableAdminUser(dialog);
        } else {
            disableAdminUser(dialog);
        }
    });

    $('#admin_group_name',dialog).attr('disabled','disabled');
    $('#admin_user',dialog).attr('disabled','disabled');
    disableAdminUser(dialog);

    $.each($('[id^="group_res"]', dialog), function(){
        $(this).prop("checked", "true");
    });

    $.each($('[id^="group_admin_res"]', dialog), function(){
        $(this).attr('disabled', 'disabled');
        $(this).prop("checked", "true");
    });

    OpenNebula.Zone.list({
        timeout: true,
        success: function (request, obj_list){
            $.each(obj_list,function(){
                add_resource_tab(this.ZONE.ID, this.ZONE.NAME, dialog);
            });
        },
        error: onError
    });

    $('#create_group_form',dialog).submit(function(){
        var name = $('#name',this).val();

        var admin_group_name = null;
        var user_json = null;

        if ( $('#admin_group', this).prop('checked') ){
            admin_group_name = $('#admin_group_name', this).val();

            if ( $('#admin_user', this).prop('checked') ){
                user_json = buildUserJSON(this);    // from users-tab.js

                if (!user_json) {
                    notifyError(tr("User name and password must be filled in"));
                    return false;
                }
            }
        }

        var group_json = {
            "group" : {
                "name" : name
            }
        };

        if (admin_group_name){
            group_json['group']['admin_group'] = admin_group_name;
        }

        if (user_json){
            group_json["group"]["user"] = user_json["user"];
        }

        group_json['group']['resource_providers'] = [];

        $.each(selected_group_clusters, function(zone_id, zone_clusters) {
            var str_zone_tab_id = 'zone' + zone_id;

            var resource_selection = $("input[name='"+str_zone_tab_id+"']:checked").val();
            switch (resource_selection){
            case "all":
                // 10 is the special ID for ALL, see ClusterPool.h
                group_json['group']['resource_providers'].push(
                    {"zone_id" : zone_id, "cluster_id" : 10}
                );

                break;
            case "cluster":
                $.each(selected_group_clusters[zone_id], function(key, value) {
                    group_json['group']['resource_providers'].push(
                        {"zone_id" : zone_id, "cluster_id" : key}
                    );
                });

                break;
            default: // "none"

            }
        });

        var resources = "";
        var separator = "";

        $.each($('[id^="group_res"]:checked', dialog), function(){
            resources += (separator + $(this).val());
            separator = "+";
        });

        group_json['group']['resources'] = resources;

        if (admin_group_name){
            resources = "";
            separator = "";

            $.each($('[id^="group_admin_res"]:checked', dialog), function(){
                resources += (separator + $(this).val());
                separator = "+";
            });

            group_json['group']['admin_group_resources'] = resources;

            if ( $('#group_admin_res_user', dialog).prop("checked") ){
                group_json['group']['admin_manage_users'] = "YES";
            } else {
                group_json['group']['admin_manage_users'] = "NO";
            }
        }


        Sunstone.runAction("Group.create",group_json);
        $create_group_dialog.trigger("reveal:close");
        return false;
    });
}

function popUpCreateGroupDialog(){
    $create_group_dialog.reveal();
    $("input#name",$create_group_dialog).focus();
    return false;
}

// Add groups quotas dialog and calls common setup() in sunstone utils.
function setupGroupQuotasDialog(){
    dialogs_context.append('<div title="'+tr("Group quotas")+'" id="group_quotas_dialog"></div>');
    $group_quotas_dialog = $('#group_quotas_dialog',dialogs_context);
    var dialog = $group_quotas_dialog;
    dialog.html(group_quotas_tmpl);

    setupQuotasDialog(dialog);
}

function popUpGroupQuotasDialog(){
    popUpQuotasDialog($group_quotas_dialog, 'Group', groupElements())
}

//Prepares the autorefresh
function setGroupAutorefresh(){
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_groups);
        var  filter = $("#group_search").attr('value');
        if ((checked.length==0) && !filter){
            Sunstone.runAction("Group.autorefresh");
        }
    },INTERVAL+someTime());
}

$(document).ready(function(){
    var tab_name = 'groups-tab';

    if (Config.isTabEnabled(tab_name)) {
      dataTable_groups = $("#datatable_groups",main_tabs_context).dataTable({
          "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check",4,5,6] },
              { "sWidth": "35px", "aTargets": [0] },
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
      setGroupAutorefresh();

      initCheckAllBoxes(dataTable_groups);
      tableCheckboxesListener(dataTable_groups);
      infoListener(dataTable_groups, 'Group.showinfo');

      $('div#groups_tab div.legend_div').hide();
      $('div#groups_tab_non_admin div.legend_div').hide();

      dataTable_groups.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
})
