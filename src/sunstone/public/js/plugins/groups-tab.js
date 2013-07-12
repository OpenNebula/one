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
      <hr>\
      <div class="form_buttons">\
        <button class="button radius right success" id="create_group_submit" value="Group.create">'+tr("Create")+'</button>\
        <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
      </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>';

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
        callback : addGroupElement,
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
function updateGroupsView(request, group_list){
    group_list_json = group_list;
    var group_list_array = [];

    $.each(group_list,function(){
        group_list_array.push(groupElementArray(this));
    });
    updateView(group_list_array,dataTable_groups);
    updateGroupSelect(group_list);

    // Dashboard info
    $("#total_groups", $dashboard).text(group_list.length);

    var form = $("#group_form");

    $("#total_groups", form).text(group_list.length);
}

function updateGroupInfo(request,group){
    var info = group.GROUP;

    var  default_group_quotas = Quotas.default_quotas(info.DEFAULT_GROUP_QUOTAS);
    var quotas_tab_html = '<div class="four columns">' + Quotas.vms(info, default_group_quotas) + '</div>';
    quotas_tab_html += '<div class="four columns">' + Quotas.cpu(info, default_group_quotas) + '</div>';
    quotas_tab_html += '<div class="four columns">' + Quotas.memory(info, default_group_quotas) + '</div>';
    quotas_tab_html += '<br><br>';
    quotas_tab_html += '<div class="six columns">' + Quotas.image(info, default_group_quotas) + '</div>';
    quotas_tab_html += '<div class="six columns">' + Quotas.network(info, default_group_quotas) + '</div>';
    quotas_tab_html += '<br><br>';
    quotas_tab_html += '<div class="twelve columns">' + Quotas.datastore(info, default_group_quotas) + '</div>';

    var quotas_tab = {
        title : tr("Quotas"),
        content : quotas_tab_html
    };

    Sunstone.updateInfoPanelTab("group_info_panel","group_quotas_tab",quotas_tab);
    Sunstone.popUpInfoPanel("group_info_panel", 'groups-tab');


    $("#group_info_panel_refresh", $("#group_info_panel")).click(function(){
      $(this).html(spinner);
      Sunstone.runAction('Group.showinfo', info.ID);
    })

    //preload acct
    //loadAccounting('Group', info.ID, group_acct_graphs);

}



//Prepares the dialog to create
function setupCreateGroupDialog(){
    dialogs_context.append('<div title=\"'+tr("Create group")+'\" id="create_group_dialog"></div>');
    $create_group_dialog = $('#create_group_dialog',dialogs_context);
    var dialog = $create_group_dialog;

    dialog.html(create_group_tmpl);
    dialog.addClass("reveal-modal");

    $('#create_group_form',dialog).submit(function(){
        var name=$('#name',this).val();
        var group_json = { "group" : { "name" : name }};
        Sunstone.runAction("Group.create",group_json);
        $create_group_dialog.trigger("reveal:close");
        return false;
    });
}

function popUpCreateGroupDialog(){
    $create_group_dialog.reveal();
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
    }
})
