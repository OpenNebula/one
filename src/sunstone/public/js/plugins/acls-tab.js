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

/*ACLs tab plugin*/
var dataTable_acls;
var $create_acl_dialog;

var acls_tab_content = '\
<h2>'+tr("Access Control Lists")+'</h2>\
<form id="acl_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_acls" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">'+tr("All")+'</input></th>\
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Applies to")+'</th>\
      <th>'+tr("Affected resources")+'</th>\
      <th>'+tr("Resource ID / Owned by")+'</th>\
      <th>'+tr("Allowed operations")+'</th>\
      <th>'+tr("ACL String")+'</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyaclss">\
  </tbody>\
</table>\
<div class="legend_div">\
  <span>?</span>\
  <p class="legend_p">\
'+tr("This table shows the ACLs rules broken down to easier the reading and meaning of each one. You can show the ACL original string by clicking on Show/Hide columns.")+'\
  </p>\
</div>\
</form>';

var create_acl_tmpl =
'<form id="create_acl_form" action="">\
  <fieldset>\
        <div>\
                <label for="applies">'+tr("This rule applies to")+':</label>\
                <select name="applies" id="applies"></select>\
                <div class="clear"></div>\
                <label style="height:11em">'+tr("Affected resources")+':</label>\
                <input type="checkbox" name="res_host" class="resource_cb" value="HOST">'+tr("Hosts")+'</input><br />\
                <input type="checkbox" name="res_cluster" class="resource_cb" value="CLUSTER">'+tr("Clusters")+'</input><br />\
                <input type="checkbox" name="res_datastore" class="resource_cb" value="DATASTORE">'+tr("Datastores")+'</input><br />\
                <input type="checkbox" name="res_vm" class="resource_cb" value="VM">'+tr("Virtual Machines")+'</input><br />\
                <input type="checkbox" name="res_net" class="resource_cb" value="NET">'+tr("Virtual Networks")+'</input><br />\
                <input type="checkbox" name="res_image" class="resource_cb" value="IMAGE">'+tr("Images")+'</input><br />\
                <input type="checkbox" name="res_template" class="resource_cb" value="TEMPLATE">'+tr("Templates")+'</input><br />\
                <input type="checkbox" name="res_user" class="resource_cb" value="USER">'+tr("Users")+'</input><br />\
                <input type="checkbox" name="res_group" class="resource_cb" value="GROUP">'+tr("Groups")+'</input><br />\
                <div class="clear"></div>\
                <label for="mode_select" style="height:3em;">'+tr("Resource subset")+':</label>\
                <input type="radio" class="res_subgroup" name="mode_select" value="*" id="res_subgroup_all">'+tr("All")+'</input><br />\
                <input type="radio" class="res_subgroup" name="mode_select" value="res_id" id="res_subgroup_id">'+tr("Specific ID")+'</input><br />\
                <input type="radio" class="res_subgroup" name="mode_select" value="belonging_to" id="res_subgroup_group">'+tr("Owned by group")+'</input><br />\
                <div class="clear"></div>\
                <label for="res_id">'+tr("Resource ID")+':</label>\
                <input type="text" name="res_id" id="res_id"></input>\
                <div class="clear"></div>\
                <label for="belonging_to">'+tr("Group")+':</label>\
                <select name="belonging_to" id="belonging_to"></select>\
                <div class="clear"></div>\
                <label style="height:5em;">'+tr("Allowed operations")+':</label>\
                <input type="checkbox" name="right_delete" class="right_cb" value="USE">'+tr("Use")+'</input><br />\
                <input type="checkbox" name="right_use" class="right_cb" value="MANAGE">'+tr("Manage")+'</input><br />\
                <input type="checkbox" name="right_manage" class="right_cb" value="ADMIN">'+tr("Administrate")+'</input><br />\
                <input type="checkbox" name="right_create" class="right_cb" value="CREATE">'+tr("Create")+'</input><br />\
                <div class="clear"></div>\
                <label for="acl_preview">'+tr("ACL String preview")+':</label>\
                <input type="text" name="acl_preview" id="acl_preview" style="width:400px;"></input>\
        </div>\
        </fieldset>\
        <fieldset>\
        <div class="form_buttons">\
                <button class="button" id="create_acl_submit" value="Acl.create">'+tr("Create")+'</button>\
                <button class="button" type="reset" value="reset">'+tr("Reset")+'</button>\
        </div>\
</fieldset>\
</form>';

