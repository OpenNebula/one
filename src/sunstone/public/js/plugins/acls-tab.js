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

/*ACLs tab plugin*/
var dataTable_acls;
var $create_acl_dialog;

var create_acl_tmpl =
'<div class="row">\
    <div class="large-12 columns">\
        <h3 id="create_vnet_header" class="subheader">'+tr("Create ACL")+'</h3>\
    </div>\
</div>\
<form id="create_acl_form" action="">\
        <div class="row">\
        <div class="large-6 columns">\
            <fieldset>\
                <legend>'+tr("This rule applies to")+'</legend>\
                <div class="row">\
                    <div class="large-4 columns">\
                        <input type="radio" class="applies" name="applies_select" value="*" id="applies_all"><label class="applies" for="applies_all">'+tr("All")+'</label>\
                    </div>\
                    <div class="large-4 columns">\
                        <input type="radio" class="applies" name="applies_select" value="applies_to_user" id="applies_id"><label class="applies" for="applies_id">'+tr("User")+'</label>\
                    </div>\
                    <div class="large-4 columns">\
                        <input type="radio" class="applies" name="applies_select" value="applies_to_group" id="applies_group"><label class="applies" for="applies_group">'+tr("Group")+'</label>\
                    </div>\
                </div>\
                <div class="row">\
                    <div class="large-12 columns">\
                        <div class="applies_to_user">\
                            <label for="applies_to_user">'+tr("User")+':</label>\
                            <div name="applies_to_user" id="applies_to_user">\
                            </div>\
                        </div>\
                        <div class="applies_to_group">\
                            <label for="applies_to_group">'+tr("Group")+':</label>\
                            <div name="applies_to_group" id="applies_to_group">\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </fieldset>\
        </div>\
          <div class="large-6 columns">\
            <label for="zones_applies">'+tr("Zones where the rule applies")+'</label>\
            <div name="zones_applies" id="zones_applies">\
            </div>\
          </div>\
        </div>\
        <fieldset>\
            <legend>'+tr("Affected resources")+'</legend>\
        <div class="row">\
            <div class="large-3 columns">\
                <input type="checkbox" id="res_host" name="res_host" class="resource_cb" value="HOST"><label for="res_host">'+tr("Hosts")+'</label>\
            </div>\
            <div class="large-3 columns">\
                <input type="checkbox" id="res_cluster" name="res_cluster" class="resource_cb" value="CLUSTER"><label for="res_cluster">'+tr("Clusters")+'</label>\
            </div>\
            <div class="large-3 columns">\
                <input type="checkbox" id="res_datastore" name="res_datastore" class="resource_cb" value="DATASTORE"><label for="res_datastore">'+tr("Datastores")+'</label>\
            </div>\
            <div class="large-3 columns">\
                <input type="checkbox" id="res_vm" name="res_vm" class="resource_cb" value="VM"><label for="res_vm">'+tr("Virtual Machines")+'</label>\
            </div>\
        </div>\
        <div class="row">\
            <div class="large-3 columns">\
                <input type="checkbox" id="res_net" name="res_net" class="resource_cb" value="NET"><label for="res_net">'+tr("Virtual Networks")+'</label>\
            </div>\
            <div class="large-3 columns">\
                <input type="checkbox" id="res_image" name="res_image" class="resource_cb" value="IMAGE"><label for="res_image">'+tr("Images")+'</label>\
            </div>\
            <div class="large-3 columns">\
                <input type="checkbox" id="res_template" name="res_template" class="resource_cb" value="TEMPLATE"><label for="res_template">'+tr("Templates")+'</label>\
            </div>\
            <div class="large-3 columns">\
                <input type="checkbox" id="res_user" name="res_user" class="resource_cb" value="USER"><label for="res_user">'+tr("Users")+'</label>\
            </div>\
        </div>\
        <div class="row">\
            <div class="large-3 columns">\
                <input type="checkbox" id="res_group" name="res_group" class="resource_cb" value="GROUP"><label for="res_group">'+tr("Groups")+'</label>\
            </div>\
            <div class="large-3 columns">\
                <input type="checkbox" id="res_document" name="res_document" class="resource_cb" value="DOCUMENT"><label for="res_document">'+tr("Documents")+'</label>\
            </div>\
            <div class="large-3 columns">\
                <input type="checkbox" id="res_zone" name="res_zone" class="resource_cb" value="ZONE"><label for="res_zone">'+tr("Zones")+'</label>\
            </div>\
            <div class="large-3 columns">\
                <input type="checkbox" id="res_secgroup" name="res_secgroup" class="resource_cb" value="SECGROUP"><label for="res_secgroup">'+tr("Security Groups")+'</label>\
            </div>\
        </div>\
        <div class="row">\
            <div class="large-3 columns">\
                <input type="checkbox" id="res_vdc" name="res_vdc" class="resource_cb" value="VDC"><label for="res_vdc">'+tr("VDCs")+'</label>\
            </div>\
        </div>\
        </fieldset>\
        <fieldset>\
            <legend>'+tr("Resource subset")+'</legend>\
        <div class="row">\
            <div class="large-3 columns">\
                <input type="radio" class="res_subgroup" name="mode_select" value="*" id="res_subgroup_all"><label class="res_subgroup" for="res_subgroup_all">'+tr("All")+'</label>\
            </div>\
            <div class="large-3 columns">\
                <input type="radio" class="res_subgroup" name="mode_select" value="res_id" id="res_subgroup_id"><label class="res_subgroup" for="res_subgroup_id">'+tr("ID")+'</label>\
            </div>\
            <div class="large-3 columns">\
                <input type="radio" class="res_subgroup" name="mode_select" value="belonging_to" id="res_subgroup_group"><label class="res_subgroup" for="res_subgroup_group">'+tr("Group")+'</label>\
            </div>\
            <div class="large-3 columns">\
                <input type="radio" class="res_subgroup" name="mode_select" value="in_cluster" id="res_subgroup_cluster"><label class="res_subgroup" for="res_subgroup_cluster">'+tr("Cluster")+'</label>\
            </div>\
        </div>\
        <div class="row">\
            <div class="large-6 columns">\
                <div class="res_id">\
                    <label for="res_id">'+tr("Resource ID")+':</label>\
                    <input type="text" name="res_id" id="res_id"></input>\
                </div>\
                <div class="belonging_to">\
                    <label for="belonging_to">'+tr("Group")+':</label>\
                    <div name="belonging_to" id="belonging_to">\
                    </div>\
                </div>\
                <div class="in_cluster">\
                    <label for="in_cluster">'+tr("Cluster")+':</label>\
                    <div name="in_cluster" id="in_cluster">\
                    </div>\
                </div>\
            </div>\
        </div>\
        </fieldset>\
        <fieldset>\
            <legend>'+tr("Allowed operations")+'</legend>\
        <div class="row">\
            <div class="large-3 columns">\
                <input type="checkbox" id="right_delete" name="right_delete" class="right_cb" value="USE"><label for="right_delete">'+tr("Use")+'</label>\
            </div>\
            <div class="large-3 columns">\
                <input type="checkbox" id="right_use" name="right_use" class="right_cb" value="MANAGE"><label for="right_use">'+ tr("Manage")+'</label>\
            </div>\
            <div class="large-3 columns">\
                <input type="checkbox" id="right_manage" name="right_manage" class="right_cb" value="ADMIN"><label for="right_manage">'+tr("Administrate")+'</label>\
            </div>\
            <div class="large-3 columns">\
                <input type="checkbox" id="right_create" name="right_create" class="right_cb" value="CREATE"><label for="right_create">'+tr("Create")+'</label>\
            </div>\
        </div>\
        </fieldset>\
        <br>\
        <div class="row">\
          <div class="large-12 columns">\
              <label for="acl_preview">'+tr("ACL String preview")+':</label>\
              <input type="text" name="acl_preview" id="acl_preview"></input>\
          </div>\
        </div>\
        <div class="form_buttons">\
          <button class="button radius right success" id="create_acl_submit" type="submit" value="Acl.create">'+tr("Create")+'</button>\
          <button class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
        </div>\
    <a class="close-reveal-modal">&#215;</a>\
