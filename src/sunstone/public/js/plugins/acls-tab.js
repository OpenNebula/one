/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

var acls_tab_content =
'<form id="acl_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_acls" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">All</input></th>\
      <th>ID</th>\
      <th>Applies to</th>\
      <th>Affected resources</th>\
      <th>Resource ID / Owned by</th>\
      <th>Allowed operations</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyaclss">\
  </tbody>\
</table>\
</form>';

var create_acl_tmpl =
'<form id="create_acl_form" action="">\
  <fieldset>\
        <div>\
                <label for="applies">This rule applies to:</label>\
                <select name="applies" id="applies"></select>\
                <div class="clear"></div>\
                <label style="height:9em">Affected resources:</label>\
                <input type="checkbox" name="res_host" class="resource_cb" value="HOST">Hosts</input><br />\
                <input type="checkbox" name="res_vm" class="resource_cb" value="VM">Virtual Machines</input><br />\
                <input type="checkbox" name="res_net" class="resource_cb" value="NET">Virtual Networks</input><br />\
                <input type="checkbox" name="res_image" class="resource_cb" value="IMAGE">Images</input><br />\
                <input type="checkbox" name="res_template" class="resource_cb" value="TEMPLATE">Templates</input><br />\
                <input type="checkbox" name="res_user" class="resource_cb" value="USER">Users</input><br />\
                <input type="checkbox" name="res_group" class="resource_cb" value="GROUP">Groups</input><br />\
                <div class="clear"></div>\
                <label for="mode_select" style="height:3em;">Resource subset:</label>\
                <input type="radio" class="res_subgroup" name="mode_select" value="*" id="res_subgroup_all">All</input><br />\
                <input type="radio" class="res_subgroup" name="mode_select" value="res_id" id="res_subgroup_id">Specific ID</input><br />\
                <input type="radio" class="res_subgroup" name="mode_select" value="belonging_to" id="res_subgroup_group">Owned by group</input><br />\
                <div class="clear"></div>\
                <label for="res_id">Resource ID:</label>\
                <input type="text" name="res_id" id="res_id"></input>\
                <div class="clear"></div>\
                <label for="belonging_to">Group:</label>\
                <select name="belonging_to" id="belonging_to"></select>\
                <div class="clear"></div>\
                <label style="height:10em;">Allowed operations:</label>\
                <input type="checkbox" name="right_create" class="right_cb" value="CREATE">Create</input><br />\
                <input type="checkbox" name="right_delete" class="right_cb" value="DELETE">Delete</input><br />\
                <input type="checkbox" name="right_use" class="right_cb" value="USE">Use</input><br />\
                <input type="checkbox" name="right_manage" class="right_cb" value="MANAGE">Manage</input><br />\
                <input type="checkbox" name="right_info" class="right_cb" value="INFO">Get Information</input><br />\
                <input type="checkbox" name="right_info_pool" class="right_cb" value="INFO_POOL">Get Pool of resources</input><br />\
                <input type="checkbox" name="right_info_pool_mine" class="right_cb" value="INFO_POOL_MINE">Get Pool of my/group\'s resources</input><br />\
                <input type="checkbox" name="right_chown" class="right_cb" value="CHOWN">Change owner</input><br />\
                <div class="clear"></div>\
                <label for="acl_preview">ACL String preview:</label>\
                <input type="text" name="acl_preview" id="acl_preview" style="width:400px;"></input>\
        </div>\
        </fieldset>\
        <fieldset>\
        <div class="form_buttons">\
                <button class="button" id="create_acl_submit" value="Acl.create">Create</button>\
                <button class="button" type="reset" value="reset">Reset</button>\
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
        },
    },

    "Acl.autorefresh" : {
        type: "custom",
        call: function(){
            OpenNebula.Acl.list({
                timeout: true,
                success: updateAclsView,
                error: onError
            });
        },
        condition: True,
        notify: false
    },

    "Acl.delete" : {
        type: "multiple",
        call: OpenNebula.Acl.delete,
        callback: deleteAclElement,
        elements: function() { return getSelectedNodes(dataTable_acls); },
        error: onError,
        notify: true
    },
}

var acl_buttons = {
    "Acl.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "images/Refresh-icon.png",
        condition: True
    },
    "Acl.create_dialog" : {
        type: "create_dialog",
        text: "+ New",
        condition: True
    },
    "Acl.delete" : {
        type: "action",
        text: "Delete",
        condition: True
    }
}

var acls_tab = {
    title: "ACLs",
    content: acls_tab_content,
    buttons: acl_buttons,
    condition: True
}

Sunstone.addActions(acl_actions);
Sunstone.addMainTab('acls_tab',acls_tab);

function parseUserAcl(user){
    var user_str="";
    if (user[0] == '*'){
        user_str = "All";
    } else {
        if (user[0] == '#'){
            user_str="User ";
            user_str+= getUserName(user.substring(1));
        }
        else if (user[0] == '@'){
            user_str="Group ";
            user_str+= getGroupName(user.substring(1));
        };
    };
    return user_str;
}