var acl_actions = {
    "Acl.create" : {
        type: "create",
        call: OpenNebula.Acl.create,
        callback: function(){
            Sunstone.runAction("Acl.list");
        },
        error: onError,
        notify: true
    },

    "Acl.create_dialog" : {
        type: "custom",
        call: popUpCreateAclDialog
    },

    "Acl.list" : {
        type: "list",
        call: OpenNebula.Acl.list,
        callback: updateAclsView,
        error: onError
    },

    "Acl.refresh" : {
        type: "custom",
        call: function () {
            waitingNodes(dataTable_acls);
            Sunstone.runAction("Acl.list");
        }
    },

    "Acl.autorefresh" : {
        type: "custom",
        call: function(){
            OpenNebula.Acl.list({
                timeout: true,
                success: updateAclsView,
                error: onError
            });
        }
    },

    "Acl.delete" : {
        type: "multiple",
        call: OpenNebula.Acl.del,
        callback: deleteAclElement,
        elements: aclElements,
        error: onError,
        notify: true
    },

    "Acl.help" : {
        type: "custom",
        call: function() {
            hideDialog();
            $('div#acls_tab div.legend_div').slideToggle();
        }
    },
}

var acl_buttons = {
    "Acl.refresh" : {
        type: "image",
        text: tr("Refresh list"),
        img: "images/Refresh-icon.png"
    },
    "Acl.create_dialog" : {
        type: "create_dialog",
        text: tr("+ New")
    },
    "Acl.delete" : {
        type: "confirm",
        text: tr("Delete")
    },
    "Acl.help" : {
        type: "action",
        text: '?',
        alwaysActive: true
    }

}

var acls_tab = {
    title: tr("ACLs"),
    content: acls_tab_content,
    buttons: acl_buttons,
    tabClass: 'subTab',
    parentTab: 'system_tab'
}

Sunstone.addActions(acl_actions);
Sunstone.addMainTab('acls_tab',acls_tab);

//Returns selected elements on the acl datatable
function aclElements(){
    return getSelectedNodes(dataTable_acls);
}

//Receives a segment of an ACL and translates:
// * -> All
// @1 -> Group 1 (tries to translate "1" into group name)
// #1 -> User 1 (tries to translate "1" into username)
//Translation of usernames and groupnames depends on
//group and user plugins tables.
function parseUserAcl(user){
    var user_str="";
    if (user[0] == '*'){
        user_str = tr("All");
    } else {
        if (user[0] == '#'){
            user_str=tr("User")+" ";
            user_str+= getUserName(user.substring(1));
        }
        else if (user[0] == '@'){
            user_str=tr("Group ");
            user_str+= getGroupName(user.substring(1));
        };
    };
    return user_str;
}

//Similar to above, but #1 means resource with "ID 1"
function parseResourceAcl(user){
    var user_str="";
    if (user[0] == '*'){
        user_str = tr("All");
    } else {
        if (user[0] == '#'){
            user_str=tr("ID")+" ";
            user_str+= user.substring(1);
        }
        else if (user[0] == '@'){
            user_str=tr("Group")+" ";
            user_str+= getGroupName(user.substring(1));
        };
    };
    return user_str;
}

