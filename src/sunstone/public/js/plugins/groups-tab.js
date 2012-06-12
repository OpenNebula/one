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

var groups_tab_content = '\
<h2>'+tr("Groups")+'</h2>\
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
        error: onError,
    },

    // "Group.showinfo" : {
    //     type: "custom",
    //     call: updateGroupInfo
    // },

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
    "Group.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#groups_tab div.legend_div').slideToggle();
        }
    },
}

var group_buttons = {
    "Group.refresh" : {
        type: "image",
        text: tr("Refresh list"),
        img: "images/Refresh-icon.png"
    },
    "Group.create_dialog" : {
        type: "create_dialog",
        text: tr("+ New Group")
    },
    // "Group.chown" : {
    //     type: "confirm_with_select",
    //     text: "Change group owner",
    //     select: function(){return users_select},
    //     tip: "Select the new group owner:",
    //     condition : True
    // },

    "Group.delete" : {
        type: "confirm",
        text: tr("Delete")
    },
    "Group.help" : {
        type: "action",
        text: '?',
        alwaysActive: true
    }
};

var groups_tab = {
    title: tr("Groups"),
    content: groups_tab_content,
    buttons: group_buttons,
    tabClass: 'subTab',
    parentTab: 'system_tab'
};

Sunstone.addActions(group_actions);
Sunstone.addMainTab('groups_tab',groups_tab);

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

    return [
        '<input class="check_item" type="checkbox" id="group_'+group.ID+'" name="selected_items" value="'+group.ID+'"/>',
        group.ID,
        group.NAME,
        users_str ];
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
    updateDashboard("groups",group_list);
    updateSystemDashboard("groups",group_list);
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
            { "sWidth": "35px", "aTargets": [1] }
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    dataTable_groups.fnClearTable();
    addElement([
        spinner,
        '','',''],dataTable_groups);

    Sunstone.runAction("Group.list");
    setupCreateGroupDialog();
    setGroupAutorefresh();

    initCheckAllBoxes(dataTable_groups);
    tableCheckboxesListener(dataTable_groups);
    infoListener(dataTable_groups);

    $('div#groups_tab div.legend_div').hide();
})
