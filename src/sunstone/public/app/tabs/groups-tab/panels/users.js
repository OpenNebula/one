/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

define(function(require) {
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var TemplateHTML = require('hbs!./users/html');
  var UsersTable = require('tabs/users-tab/datatable');
  var Sunstone = require('sunstone');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./users/panelId');
  var RESOURCE = "Group";
  var XML_ROOT = "GROUP";

  var USERS_TABLE_ID = PANEL_ID + "UsersTable";
  var USERS_EDIT_TABLE_ID = PANEL_ID + "UsersTableEdit";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Users");
    this.icon = "fa-users";

    this.element = info[XML_ROOT];

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {

    this.users = [];

    if (this.element.USERS.ID != undefined){
      this.users = this.element.USERS.ID;

      if (!Array.isArray(this.users)){
        this.users = [this.users];
      }
    }

    this.admins = [];

    if (this.element.ADMINS.ID != undefined){
      this.admins = this.element.ADMINS.ID;

      if (!Array.isArray(this.admins)){
        this.admins = [this.admins];
      }
    }

    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: this.users,
        starred_ids: this.admins
      }
    };

    this.usersTable = new UsersTable(USERS_TABLE_ID, opts);

    return TemplateHTML({
      'usersTableHTML': this.usersTable.dataTableHTML
    });
  }

  function _setup(context) {
    var that = this;

    this.usersTable.initialize();
    this.usersTable.refreshResourceTableSelect();

    if (Config.isTabActionEnabled("groups-tab", "Group.edit_admins")) {
      context.off("click", "#edit_admins_button");
      context.on("click",  "#edit_admins_button", function() {
        $("#edit_admins_button", context).hide();
        $("#cancel_admins_button", context).show();
        $("#submit_admins_button", context).show();

        var opts = {
          info: false,
          select: true,
          selectOptions: {
            multiple_choice: true,
            fixed_ids: that.users,
            starred_ids: that.admins
          }
        };

        that.usersTableEdit = new UsersTable(USERS_EDIT_TABLE_ID, opts);

        $("div.group_users_info_table", context).html(
          that.usersTableEdit.dataTableHTML );

        that.usersTableEdit.initialize();
        that.usersTableEdit.selectResourceTableSelect({ ids : that.admins });

        return false;
      });

      context.off("click", "#cancel_admins_button");
      context.on("click",  "#cancel_admins_button", function() {
        Sunstone.runAction("Group.show", that.element.ID);
        return false;
      });

      context.off("click", "#submit_admins_button");
      context.on("click",  "#submit_admins_button", function() {
        // Add/delete admins

        var selected_admins_list =
            that.usersTableEdit.retrieveResourceTableSelect(context,
                                                      "group_users_edit_list");

        $.each(selected_admins_list, function(i,admin_id){
          if (that.admins.indexOf(admin_id) == -1){
            Sunstone.runAction("Group.add_admin",
                  that.element.ID, {admin_id : admin_id});
          }
        });

        $.each(that.admins, function(i,admin_id){
          if (selected_admins_list.indexOf(admin_id) == -1){
            Sunstone.runAction("Group.del_admin",
                  that.element.ID, {admin_id : admin_id});
          }
        });

        return false;
      });
    }
  }
});