//Parses a full ACL string, and translates it into
//a legible array
//to be put in the datatable fields.
function parseAclString(string) {
    var space_split = string.split(' ');
    var user = space_split[0];
    var resources = space_split[1];
    var rights = space_split[2];

    //User
    var user_str=parseUserAcl(user);


    //Resources
    var resources_str="";
    var resources_array = resources.split('/');
    var belonging_to = parseResourceAcl(resources_array[1]);
    resources_array = resources_array[0].split('+');
    for (var i=0; i<resources_array.length;i++){
        switch (resources_array[i]){
        case "HOST":
            resources_str+=tr("Hosts")+", ";
            break;
        case "VM":
            resources_str+=tr("Virtual Machines")+", ";
            break;
        case "NET":
            resources_str+=tr("Virtual Networks")+", ";
            break;
        case "IMAGE":
            resources_str+=(tr("Images")+", ");
            break;
        case "TEMPLATE":
            resources_str+=tr("VM Templates")+", ";
            break;
        case "USER":
            resources_str+=tr("Users")+", ";
            break;
        case "GROUP":
            resources_str+=tr("Groups")+", ";
            break;
        case "CLUSTER":
            resources_str+=tr("Clusters")+", ";
            break;
        case "DATASTORE":
            resources_str+=tr("Datastores")+", ";
            break;
        };
    };
    //remove ", " from end
    resources_str = resources_str.substring(0,resources_str.length-2);

    //Ops
    var ops_str="";
    var ops_array = rights.split('+');
    for (var i=0; i<ops_array.length;i++){
        ops_str += ops_array[i].toLowerCase()+", ";
    }
    ops_str= ops_str.substring(0,ops_str.length-2);

    return [user_str,resources_str,belonging_to,ops_str];
}

//forms the array of data to be inserted from
//the raw json
function aclElementArray(acl_json){
    var acl = acl_json.ACL;
    var acl_string = acl.STRING;

    var acl_array = parseAclString(acl_string);

    return [
        '<input class="check_item" type="checkbox" id="acl_'+acl.ID+'" name="selected_items" value="'+acl.ID+'"/>',
        acl.ID,
        acl_array[0],
        acl_array[1],
        acl_array[2],
        tr(acl_array[3].charAt(0).toUpperCase()+acl_array[3].substring(1)), //capitalize 1st letter for translation
        acl.STRING
    ]
}


// Callback to delete a single element from the dataTable
function deleteAclElement(request){
    deleteElement(dataTable_acls,'#acl_'+request.request.data);
}

//update the datatable with new data
function updateAclsView(request,list){
    var list_array = [];
    $.each(list,function(){
        list_array.push(aclElementArray(this));
    });
    updateView(list_array,dataTable_acls);
    updateDashboard("acls",list);
    updateSystemDashboard("acls",list);
}

