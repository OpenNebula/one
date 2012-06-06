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

var system_tab_content =
'<table class="dashboard_table" style=>\
<tr>\
<td style="width:50%">\
<table id="system_information_table" style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
<h3>' + tr("Summary of system resources") + '</h3>\
        <div class="panel_info">\
\
          <table class="info_table">\
            <tr>\
              <td class="key_td">' + tr("Groups") + '</td>\
              <td class="value_td"><span id="system_total_groups"></span></td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Users")+'</td>\
              <td class="value_td"><span id="system_total_users"></span></td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("ACL Rules") + '</td>\
              <td class="value_td"><span id="system_total_acls"></span></td>\
            </tr>\
          </table>\
\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("Quickstart") + '</h3>\
        <div class="panel_info dashboard_p">\
             <p></br>\
             <span class="ui-icon ui-icon-arrowreturnthick-1-e inline-icon" /><a class="action_button" href="#groups_tab" value="Group.create_dialog">'+tr("Create new Group")+'</a></br>\
             <span class="ui-icon ui-icon-arrowreturnthick-1-e inline-icon" /><a class="action_button" href="#users_tab" value="User.create_dialog">'+tr("Create new User")+'</a></br>\
             <span class="ui-icon ui-icon-arrowreturnthick-1-e inline-icon" /><a class="action_button" href="#acls_tab" value="Acl.create_dialog">'+tr("Create new ACL")+'</a></br>\
             </p>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
<td style="width:50%">\
<table id="table_right" style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("System Resources") + '</h3>\
        <div class="panel_info">\
            <p><img src="images/system_icon.png" style="float:right;" alt="user" width="128" height="128" />'+tr("System resources management is only accesible to users of the oneadmin group. It comprises the operations regarding OpenNebula groups, users and ACLs.")+'</p>\
            <p>'+tr("You can find further information on the following links:")+'</p>\
            <ul>\
               <li><a href="http://opennebula.org/documentation:rel3.4:auth_overview" target="_blank">Users & Groups subsystem</a></li>\
               <li><a href="http://opennebula.org/documentation:rel3.4:manage_users" target="_blank">Managing users and groups</a></li>\
               <li><a href="http://opennebula.org/documentation:rel3.4:chmod" target="_blank">Managing permissions</a></li>\
               <li><a href="http://opennebula.org/documentation:rel3.4:manage_acl" target="_blank">Using ACLs</a></li>\
            </ul>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
</tr></table>';

var system_tab = {
    title: '<i class="icon-cogs"></i>'+tr("System"),
    content: system_tab_content
}

Sunstone.addMainTab('system_tab',system_tab);

function updateSystemDashboard(what, json_info){
    var db = $('#system_tab',main_tabs_context);
    switch (what){
    case "groups":
        var total_groups=json_info.length;
        $('#system_total_groups',db).html(total_groups);
        break;
    case "users":
        var total_users=json_info.length;
        $('#system_total_users',db).html(total_users);
        break;
    case "acls":
        var total_acls=json_info.length;
        $('#system_total_acls',db).html(total_acls);
        break;
    };
}

$(document).ready(function(){

});