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

var create_group_tmpl =
'<div class="row">\
  <div class="large-12 columns">\
    <h3 id="create_group_header">'+tr("Create Group")+'</h3>\
    <h3 id="update_group_header">'+tr("Update Group")+'</h3>\
  </div>\
</div>\
<div class="reveal-body">\
  <form id="create_group_form" action="">\
    <div class="row">\
      <div class="columns large-5">\
          <label for="name">'+tr("Name")+':\
            <input type="text" name="name" id="name" />\
          </label>\
      </div>\
      <div class="columns large-7">\
          <dl class="tabs right-info-tabs text-center right" data-tab>\
               <dd class="active"><a href="#resource_views"><i class="fa fa-eye"></i><br>'+tr("Views")+'</a></dd>\
               <dd><a href="#resource_providers"><i class="fa fa-cloud"></i><br>'+tr("Resources")+'</a></dd>\
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
            '&emsp;<span class="tip">'+tr("This will add to the group template the selected views so users beloing to the group are able to use them")+'</span>\
          </p>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-12 columns">'+
            insert_views()
        +'</div>\
      </div>\
    </div>\
    <div id="resource_providers" class="content">\
        <div class="row">\
          <div class="large-12 columns">\
            <h5>' + tr("Zones") +'</h5>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
            <dl class="tabs" id="group_zones_tabs" data-tab></dl>\
            <div class="tabs-content group_zones_tabs_content"></div>\
          </div>\
        </div>\
    </div>\
    <div id="administrators" class=" content">\
        <div class="row">\
        <div class="large-6 columns">\
          <div class="row">\
            <div class="large-12 columns">\
              <input type="checkbox" id="admin_group" name="admin_group" value="YES" />\
              <label for="admin_group">'+tr("Create an administrator group")+'\
                <span class="tip">'+tr("This admin group will contain users with administrative privileges for the new regular group, not for all the resources in the OpenNebula cloud as the 'oneadmin' group users have.")+'</span>\
              </label>\
            </div>\
          </div>\
          <div class="row">\
            <div class="large-12 columns">\
              <label for="admin_group_name">'+tr("Group name")+'</label>\
              <input type="text" name="admin_group_name" id="admin_group_name" />\
            </div>\
          </div>\
        </div>\
        <div class="large-6 columns">\
          <div class="row">\
            <div class="large-12 columns">\
              <input type="checkbox" id="admin_user" name="admin_user" value="YES" />\
              <label for="admin_user">'+tr("Create an administrator user")+'\
                <span class="tip">'+tr("You can create now an administrator user that will be assigned to the new regular group, with the administrator group as a secondary one.")+'</span>\
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
            <p class="subheader">'
              +tr("Allow users in this group to create the following resources")+
              '&emsp;<span class="tip">'+tr("This will create new ACL Rules to define which virtual resources this group's users will be able to create. You can set different resources for the administrator group, and decide if the administrators will be allowed to create new users.")+'</span>\
            </p>\
          </div>\
        </div>\
        <div class="row">\
          <div class="large-12 columns">\
            <table class="dataTable" style="table-layout:fixed">\
              <thead><tr>\
                <th/>\
                <th>'+tr("VMs")+'</th>\
                <th>'+tr("VNets")+'</th>\
                <th>'+tr("Images")+'</th>\
                <th>'+tr("Templates")+'</th>\
                <th>'+tr("Documents")+'<span class="tip">'+tr("Documents are a special tool for general purposes, mainly by OneFlow. If you want to enable users of this group to use service composition via OneFlow, let it checked.")+'</span></th>\
                <th>'+tr("Users")+'</th>\
              </tr></thead>\
              <tbody>\
                <tr>\
                  <th>'+tr("Users")+'</th>\
                  <td><input type="checkbox" id="group_res_vm" name="group_res_vm" class="resource_cb" value="VM"></input></td>\
                  <td><input type="checkbox" id="group_res_net" name="group_res_net" class="resource_cb" value="NET"></input></td>\
                  <td><input type="checkbox" id="group_res_image" name="group_res_image" class="resource_cb" value="IMAGE"></input></td>\
                  <td><input type="checkbox" id="group_res_template" name="group_res_template" class="resource_cb" value="TEMPLATE"></input></td>\
                  <td><input type="checkbox" id="group_res_document" name="group_res_document" class="resource_cb" value="DOCUMENT"></input></td>\
                  <td/>\
                </tr>\
                <tr>\
                  <th>'+tr("Admins")+'</th>\
                  <td><input type="checkbox" id="group_admin_res_vm" name="group_admin_res_vm" class="resource_cb" value="VM"></input></td>\
                  <td><input type="checkbox" id="group_admin_res_net" name="group_admin_res_net" class="resource_cb" value="NET"></input></td>\
                  <td><input type="checkbox" id="group_admin_res_image" name="group_admin_res_image" class="resource_cb" value="IMAGE"></input></td>\
                  <td><input type="checkbox" id="group_admin_res_template" name="group_admin_res_template" class="resource_cb" value="TEMPLATE"></input></td>\
                  <td><input type="checkbox" id="group_admin_res_document" name="group_admin_res_document" class="resource_cb" value="DOCUMENT"></input></td>\
                  <td><input type="checkbox" id="group_admin_res_user" name="group_admin_res_user" class="resource_cb" value="USER"></input></td>\
                </tr>\
              </tbody>\
            </table>\
        </div>\
      </div>\
    </div>\
  </div>\
  <div class="reveal-footer">\
    <div class="form_buttons">\
      <button class="button radius right success" id="create_group_submit" value="Group.create">'+tr("Create")+'</button>\
       <button class="button right radius" type="submit" id="update_group_submit">' + tr("Update") + '</button>\
      <button class="button secondary radius" id="create_group_reset_button" type="reset" value="reset">'+tr("Reset")+'</button>\
    </div>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>\
  </form>\
</div>';

