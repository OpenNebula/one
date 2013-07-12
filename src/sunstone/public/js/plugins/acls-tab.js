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

/*ACLs tab plugin*/
var dataTable_acls;
var $create_acl_dialog;

var acls_tab_content = '\
<form class="custom" id="acl_form" action="">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
        <i class="icon-key"></i> '+tr("Access Control Lists")+'\
      </span>\
      <span class="header-info">\
        <span/> <small></small>&emsp;\
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
    <input id="acl_search" type="text" placeholder="'+tr("Search")+'" />\
  </div>\
  <br>\
  <br>\
</div>\
</div>\
  <div class="row">\
    <div class="twelve columns">\
<table id="datatable_acls" class="datatable twelve">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
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
</form>';

var create_acl_tmpl =
'<div class="panel">\
  <h3>\
    <small id="create_vnet_header">'+tr("Create ACL")+'</small>\
  </h3>\
</div>\
<div class="reveal-body">\
<form id="create_acl_form" action="">\
        <div class="row">\
          <div class="four columns">\
              <label class="inline right" for="applies">'+tr("This rule applies to")+':</label>\
          </div>\
          <div class="seven columns">\
              <select name="applies" id="applies"></select>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
         </div>\
        <div class="row">\
            <fieldset>\
            <legend>'+tr("Affected resources")+'</legend>\
            <div class="six columns">\
                <input type="checkbox" name="res_host" class="resource_cb" value="HOST">'+tr("Hosts")+'</input><br />\
                <input type="checkbox" name="res_cluster" class="resource_cb" value="CLUSTER">'+tr("Clusters")+'</input><br />\
                <input type="checkbox" name="res_datastore" class="resource_cb" value="DATASTORE">'+tr("Datastores")+'</input><br />\
                <input type="checkbox" name="res_vm" class="resource_cb" value="VM">'+tr("Virtual Machines")+'</input><br />\
                <input type="checkbox" name="res_net" class="resource_cb" value="NET">'+tr("Virtual Networks")+'</input><br />\
            </div>\
            <div class="six columns">\
                <input type="checkbox" name="res_image" class="resource_cb" value="IMAGE">'+tr("Images")+'</input><br />\
                <input type="checkbox" name="res_template" class="resource_cb" value="TEMPLATE">'+tr("Templates")+'</input><br />\
                <input type="checkbox" name="res_user" class="resource_cb" value="USER">'+tr("Users")+'</input><br />\
                <input type="checkbox" name="res_group" class="resource_cb" value="GROUP">'+tr("Groups")+'</input><br />\
                <input type="checkbox" name="res_document" class="resource_cb" value="DOCUMENT">'+tr("Documents")+'</input><br />\
            </div>\
            </fieldset>\
        </div>\
        <div class="row">\
            <fieldset>\
            <legend>'+tr("Resource subset")+'</legend>\
            <div class="six columns">\
                <input type="radio" class="res_subgroup" name="mode_select" value="*" id="res_subgroup_all">'+tr("All")+'</input><br />\
                <input type="radio" class="res_subgroup" name="mode_select" value="res_id" id="res_subgroup_id">'+tr("Specific ID")+'</input><br />\
                <input type="radio" class="res_subgroup" name="mode_select" value="belonging_to" id="res_subgroup_group">'+tr("Owned by group")+'</input><br />\
                <input type="radio" class="res_subgroup" name="mode_select" value="in_cluster" id="res_subgroup_group">'+tr("Assigned to cluster")+'</input><br />\
            </div>\
            <div class="six columns">\
                <div class="res_id">\
                    <label for="res_id">'+tr("Resource ID")+':</label>\
                    <input type="text" name="res_id" id="res_id"></input>\
                </div>\
                <div class="belonging_to">\
                    <label for="belonging_to">'+tr("Group")+':</label>\
                    <select name="belonging_to" id="belonging_to"></select>\
                </div>\
                <div class="in_cluster">\
                    <label for="in_cluster">'+tr("Cluster")+':</label>\
                    <select name="in_cluster" id="in_cluster"></select>\
                </div>\
            </div>\
            </fieldset>\
        </div>\
        <div class="row">\
            <fieldset>\
            <legend>'+tr("Allowed operations")+'</legend>\
                <input type="checkbox" name="right_delete" class="right_cb" value="USE">'+tr("Use")+'</input>\
                <input type="checkbox" name="right_use" class="right_cb" value="MANAGE">'+tr("Manage")+'</input>\
                <input type="checkbox" name="right_manage" class="right_cb" value="ADMIN">'+tr("Administrate")+'</input>\
                <input type="checkbox" name="right_create" class="right_cb" value="CREATE">'+tr("Create")+'</input>\
            </fieldset>\
        </div>\
        <div class="row">\
          <div class="four columns">\
              <label class="inline right" for="acl_preview">'+tr("ACL String preview")+':</label>\
          </div>\
          <div class="seven columns">\
              <input type="text" name="acl_preview" id="acl_preview"></input>\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
        </div>\
        <div class="reveal-footer">\
        <hr>\
        <div class="form_buttons">\
          <button class="button radius right success" id="create_acl_submit" type="submit" value="Acl.create">'+tr("Create")+'</button>\
          <button class="button secondary radius" type="reset" value="reset">'+tr("Reset")+'</button>\
          <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
        </div>\
        </div>\
    <a class="close-reveal-modal">&#215;</a>\