</form>\
        </div>';

var acl_actions = {
    "Acl.create" : {
        type: "create",
        call: OpenNebula.Acl.create,
        callback: function(){
            $create_acl_dialog.foundation('reveal', 'close');
            $create_acl_dialog.empty();
            setupCreateAclDialog();

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
            Sunstone.runAction("Acl.list", {force: true});
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
    }
}

var acl_buttons = {
    "Acl.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },
    "Acl.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "Acl.delete" : {
        type: "confirm",
        layout: "del",
        text: tr("Delete")
    },
    //"Acl.help" : {
    //    type: "action",
    //    text: '?',
    //    alwaysActive: true
    //}
}

var acls_tab = {
    title: tr("ACLs"),
    resource: 'Acl',
    buttons: acl_buttons,
    tabClass: 'subTab',
    parentTab: 'system-tab',
    search_input: '<input id="acl_search" type="search" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-key"></i>&emsp;'+tr("Access Control Lists"),
    subheader: '<span/><small></small>&emsp;',
    table: '<table id="datatable_acls" class="dataTable">\
      <thead>\
        <tr>\
          <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
          <th>'+tr("ID")+'</th>\
          <th>'+tr("Applies to")+'</th>\
          <th>'+tr("Affected resources")+'</th>\
          <th>'+tr("Resource ID / Owned by")+'</th>\
          <th>'+tr("Allowed operations")+'</th>\
          <th>'+tr("Zone")+'</th>\
          <th>'+tr("ACL String")+'</th>\
        </tr>\
      </thead>\
      <tbody id="tbodyaclss">\
      </tbody>\
    </table>'
}