var group_quotas_tmpl = '<div class="row" class="subheader">\
  <div class="large-12 columns">\
    <h3 id="create_group_quotas_header">'+tr("Update Quota")+'</h3>\
  </div>\
</div>\
<div class="reveal-body">\
<form id="group_quotas_form" action="">'+
  quotas_tmpl +
  '<div class="reveal-footer">\
    <div class="form_buttons">\
        <button class="button radius right success" id="create_user_submit" type="submit" value="Group.set_quota">'+tr("Apply changes")+'</button>\
    </div>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>\
</div>';


var group_actions = {
    "Group.create" : {
        type: "create",
        call : OpenNebula.Group.create,
        callback : function(request, response) {
            // Reset the create wizard
            $create_group_dialog.foundation('reveal', 'close');
            $create_group_dialog.empty();
            setupCreateGroupDialog();

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

    "Group.autorefresh" : {
        type: "custom",
        call: function () {
            OpenNebula.Group.list({timeout: true, success: updateGroupsView,error: onError});
        }
    },

    "Group.refresh" : {
        type: "custom",
        call: function() {
          var tab = dataTable_groups.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("Group.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_groups);
            Sunstone.runAction("Group.list");
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
        call: popUpUpdateGroupDialog
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


    "Group.add_provider_action" : {
        type: "single",
        call: OpenNebula.Group.add_provider,
        callback: function(request) {
           Sunstone.runAction('Group.show',request.request.data[0][0]);
        },
        error: onError
    },

    "Group.del_provider_action" : {
        type: "single",
        call: OpenNebula.Group.del_provider,
        callback: function(request) {
          Sunstone.runAction('Group.show',request.request.data[0][0]);
        },
        error: onError
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
            Sunstone.runAction('Group.show',request.request.data[0]);
        },
        elements: groupElements
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
            Sunstone.runAction('Group.show',request.request.data[0]);
        },
        elements: groupElements
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
    buttons: group_buttons,
    tabClass: 'subTab',
    parentTab: 'system-tab',
    search_input: '<input id="group_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-users"></i> '+tr("Groups"),
    info_header: '<i class="fa fa-users"></i> '+tr("Group"),
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
          <th style="width:18%">'+tr("VMs")+'</th>\
          <th style="width:18%">'+tr("Memory")+'</th>\
          <th style="width:18%">'+tr("CPU")+'</th>\
        </tr>\
      </thead>\
      <tbody id="tbodygroups">\
      </tbody>\
    </table>'
};


Sunstone.addActions(group_actions);
Sunstone.addMainTab('groups-tab',groups_tab);
Sunstone.addInfoPanel("group_info_panel",group_info_panel);

function insert_views(){
  views_checks_str = ""
  var views_array = config['available_views'];
  for (var i = 0; i < views_array.length; i++)
  {
    views_checks_str = views_checks_str +
             '<input type="checkbox" id="group_view_'+views_array[i]+'" value="'+views_array[i]+'"/>' +
             '<label for="group_view_'+views_array[i]+'">'+views_array[i]+
             '</label>'
  }
  return views_checks_str;
}

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
    $(".total_groups").text(group_list.length);
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
             <div id="div_minus_rp" class="text-right">\
               <a id="div_minus_rp_a_'+provider.ZONE_ID+'" class="cluster_id_'+cluster_id+' group_id_'+group_info.ID+'" href="#"><i class="fa fa-trash-o"/></a>\
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
                                                 "Attributes") +
          '</div>\
        </div>'
      }

    var default_group_quotas = Quotas.default_quotas(info.DEFAULT_GROUP_QUOTAS);
    var vms_quota = Quotas.vms(info, default_group_quotas);
    var cpu_quota = Quotas.cpu(info, default_group_quotas);
    var memory_quota = Quotas.memory(info, default_group_quotas);
    var volatile_size_quota = Quotas.volatile_size(info, default_group_quotas);
    var image_quota = Quotas.image(info, default_group_quotas);
    var network_quota = Quotas.network(info, default_group_quotas);
    var datastore_quota = Quotas.datastore(info, default_group_quotas);

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


    var providers_tab = {
        title : tr("Providers"),
        icon: "fa-th",
        content :
        '<div class="">\
            <div class="large-6 columns">\
                <table id="info_user_table" class="dataTable extended_table">\
                    <thead>\
                        <tr>\
                            <th>' + tr("Zone ID") + '</th>\
                            <th>' + tr("Cluster ID") + '</th>\
                            <th class="text-right">\
                              <button id="add_rp_button" class="button tiny success radius" >\
                                <i class="fa fa-plus-circle"></i>\
                              </button>\
                            </th>\
                        </tr>\
                    </thead>\
                    <tbody>' +
                        fromJSONtoProvidersTable(info) +
                    '</tbody>\
                </table>\
            </div>\
        </div>'
    };

    Sunstone.updateInfoPanelTab("group_info_panel","group_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("group_info_panel","group_quotas_tab",quotas_tab);
    Sunstone.updateInfoPanelTab("group_info_panel","group_providers_tab",providers_tab);
    Sunstone.popUpInfoPanel("group_info_panel", 'groups-tab');


    $("#add_rp_button", $("#group_info_panel")).click(function(){
      setup_add_rp_dialog(info);
      $('#add_rp_dialog',dialogs_context).addClass("reveal-modal large max-height").attr("data-reveal", "");
      $('#add_rp_dialog',dialogs_context).foundation().foundation('reveal', 'open');

      return false;
    })
}


function setup_add_rp_dialog(group){
    dialogs_context.append('<div id="add_rp_dialog"></div>');

    var dialog = $('#add_rp_dialog',dialogs_context);

    dialog.html(
        '<div class="row">\
          <div class="large-12 columns">\
            <h3 id="create_rp_header" class="subheader">'+tr("Select Resource Providers")+'</h3>\
          </div>\
        </div>\
        <div class="reveal-body">\
            <div class="row">\
              <div class="large-12 columns">\
                <h5>' + tr("Zones") +'</h5>\
                <dl class="tabs" id="group_zones_tabs" data-tab>\
                </dl>\
                <div class="tabs-content group_zones_tabs_content">\
                </div>\
              </div>\
             </div>\
            <div class="reveal-footer">\
              <div class="form_buttons">\
                <button class="button radius right success" id="add_rp_submit">'+tr("Add")+'</button>\
                <button class="button secondary radius" id="add_rp_reset_button" type="reset" value="reset">'+tr("Reset")+'</button>\
              </div>\
            </div>\
        </div>\
        <a class="close-reveal-modal">&#215;</a>');

     $('#add_rp_submit').die();
     $('#add_rp_submit').live( "click", function() {

       $.each(selected_group_clusters, function(zone_id, zone_clusters) {
           var str_zone_tab_id = 'zone' + zone_id + "_add_rp";

           var providers_array=group.RESOURCE_PROVIDER

           if (!providers_array) {
              providers_array = new Array();
           } else if (!$.isArray(providers_array)) {
              var tmp_array   = new Array();
              tmp_array[0]    = providers_array;
              providers_array = tmp_array;
           }

           var resource_selection = $("input[name='"+str_zone_tab_id+"']:checked", dialog).val();
           switch (resource_selection){
           case "all":
               // 10 is the special ID for ALL, see ClusterPool.h
              extra_param = {
                   "zone_id" : zone_id,
                   "cluster_id" : 10
               }

                add_it = true;

                $.each(providers_array, function(index, provider){
                  if (provider.ZONE_ID==zone_id && provider.CLUSTER_ID == 10)
                  {
                    add_it = false;
                  }
                });

                if (add_it)
                {
                  Sunstone.runAction("Group.add_provider_action",
                                     group.ID,
                                     extra_param);
                }

              break;
           case "cluster":
               $.each(selected_group_clusters[zone_id], function(key, value) {
                 extra_param =
                 {
                     "zone_id" : zone_id,
                     "cluster_id" : key
                 }

                add_it = true;

                if(providers_array)
                {
                  $.each(providers_array, function(index, provider){
                    if (provider.ZONE_ID==zone_id && provider.CLUSTER_ID == key)
                    {
                      add_it = false;
                    }
                  });
                }

                if (add_it)
                {
                  Sunstone.runAction("Group.add_provider_action",
                                     group.ID,
                                     extra_param);
                }
               });

               break;
           default: // "none"

           }
       });

     dialog.foundation('reveal', 'close');
     dialog.html("");

    });

    $("#add_rp_reset_button", dialog).die();
    $("#add_rp_reset_button", dialog).live("click", function(){
      $('#add_rp_dialog',dialog).remove();
      setup_add_rp_dialog(group);
      $('#add_rp_dialog').addClass("reveal-modal large max-height").attr("data-reveal", "");
      $('#add_rp_dialog').foundation().foundation('reveal', 'open');
    });

    OpenNebula.Zone.list({
      timeout: true,
      success: function (request, obj_list){
          $.each(obj_list,function(){
              add_resource_tab(this.ZONE.ID, this.ZONE.NAME, dialog, "add_rp", group);
          });
      },
      error: onError
    });
}

function setup_group_resource_tab_content(zone_id, zone_section, str_zone_tab_id, str_datatable_id, id_suffix, group) {
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
    update_datatable_group_clusters(dataTable_group_clusters, zone_id, group);

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
            if ($('#tag_cluster_'+aData[1], $('.selected_group_clusters', zone_section)).length == 0 ) {
                $('.selected_group_clusters', zone_section).append('<span id="tag_cluster_'+aData[1]+'" class="radius label">'+aData[2]+' <span class="fa fa-times blue"></span></span> ');
            }
        }
        else
        {
            $('input.check_item', this).removeAttr('checked');
            delete selected_group_clusters[zone_id][cluster_id];
            $(this).children().each(function(){$(this).removeClass('markrowchecked');});
            $('.selected_group_clusters span#tag_cluster_'+cluster_id, zone_section).remove();
        }

        if ($.isEmptyObject(selected_group_clusters[zone_id])) {
            $('#you_selected_group_clusters'+str_zone_tab_id,  zone_section).hide();
            $('#select_group_clusters'+str_zone_tab_id, zone_section).show();
        }

        $('.alert-box', $('.group_cluster_select')).hide();

        return true;
    });

    $( '#' +str_zone_tab_id+'Tab .fa-times' ).live( "click", function() {
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

function generate_group_resource_tab_content(str_zone_tab_id, str_datatable_id, zone_id, group){
    var html =
    '<div class="row">\
      <div class="large-12 columns">\
          <p class="subheader">' +  tr("Assign physical resources") + '\
            &emsp;<span class="tip">'+tr("For each OpenNebula Zone, you can assign cluster resources (set of physical hosts, datastores and virtual networks) to this group.")+'</span>\
          </p>\
      </div>\
    </div>\
    <div class="row">\
      <div class="large-12 columns">\
          <input type="radio" name="'+str_zone_tab_id+'" id="'+str_zone_tab_id+'resources_all" value="all"><label for="'+str_zone_tab_id+'resources_all">'+tr("All")+'</label>\
          <input type="radio" name="'+str_zone_tab_id+'" id="'+str_zone_tab_id+'resources_cluster" value="cluster"><label for="'+str_zone_tab_id+'resources_cluster">'+tr("Select clusters")+'</label>\
          <input type="radio" name="'+str_zone_tab_id+'" id="'+str_zone_tab_id+'resources_none" value="none"><label for="'+str_zone_tab_id+'resources_none">'+tr("None")+'</label>\
      </div>\
    </div>\
    <div class="row">\
      <div class="large-12 columns">\
        <div id="req_type" class="group_cluster_select hidden">\
            <div class="row collapse ">\
              <div class="large-9 columns">\
               <button id="refresh_group_clusters_table_button_class'+str_zone_tab_id+'" type="button" class="refresh button small radius secondary"><i class="fa fa-refresh" /></button>\
              </div>\
              <div class="large-3 columns">\
                <input id="'+str_zone_tab_id+'_search" class="search" type="text" placeholder="'+tr("Search")+'"/>\
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
            <div class="selected_group_clusters">\
              <span id="select_group_clusters'+str_zone_tab_id+'" class="radius secondary label">'+tr("Please select one or more clusters from the list")+'</span> \
              <span id="you_selected_group_clusters'+str_zone_tab_id+'" class="radius secondary label hidden">'+tr("You selected the following clusters:")+'</span> \
            </div>\
            <br>\
        </div\
      </div>\
    </div>';

    $("#refresh_group_clusters_table_button_class"+str_zone_tab_id).die();
    $("#refresh_group_clusters_table_button_class"+str_zone_tab_id).live('click', function(){
        update_datatable_group_clusters($('table[id='+str_datatable_id+']').dataTable(), zone_id, group);
    });

    return html;
}

// TODO: Refactor? same function in templates-tab.js
function update_datatable_group_clusters(datatable, zone_id, group) {

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

        if (group && group.RESOURCE_PROVIDER)
        {
          var rows = datatable.fnGetNodes();
          providers_array=group.RESOURCE_PROVIDER

          if (!$.isArray(providers_array))
          {
            var tmp_array   = new Array();
            tmp_array[0]    = providers_array;
            providers_array = tmp_array;
          }

          $.each(providers_array, function(index, provider){
            if (provider.ZONE_ID==zone_id)
            {
              for(var j=0;j<rows.length;j++)
              {
                var current_row    = $(rows[j]);
                var row_cluster_id = $(rows[j]).find("td:eq(1)").html();

                if (provider.CLUSTER_ID == row_cluster_id || provider.CLUSTER_ID == "10")
                {
                  current_row.click();
                }
              }
              if (provider.CLUSTER_ID == "10")
                $('#zone'+zone_id+'_add_rpresources_all').click();
              else
                $('#zone'+zone_id+'_add_rpresources_cluster').click();
            }
          });
        }
    }
  });
};