function parseResourceAcl(user){
    var user_str="";
    if (user[0] == '*'){
        user_str = "All";
    } else {
        if (user[0] == '#'){
            user_str="ID ";
            user_str+= user.substring(1);
        }
        else if (user[0] == '@'){
            user_str="Group ";
            user_str+= getGroupName(user.substring(1));
        };
    };
    return user_str;
}

//Parses the string, returns a legible array
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
            resources_str+="Hosts, ";
            break;
        case "VM":
            resources_str+="Virtual Machines, ";
            break;
        case "NET":
            resources_str+="Virtual Networks, ";
            break;
        case "IMAGE":
            resources_str+="Images, ";
            break;
        case "TEMPLATE":
            resources_str+="VM Templates, ";
            break;
        case "USER":
            resources_str+="Users, ";
            break;
        case "GROUP":
            resources_str+="Groups, ";
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


function aclElementArray(acl_json){
    var acl = acl_json.ACL;
    var acl_string = acl.STRING;

    var acl_array = parseAclString(acl_string);

    return [
        '<input type="checkbox" id="acl_'+acl.ID+'" name="selected_items" value="'+acl.ID+'"/>',
        acl.ID,
        acl_array[0],
        acl_array[1],
        acl_array[2],
        acl_array[3]
    ]
}


// Callback to delete a single element from the dataTable
function deleteAclElement(req){
    deleteElement(dataTable_acls,'#acl_'+req.request.data);
}

function updateAclsView(request,list){
    var list_array = [];

    $.each(list,function(){
        list_array.push(aclElementArray(this));
    });
    updateView(list_array,dataTable_acls);
}

function setupCreateAclDialog(){
    $('div#dialogs').append('<div title="Create ACL" id="create_acl_dialog"></div>');
    $('#create_acl_dialog').html(create_acl_tmpl);

    //Prepare jquery dialog
    $('#create_acl_dialog').dialog({
        autoOpen: false,
        modal:true,
        width: 600
    });

    $('#create_acl_dialog #res_subgroup_all').attr("checked","checked");
    $('#create_acl_dialog #res_id').attr("disabled","disabled");
    $('#create_acl_dialog #belonging_to').attr("disabled","disabled");

    $('#create_acl_dialog button').button();

    $('.res_subgroup').click(function(){
        var value = $(this).val();
        var context = $(this).parent();
        switch (value) {
        case "*":
            $('#res_id',context).attr("disabled","disabled");
            $('#belonging_to',context).attr("disabled","disabled");
            break;
        case "res_id":
            $('#res_id',context).removeAttr("disabled");
            $('#belonging_to').attr("disabled","disabled");
            break;
        case "belonging_to":
            $('#res_id',context).attr("disabled","disabled");
            $('#belonging_to',context).removeAttr("disabled");
            break;
        };
    });

    $('input,select',$('#create_acl_form')).live("change",function(){
        var context = $('#create_acl_form');
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
        var mode = $('.res_subgroup:checked').val();
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

    $('#create_acl_form').submit(function(){
        var user = $('#applies',this).val();
        if (!user.length) {
            notifyError("Please specify to who this ACL applies");
            return false;
        };

        var resources = $('.resource_cb:checked',this).length;
        if (!resources) {
            notifyError("Please select at least one resource");
            return false;
        }

        var mode = $('.res_subgroup:checked',this).val();
        switch (mode) {
        case "res_id":
            var l=$('#res_id',this).val().length;
            if (!l){
                notifyError("Please provide a resource ID for the resource(s) in this rule");
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
        $('#create_acl_dialog').dialog('close');
        return false;
    });
}

function popUpCreateAclDialog(){
    var users = $('<select>'+users_select+'</select>');
    $('.empty_value',users).remove();
    $('option',users).addClass("user");
    users.prepend('<option value="">---Users---</option>');

    var groups = $('<select>'+groups_select+'</select>');
    $('.empty_value',groups).remove();
    $('option',groups).addClass("group");
    groups.prepend('<option value="">---Groups---</option>');


    $('#create_acl_dialog #applies').html('<option value="*">All</option>'+
                                          users.html()+groups.html());
    $('#create_acl_dialog #belonging_to').html(groups_select);

    $('#create_acl_dialog').dialog('open');
}

// Prepare the autorefresh of the list
function setAclAutorefresh(){
    setInterval(function(){
        var checked = $('input:checked',dataTable_acls.fnGetNodes());
        var filter = $("#datatable_acls_filter input").attr("value");
        if (!checked.length && !filter.length){
            Sunstone.runAction("Acl.autorefresh");
        }
    },INTERVAL+someTime());
}

$(document).ready(function(){
    //if we are not oneadmin, our tab will not even be in the DOM.
    dataTable_acls = $("#datatable_acls").dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sPaginationType": "full_numbers",
        "bAutoWidth":false,
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ["check"] },
            { "sWidth": "60px", "aTargets": [0] },
            { "sWidth": "35px", "aTargets": [1] }
        ]
    });
    dataTable_acls.fnClearTable();
    addElement([
        spinner,
        '','','','',''],dataTable_acls);

    Sunstone.runAction("Acl.list");

    setupCreateAclDialog();
    setAclAutorefresh();

    initCheckAllBoxes(dataTable_acls);
    tableCheckboxesListener(dataTable_acls);
    //shortenedInfoFields('#datatable_acls');

})
