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
<h2><i class="icon-group"></i> '+tr("Groups")+'</h2>\
<form id="group_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_groups" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">'+tr("All")+'</input></th>\
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Name")+'</th>\
      <th>'+tr("Users")+'</th>\
      <th>'+tr("VMs")+'</th>\
      <th>'+tr("Used memory")+'</th>\
      <th>'+tr("Used CPU")+'</th>\
    </tr>\
  </thead>\
  <tbody id="tbodygroups">\
  </tbody>\
</table>\
<div class="legend_div">\
  <span>?</span>\
<p class="legend_p">\
'+tr("Tip: Refresh the list if it only shows user ids in the Users column.")+'\
</p>\
</div>\
</form>';

var create_group_tmpl =
'<form id="create_group_form" action="">\
  <fieldset style="border:none;">\
     <div>\
        <label for="name">'+tr("Group name")+':</label>\
        <input type="text" name="name" id="name" /><br />\
      </div>\
  </fieldset>\
  <fieldset>\
      <div class="form_buttons">\
        <button class="button" id="create_group_submit" value="Group.create">'+tr("Create")+'</button>\
        <button class="button" type="reset" value="reset">'+tr("Reset")+'</button>\
      </div>\
  </fieldset>\
</form>';

var group_quotas_tmpl = '<form id="group_quotas_form" action="">\
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
      <div class="form_buttons">\
           <button class="button" type="submit" value="Group.set_quota">'+tr("Apply changes")+'</button>\
      </div>\
</fieldset>\
</form>';


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

    // "Group.chown" : {
    //     type: "multiple",
    //     call : OpenNebula.Group.chown,
    //     callback : updateGroupElement,
    //     elements: function() { return getSelectedNodes(dataTable_groups); },
    //     error : onError,
    //     notify:true
    // },

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
            plot_graph(response,'#group_acct_tab','group_acct_', info);
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
        text: '<i class="icon-refresh icon-large">',
        alwaysActive: true
    },
    "Group.create_dialog" : {
        type: "create_dialog",
        text: tr("+ New Group"),
        condition: mustBeAdmin
    },
    // "Group.chown" : {
    //     type: "confirm_with_select",
    //     text: "Change group owner",
    //     select: function(){return users_select},
    //     tip: "Select the new group owner:",
    //     condition : True
    // },
    "Group.quotas_dialog" : {
        type : "action",
        text : tr("Update quotas"),
        condition: mustBeAdmin
    },
    "Group.delete" : {
        type: "confirm",
        text: tr("Delete"),
        condition: mustBeAdmin
    },
    "Group.help" : {
        type: "action",
        text: '?',
        alwaysActive: true
    }
};

var group_info_panel = {
    "group_info_tab" : {
        title: tr("Group information"),
        content:""
    },
    "group_acct_tab" : {
        title: tr("Historical usages"),
        content: ""
    }
};