</form>\
        </div>';

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
    }
}

var acl_buttons = {
    "Acl.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
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
    content: acls_tab_content,
    buttons: acl_buttons,
    tabClass: 'subTab',
    parentTab: 'system-tab'
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
        case "DOCUMENT":
            resources_str+=tr("Documents")+", ";
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
}

function setupCreateAclDialog(){
    dialogs_context.append('<div title=\"'+tr("Create ACL")+'\" id="create_acl_dialog"></div>');
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
    dialog.addClass("reveal-modal large max-height");

    //Default selected options
    $('#res_subgroup_all',dialog).attr('checked','checked');
    $('.res_id',dialog).hide();
    $('.belonging_to',dialog).hide();
    $('.in_cluster',dialog).hide();

    //$('button',dialog).button();

    //Resource subset radio buttons
    $('.res_subgroup',dialog).click(function(){
        var value = $(this).val();
        var context = $(this).closest('fieldset')
        switch (value) {
        case "*":
            $('.res_id',context).hide();
            $('.belonging_to',context).hide();
            $('.in_cluster',context).hide();
            break;
        case "res_id":
            $('.res_id',context).show();
            $('.belonging_to').hide();
            $('.in_cluster',context).hide();
            break;
        case "belonging_to":
            $('.res_id',context).hide();
            $('.belonging_to',context).show();
            $('.in_cluster',context).hide();
            break;
        case "in_cluster":
            $('.res_id',context).hide();
            $('.belonging_to',context).hide();
            $('.in_cluster',context).show();
            break;
        };
    });

    //trigger ACL string preview on keyup
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
        case "in_cluster":
            belonging="%"+$('#in_cluster',context).val();
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
        case "in_cluster":
            var l=$('#in_cluster',this).val().length;
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
        $create_acl_dialog.trigger("reveal:close");
        return false;
    });
}

// Before popping up the dialog, some prepartions are
// required: we have to put the right options in the
// selects.
function popUpCreateAclDialog(){
    var users = $('<select>'+users_sel()+'</select>');
    $('.empty_value',users).remove();
    $('option',users).addClass("user");
    users.prepend('<option value="">---'+tr("Users")+'---</option>');

    var groups = $('<select>'+groups_sel()+'</select>');
    $('.empty_value',groups).remove();
    $('option',groups).addClass("group");
    groups.prepend('<option value="">---'+tr("Groups")+'---</option>');

    var dialog =  $create_acl_dialog;
    $('#applies',dialog).html('<option value="*">'+tr("All")+'</option>'+
                                          users.html()+groups.html());
    $('#belonging_to',dialog).html(groups_select);
    $('#in_cluster',dialog).html(clusters_select);

    $('#applies',dialog).trigger("change");
    dialog.reveal();
}

// Prepare the autorefresh of the list
function setAclAutorefresh(){
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_acls);
        var filter = $('#acl_search').attr('value');
        if ((checked.length==0) && !filter){
            Sunstone.runAction("Acl.autorefresh");
        }
    },INTERVAL+someTime());

}

$(document).ready(function(){
    var tab_name = 'acls-tab';

    if (Config.isTabEnabled(tab_name)) {
        //if we are not oneadmin, our tab will not even be in the DOM.
        dataTable_acls = $("#datatable_acls",main_tabs_context).dataTable({
            "aoColumnDefs": [
                { "bSortable": false, "aTargets": ["check",2,3,4,5,6] },
                { "sWidth": "35px", "aTargets": [0] },
                { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
                { "bVisible": false, "aTargets": ['_all']}
            ]
        });


        $('#acl_search').keyup(function(){
          dataTable_acls.fnFilter( $(this).val() );
        })

        dataTable_acls.on('draw', function(){
          recountCheckboxes(dataTable_acls);
        })

        Sunstone.runAction("Acl.list");

        setupCreateAclDialog();
        setAclAutorefresh();

        initCheckAllBoxes(dataTable_acls);
        tableCheckboxesListener(dataTable_acls);
        //shortenedInfoFields('#datatable_acls');

        infoListener(dataTable_acls);

        $('div#acls_tab div.legend_div').hide();
    }
})