// TODO: one array per zone
var selected_group_clusters = {};
var group_clusters_row_hash = {};

var add_resource_tab = function(zone_id, zone_name, dialog, id_suffix, group) {
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
    var html_tab_content = '<div id="'+str_zone_tab_id+'Tab" class="content">'+
        generate_group_resource_tab_content(str_zone_tab_id, str_datatable_id, zone_id, group) +
        '</div>'
    $(html_tab_content).appendTo($(".group_zones_tabs_content", dialog));

    var a = $("<dd>\
        <a id='zone_tab"+str_zone_tab_id+"' href='#"+str_zone_tab_id+"Tab'>"+zone_name+"</a>\
        </dd>").appendTo($("dl#group_zones_tabs", dialog));

    // TODOO
    //$(document).foundationTabs("set_tab", a);
    $('a', a).click();

    var zone_section = $('#' +str_zone_tab_id+'Tab', dialog);
    setup_group_resource_tab_content(zone_id, zone_section, str_zone_tab_id, str_datatable_id, id_suffix, group);
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
    dialog.addClass("reveal-modal large max-height").attr("data-reveal", "");
    $(document).foundation();

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
        var user_json        = null;

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

        group_json['group']['views'] = [];

        $.each($('[id^="group_view"]:checked', dialog), function(){
            group_json['group']['views'].push($(this).val());
        });


        Sunstone.runAction("Group.create",group_json);
        return false;
    });
}

function popUpCreateGroupDialog(){
    $create_group_dialog.foundation().foundation('reveal', 'open');
    $("input#name",$create_group_dialog).focus();

    // Activate create button
    $('#create_group_submit',$create_group_dialog).show();
    $('#update_group_submit',$create_group_dialog).hide();
    $('#create_group_header',$create_group_dialog).show();
    $('#update_group_header',$create_group_dialog).hide();

    return false;
}

function popUpUpdateGroupDialog(){
    $create_group_dialog.foundation().foundation('reveal', 'open');

    // Activate update button
    $('#create_group_submit',$create_group_dialog).hide();
    $('#update_group_submit',$create_group_dialog).show();
    $('#create_group_header',$create_group_dialog).hide();
    $('#update_group_header',$create_group_dialog).show();
    
    // Remove unwanted tabs (only leave )

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
      infoListener(dataTable_groups, 'Group.show');

      $('div#groups_tab div.legend_div').hide();
      $('div#groups_tab_non_admin div.legend_div').hide();

      dataTable_groups.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
})