var groups_tab = {
    title: tr("Groups"),
    content: groups_tab_content,
    buttons: group_buttons,
    tabClass: 'subTab',
    parentTab: 'system_tab',
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


SunstoneMonitoringConfig['GROUP'] = {
    plot: function(monitoring){
        if (!mustBeAdmin()) return;
        $('#totalGroups', $dashboard).text(monitoring['totalGroups'])
    },
    monitor: {
        "totalGroups" : {
            operation: SunstoneMonitoring.ops.totalize
        }
    }
}

Sunstone.addActions(group_actions);
Sunstone.addMainTab('groups_tab',groups_tab);
Sunstone.addMainTab('groups_tab_non_admin',groups_tab_non_admin);
Sunstone.addInfoPanel("group_info_panel",group_info_panel);

function groupElements(){
    return getSelectedNodes(dataTable_groups);
}

function groupElementArray(group_json){
    var group = group_json.GROUP;

    var users_str="";
    if (group.USERS.ID &&
        group.USERS.ID.constructor == Array){
        for (var i=0; i<group.USERS.ID.length; i++){
            users_str+=getUserName(group.USERS.ID[i])+', ';
        };
        users_str=users_str.slice(0,-2);
    } else if (group.USERS.ID) {
        users_str=getUserName(group.USERS.ID);
    };

    var vms = "-";
    var memory = "-";
    var cpu = "-";

    if (!$.isEmptyObject(group.VM_QUOTA)){
        vms = group.VM_QUOTA.VM.VMS_USED;
        memory = group.VM_QUOTA.VM.MEMORY_USED+' MB';
        cpu = group.VM_QUOTA.VM.CPU_USED;
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
    SunstoneMonitoring.monitor('GROUP', group_list)
    if (mustBeAdmin())
        updateSystemDashboard("groups",group_list);
}

function updateGroupInfo(request,group){
    var info = group.GROUP;

    var info_tab_html = '\
        <table id="info_group_table" class="info_table" style="width:80%">\
            <thead>\
               <tr><th colspan="2">' + tr("Group information") + ' - '+info.NAME+'</th></tr>\
            </thead>\
            <tbody>\
            <tr>\
                <td class="key_td">' + tr("ID") + '</td>\
                <td class="value_td">'+info.ID+'</td>\
            </tr>\
            </tbody>\
         </table>\
         <table class="info_table" style="width:80%;margin-top:0;margin-bottom:0;">\
            <thead>\
               <tr><th colspan="2">' + tr("Quota information") +'</th></tr>\
            </thead>\
            <tbody><tr><td class="key_td"></td><td class="value_td"></td></tr></tbody>\
         </table>';

    if (!$.isEmptyObject(info.VM_QUOTA))
        info_tab_html += '<table class="info_table" style="width:70%;margin-top:0;margin-left:40px;">\
            <tbody>'+prettyPrintJSON(info.VM_QUOTA)+'</tbody>\
          </table>'

    if (!$.isEmptyObject(info.DATASTORE_QUOTA))
        info_tab_html += '<table class="info_table" style="width:70%;margin-top:0;margin-left:40px;%">\
            <tbody>'+prettyPrintJSON(info.DATASTORE_QUOTA)+'</tbody>\
          </table>'

    if (!$.isEmptyObject(info.IMAGE_QUOTA))
        info_tab_html += '<table class="info_table" style="width:70%;margin-top:0;margin-left:40px;">\
            <tbody>'+prettyPrintJSON(info.IMAGE_QUOTA)+'</tbody>\
          </table>';

    if (!$.isEmptyObject(info.NETWORK_QUOTA))
        info_tab_html += '<table class="info_table" style="width:70%;margin-top:0;margin-left:40px;">\
            <tbody>'+prettyPrintJSON(info.NETWORK_QUOTA)+'</tbody>\
          </table>';

    var info_tab = {
        title : tr("Group information"),
        content : info_tab_html
    };


   var acct_tab = {
        title : tr("Historical usages"),
        content : '<div><table class="info_table" style="margin-bottom:0">\
  <tr>\
    <td class="key_td"><label for="from">'+tr('From / to')+'</label></td>\
    <td class="value_td">\
       <input type="text" id="group_acct_from" name="from"/>\
       <input type="text" id="group_acct_to" name="to"/>\
       <button id="group_acct_date_ok"><i class="icon-ok"></i></button>\
    </td>\
  </tr>\
<!--\
  <tr>\
    <td class="key_td"><label for="from">'+tr('Meters')+'</label></td>\
    <td class="value_td">\
       <select style="width:173px" id="group_acct_meter1" name="meter1">\
       </select>\
       <select style="width:173px" id="group_acct_meter2" name="meter2">\
       </select>\
    </td>\
  </tr>\
-->\
</table></div>' + generateMonitoringDivs(group_acct_graphs, "group_acct_")
    };

    Sunstone.updateInfoPanelTab("group_info_panel","group_info_tab",info_tab);
    Sunstone.updateInfoPanelTab("group_info_panel","group_acct_tab",acct_tab);
    Sunstone.popUpInfoPanel("group_info_panel");


    //Enable datepicker
    var info_dialog = $('div#group_acct_tab');
    $("#group_acct_from", info_dialog).datepicker({
        defaultDate: "-1d",
        changeMonth: true,
        numberOfMonths: 1,
        dateFormat: "dd/mm/yy",
        defaultDate: '-1',
        onSelect: function( selectedDate ) {
            $( "#group_acct_to", info_dialog).datepicker("option",
                                                         "minDate",
                                                         selectedDate );
        }
    });
    $("#group_acct_from", info_dialog).datepicker('setDate', '-1');

    $("#group_acct_to", info_dialog).datepicker({
        defaultDate: "0",
        changeMonth: true,
        numberOfMonths: 1,
        dateFormat: "dd/mm/yy",
        maxDate: '+1',
        onSelect: function( selectedDate ) {
            $( "#group_acct_from", info_dialog).datepicker( "option",
                                                            "maxDate",
                                                            selectedDate );
        }
    });
    $("#group_acct_to", info_dialog).datepicker('setDate', 'Now');

    //Listen to set date button
    $('button#group_acct_date_ok', info_dialog).click(function(){
        var from = $("#group_acct_from", info_dialog).val();
        var to = $("#group_acct_to", info_dialog).val();

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

        loadAccounting('Group', info.ID, group_acct_graphs,
                       { start : start, end: end });
        return false;
    });

    //preload acct
    loadAccounting('Group', info.ID, group_acct_graphs);

}



//Prepares the dialog to create
function setupCreateGroupDialog(){
    dialogs_context.append('<div title=\"'+tr("Create group")+'\" id="create_group_dialog"></div>');
    $create_group_dialog = $('#create_group_dialog',dialogs_context);
    var dialog = $create_group_dialog;

    dialog.html(create_group_tmpl);
    dialog.dialog({
        autoOpen: false,
        modal: true,
        width: 400
    });

    $('button',dialog).button();

    $('#create_group_form',dialog).submit(function(){
        var name=$('#name',this).val();
        var group_json = { "group" : { "name" : name }};
        Sunstone.runAction("Group.create",group_json);
        $create_group_dialog.dialog('close');
        return false;
    });
}

function popUpCreateGroupDialog(){
    $create_group_dialog.dialog('open');
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
        var  filter = $("#datatable_groups_filter input",dataTable_groups.parents("#datatable_groups_wrapper")).attr('value');
        if (!checked.length && !filter.length){
            Sunstone.runAction("Group.autorefresh");
        }
    },INTERVAL+someTime());
}

$(document).ready(function(){
    dataTable_groups = $("#datatable_groups",main_tabs_context).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "sPaginationType": "full_numbers",
        "bAutoWidth":false,
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "35px", "aTargets": [1,4,5,6] }
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    dataTable_groups.fnClearTable();
    addElement([
        spinner,
        '','','','','',''],dataTable_groups);

    Sunstone.runAction("Group.list");
    setupCreateGroupDialog();
    setupGroupQuotasDialog();
    setGroupAutorefresh();

    initCheckAllBoxes(dataTable_groups);
    tableCheckboxesListener(dataTable_groups);
    infoListener(dataTable_groups, 'Group.showinfo');

    $('div#groups_tab div.legend_div').hide();
    $('div#groups_tab_non_admin div.legend_div').hide();
})