function setupCreateAclDialog(){
    dialogs_context.append('<div title=\"'+tr("Create ACL")+'\" id="create_acl_dialog"></div>');
    $create_acl_dialog = $('#create_acl_dialog',dialogs_context);
    var dialog = $create_acl_dialog;
    dialog.html(create_acl_tmpl);
    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window
    //Prepare jquery dialog
    dialog.dialog({
        autoOpen: false,
        modal:true,
        width: 650,
        height: height
    });

    $('#res_subgroup_all',dialog).attr('checked','checked');
    $('#res_id',dialog).attr('disabled','disabled');
    $('#belonging_to',dialog).attr('disabled','disabled');

    $('button',dialog).button();

    $('.res_subgroup',dialog).click(function(){
        var value = $(this).val();
        var context = $(this).parent();
        switch (value) {
        case "*":
            $('#res_id',context).attr('disabled','disabled');
            $('#belonging_to',context).attr('disabled','disabled');
            break;
        case "res_id":
            $('#res_id',context).removeAttr('disabled');
            $('#belonging_to').attr('disabled','disabled');
            break;
        case "belonging_to":
            $('#res_id',context).attr('disabled','disabled');
            $('#belonging_to',context).removeAttr('disabled');
            break;
        };
    });

    $('input#res_id',dialog).keyup(function(){
        $(this).trigger("change");
    });

    //update the rule preview every time some field changes
    $('input,select',dialog).change(function(){
        var context = $('#create_acl_form',$create_acl_dialog);
        var user = $('#applies',context).val();

        if ($('#applies :selected',context).hasClass("user")){
            user='#'+user;
        } else if ($('#applies :selected',context).hasClass("group")){
            user = '@'+user;
        };

        var resources = "";
        $('.resource_cb:checked',context).each(function(){
            resources+=$(this).val()+'+';
        });
        if (resources.length) { resources = resources.substring(0,resources.length-1) };

        var belonging="";
        var mode = $('.res_subgroup:checked',context).val();
        switch (mode) {
        case "*":
            belonging="*";
            break;
        case "res_id":
            belonging="#"+$('#res_id',context).val();
            break;
        case "belonging_to":
            belonging="@"+$('#belonging_to',context).val();
            break;
        }


        var rights = "";
        $('.right_cb:checked',context).each(function(){
            rights+=$(this).val()+'+';
        });
        if (rights.length) { rights = rights.substring(0,rights.length-1) };

        var acl_string = user + ' ' + resources + '/' + belonging + ' ' + rights;
        $('#acl_preview',context).val(acl_string);

    });

    $('#create_acl_form',dialog).submit(function(){
        var user = $('#applies',this).val();
        if (!user.length) {
            notifyError(tr("Please specify to who this ACL applies"));
            return false;
        };

        var resources = $('.resource_cb:checked',this).length;
        if (!resources) {
            notifyError(tr("Please select at least one resource"));
            return false;
        }

        var mode = $('.res_subgroup:checked',this).val();
        switch (mode) {
        case "res_id":
            var l=$('#res_id',this).val().length;
            if (!l){
                notifyError(tr("Please provide a resource ID for the resource(s) in this rule"));
                return false;
            }
            break;
        case "belonging_to":
            var l=$('#belonging_to',this).val().length;
            if (!l){
                notifyError("Please select a group to which the selected resources belong to");
                return false;
            }
            break;
        }

        var rights = $('.right_cb:checked',this).length;
        if (!rights) {
            notifyError("Please select at least one operation");
            return false;
        }

        var acl_string = $('#acl_preview',this).val();

        var acl_json = { "acl" : acl_string };
        Sunstone.runAction("Acl.create",acl_json);
        $create_acl_dialog.dialog('close');
        return false;
    });
}

// Before popping up the dialog, some prepartions are
// required: we have to put the right options in the
// selects.
function popUpCreateAclDialog(){
    var users = $('<select>'+users_select+'</select>');
    $('.empty_value',users).remove();
    $('option',users).addClass("user");
    users.prepend('<option value="">---'+tr("Users")+'---</option>');

    var groups = $('<select>'+groups_select+'</select>');
    $('.empty_value',groups).remove();
    $('option',groups).addClass("group");
    groups.prepend('<option value="">---'+tr("Groups")+'---</option>');

    var dialog =  $create_acl_dialog;
    $('#applies',dialog).html('<option value="*">'+tr("All")+'</option>'+
                                          users.html()+groups.html());
    $('#belonging_to',dialog).html(groups_select);

    $('#applies',dialog).trigger("change");
    dialog.dialog('open');
}

// Prepare the autorefresh of the list
function setAclAutorefresh(){
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_acls);
        var filter = $("#datatable_acls_filter input",dataTable_acls.parents("#datatable_acls_wrapper")).attr('value');
        if (!checked.length && !filter.length){
            Sunstone.runAction("Acl.autorefresh");
        }
    },INTERVAL+someTime());

}

$(document).ready(function(){
    //if we are not oneadmin, our tab will not even be in the DOM.
    dataTable_acls = $("#datatable_acls",main_tabs_context).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "sPaginationType": "full_numbers",
        "bAutoWidth":false,
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "35px", "aTargets": [1] },
            { "bVisible": false, "aTargets": [6]}
        ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });
    dataTable_acls.fnClearTable();
    addElement([
        spinner,
        '','','','','',''],dataTable_acls);

    Sunstone.runAction("Acl.list");

    setupCreateAclDialog();
    setAclAutorefresh();

    initCheckAllBoxes(dataTable_acls);
    tableCheckboxesListener(dataTable_acls);
    //shortenedInfoFields('#datatable_acls');

    infoListener(dataTable_acls);

    $('div#acls_tab div.legend_div').hide();
})
