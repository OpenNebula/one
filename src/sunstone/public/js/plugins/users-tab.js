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
        call: OpenNebula.User.list
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