Sunstone.addActions(acl_actions);
Sunstone.addMainTab('acls-tab',acls_tab);

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
        }
        else if (user[0] == '%'){
            user_str=tr("Cluster ID")+" ";
            user_str+= user.substring(1);
        };
    };
    return user_str;
}

//Receives a segment of an ACL and translates:
// * -> All
// #1 -> Zone 1 (tries to translate "1" into zone name)
//Translation of zone names depends on
//zone plugins tables.
function parseZoneAcl(zone){
    var zone_str = "";

    if (zone[0] == '*'){
        zone_str = tr("All");
    } else if (zone[0] == '#'){
        zone_str = getZoneName(zone.substring(1));
    }

    return zone_str;
}

//Parses a full ACL string, and translates it into
//a legible array
//to be put in the datatable fields.
function parseAclString(string) {
    var space_split = string.split(' ');
    var user = space_split[0];
    var resources = space_split[1];
    var rights = space_split[2];
    var zone = space_split[3];

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
        case "DOCUMENT":
            resources_str+=tr("Documents")+", ";
            break;
        case "ZONE":
            resources_str+=tr("Zones")+", ";
            break;
        case "SECGROUP":
            resources_str+=tr("Security Groups")+", ";
            break;
        case "VDC":
            resources_str+=tr("VDCs")+", ";
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

    //Zone
    var zone_str = parseZoneAcl(zone);

    return [user_str, resources_str, belonging_to, ops_str, zone_str];
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
        acl_array[3],
        tr(acl_array[4].charAt(0).toUpperCase()+acl_array[4].substring(1)), //capitalize 1st letter for translation
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
}

