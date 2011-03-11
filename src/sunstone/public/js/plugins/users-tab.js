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

/*Users tab plugin*/

var users_tab_content = 
'<form id="user_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_users" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">All</input></th>\
      <th>ID</th>\
      <th>Name</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyusers">\
  </tbody>\
</table>\
</form>';

var create_user_tmpl =
'<form id="create_user_form" action="">\
  <fieldset>\
	<div>\
		<label for="username">Username:</label>\
		<input type="text" name="username" id="username" /><br />\
		<label for="pass">Password:</label>\
		<input type="password" name="pass" id="pass" />\
	</div>\
	</fieldset>\
	<fieldset>\
	<div class="form_buttons">\
		<button class="button" id="create_user_submit" value="user/create">Create</button>\
		<button class="button" type="reset" value="reset">Reset</button>\
	</div>\
</fieldset>\
</form>';

var user_list_json = {};
var dataTable_users;

var user_actions = {
    "User.create" : {
        type: "create",
        call: OpenNebula.User.create,
        callback: addUserElement,
        error: onError,
        notify: False
    },
    
    "User.create_dialog" : {
        type: "custom",
        call: popUpCreateUserDialog
    },
    
    "User.list" : {
        type: "list",
        call: OpenNebula.User.list,
        callback: updateUsersView,
        error: onError,
        notify: False
    },
    
    "User.refresh" : {
        type: "custom",
        call: function () {
            waitingNodes(dataTable_users);
            Sunstone.runAction("User.list");
        }
    },
            
    "User.delete" : {
        type: "multiple",
        call: OpenNebula.User.delete,
        callback: deleteUserElement,
        dataTable: function(){return dataTable_users},
        error: onError,
        notify:  False  
    },
}

var user_buttons = {
    "User.refresh" : {
        type: "image",
        text: "Refresh list",
        img: "/images/Refresh-icon.png",
        condition: True
    },
    "User.create_dialog" : {
        type: "create_dialog",
        text: "+ New",
        condition: True
    },
    "User.delete" : {
        type: "action",
        text: "Delete",
        condition: True
    }
}

for (action in user_actions){
    Sunstone.addAction(action,user_actions[action]);
}

Sunstone.addMainTab('users_tab',"Users",users_tab_content,user_buttons,false,function(){return uid==0;});


function userElementArray(user_json){
	user = user_json.USER;
    if (!user.NAME || user.NAME == {}){
        name = "";
    } else {
        name = user.NAME;
    }
        
	return [
		'<input type="checkbox" id="user_'+user.ID+'" name="selected_items" value="'+user.ID+'"/>',
		user.ID,
		name
		]
}



function updateUserElement(request, user_json){
	id = user_json.USER.ID;
	element = userElementArray(user_json);
	updateSingleElement(element,dataTable_users,'#user_'+id);
}

function deleteUserElement(req){
	deleteElement(dataTable_users,'#user_'+req.request.data);
}

function addUserElement(request,user_json){
	element = userElementArray(user_json);
	addElement(element,dataTable_users);
}

function updateUsersView(request,users_list){
	user_list_json = users_list;
	user_list_array = [];

	$.each(user_list_json,function(){
		user_list_array.push(userElementArray(this));
	});
	updateView(user_list_array,dataTable_users);
	updateDashboard("users",user_list_json);
}

function setupCreateUserDialog(){
     $('div#dialogs').append('<div title="Create user" id="create_user_dialog"></div>');
     $('#create_user_dialog').html(create_user_tmpl);

	//Prepare jquery dialog
	$('#create_user_dialog').dialog({
		autoOpen: false,
		modal:true,
		width: 400
	});
    
    $('#create_user_dialog button').button();
    
    $('#create_user_form').submit(function(){
		var user_name=$('#username',this).val();
		var user_password=$('#pass',this).val();
		var user_json = { "user" :
						{ "name" : user_name,
						  "password" : user_password }
					  };
		Sunstone.runAction("User.create",user_json);
		$('#create_user_dialog').dialog('close');
		return false;
	});
}

function popUpCreateUserDialog(){
    $('#create_user_dialog').dialog('open');
}


$(document).ready(function(){
    
    
    dataTable_users = $("#datatable_users").dataTable({
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
    
    dataTable_users.fnClearTable();
    addElement([
            spinner,
            '',''],dataTable_users);
    Sunstone.runAction("User.list");
    
    setupCreateUserDialog();
    
    //TODO user oneadmin
    setInterval(function(){
		var nodes = $('input:checked',dataTable_users.fnGetNodes());
        var filter = $("#datatable_users_filter input").attr("value");
		if (!nodes.length && !filter.length){
			OpenNebula.User.list({timeout: true, success: updateUsersView, error: onError});
		}
    },74000); //so that not all refreshing is done at the same time
    
    initCheckAllBoxes(dataTable_users);
    tableCheckboxesListener(dataTable_users);
    
})