function setupCreateAclDialog(){
    dialogs_context.append('<div id="create_acl_dialog"></div>');
    $create_acl_dialog = $('#create_acl_dialog',dialogs_context);
    var dialog = $create_acl_dialog;
    dialog.html(create_acl_tmpl);
    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window
    //Prepare jquery dialog
    //dialog.dialog({
    //    autoOpen: false,
    //    modal:true,
    //    width: 650,
    //    height: height
    //});
    dialog.addClass("reveal-modal large").attr("data-reveal", "");

    //Default selected options
    $('#applies_all',dialog).attr('checked','checked');
    $('.applies_to_user',dialog).hide();
    $('.applies_to_group',dialog).hide();

    $('#res_subgroup_all',dialog).attr('checked','checked');
    $('.res_id',dialog).hide();
    $('.belonging_to',dialog).hide();
    $('.in_cluster',dialog).hide();

    //$('button',dialog).button();

    //Applies to subset radio buttons
    $('.applies',dialog).click(function(){
        var value = $(this).val();
        switch (value) {
        case "*":
            $('.applies_to_user',dialog).hide();
            $('.applies_to_group',dialog).hide();
            break;
        case "applies_to_user":
            $('.applies_to_user',dialog).show();
            $('.applies_to_group',dialog).hide();
            break;
        case "applies_to_group":
            $('.applies_to_user',dialog).hide();
            $('.applies_to_group',dialog).show();
            break;
        };
    });

    //Resource subset radio buttons
    $('.res_subgroup',dialog).click(function(){
        var value = $(this).val();
        switch (value) {
        case "*":
            $('.res_id',dialog).hide();
            $('.belonging_to',dialog).hide();
            $('.in_cluster',dialog).hide();
            break;
        case "res_id":
            $('.res_id',dialog).show();
            $('.belonging_to').hide();
            $('.in_cluster',dialog).hide();
            break;
        case "belonging_to":
            $('.res_id',dialog).hide();
            $('.belonging_to',dialog).show();
            $('.in_cluster',dialog).hide();
            break;
        case "in_cluster":
            $('.res_id',dialog).hide();
            $('.belonging_to',dialog).hide();
            $('.in_cluster',dialog).show();
            break;
        };
    });

    //trigger ACL string preview on keyup
    $('input#res_id',dialog).keyup(function(){
        $(this).trigger("change");
    });

    //update the rule preview every time some field changes
    $(dialog).off('change', 'input,select');
    $(dialog).on('change', 'input,select', function(){
        var context = $('#create_acl_form',$create_acl_dialog);

        var user="";
        var mode = $('.applies:checked',context).val();
        switch (mode) {
        case "*":
            user="*";
            break;
        case "applies_to_user":
            user="#"+$('div#applies_to_user .resource_list_select',context).val();
            break;
        case "applies_to_group":
            user="@"+$('div#applies_to_group .resource_list_select',context).val();
            break;
        }

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
            belonging="@"+$('div#belonging_to .resource_list_select',context).val();
            break;
        case "in_cluster":
            belonging="%"+$('#in_cluster .resource_list_select',context).val();
            break;
        }


        var rights = "";
        $('.right_cb:checked',context).each(function(){
            rights+=$(this).val()+'+';
        });
        if (rights.length) { rights = rights.substring(0,rights.length-1) };

        var zone = $('#zones_applies .resource_list_select',context).val();

        if (zone != "*"){
            zone = '#'+zone;
        }

        var acl_string = user + ' ' + resources + '/' + belonging + ' '
                        + rights + ' ' + zone;
        $('#acl_preview',context).val(acl_string);

    });

    $('#create_acl_form',dialog).submit(function(){
        var mode = $('.applies:checked',this).val();
        switch (mode) {
        case "applies_to_user":
            var l=$('#applies_to_user .resource_list_select',this).val().length;
            if (!l){
                notifyError("Please select a user to whom the acl applies");
                return false;
            }
            break;
        case "applies_to_group":
            var l=$('#applies_to_group .resource_list_select',this).val().length;
            if (!l){
                notifyError("Please select a group to whom the acl applies");
                return false;
            }
            break;
        }

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
            var l=$('#belonging_to .resource_list_select',this).val().length;
            if (!l){
                notifyError("Please select a group to which the selected resources belong to");
                return false;
            }
            break;
        case "in_cluster":
            var l=$('#in_cluster .resource_list_select',this).val().length;
            if (!l){
                notifyError("Please select a cluster to which the selected resources belong to");
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
        return false;
    });
}

// Before popping up the dialog, some prepartions are
// required: we have to put the right options in the
// selects.
function popUpCreateAclDialog(){
    var dialog =  $create_acl_dialog;

    insertSelectOptions('div#applies_to_user', dialog, "User", null, true);
    insertSelectOptions('div#applies_to_group', dialog, "Group", null, true);

    insertSelectOptions('div#belonging_to', dialog, "Group", null, true);
    insertSelectOptions('#in_cluster',dialog, "Cluster", null, true);

    // Delete cluster -1 option
    $('#in_cluster select option[value="-1"]',dialog).remove();

    insertSelectOptions('div#zones_applies', dialog, "Zone", "*", false,
                        '<option value="*">'+tr("All")+'</option>');

    dialog.foundation().foundation('reveal', 'open');
}

$(document).ready(function(){
    var tab_name = 'acls-tab';

    if (Config.isTabEnabled(tab_name)) {
        //if we are not oneadmin, our tab will not even be in the DOM.
        dataTable_acls = $("#datatable_acls",main_tabs_context).dataTable({
            "aoColumnDefs": [
                { "bSortable": false, "aTargets": ["check",2,3,4,5,6,7] },
                { "sWidth": "35px", "aTargets": [0] },
                { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
                { "bVisible": false, "aTargets": ['_all']}
            ],
            "bSortClasses" : false,
            "bDeferRender": true
        });


        $('#acl_search').keyup(function(){
          dataTable_acls.fnFilter( $(this).val() );
        })

        dataTable_acls.on('draw', function(){
          recountCheckboxes(dataTable_acls);
        })

        Sunstone.runAction("Acl.list");

        setupCreateAclDialog();

        initCheckAllBoxes(dataTable_acls);
        tableCheckboxesListener(dataTable_acls);
        //shortenedInfoFields('#datatable_acls');

        infoListener(dataTable_acls);

        $('div#acls_tab div.legend_div').hide();

        dataTable_acls.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
})
