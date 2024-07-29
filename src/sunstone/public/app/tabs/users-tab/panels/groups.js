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

  var Locale = require("utils/locale");
  var GroupsTable = require("tabs/groups-tab/datatable");
  var TemplateChgrpTr = require("hbs!./info/chgrp-tr");
  var ResourceSelect = require("utils/resource-select");
  var Sunstone = require("sunstone");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./groups/html");

  /*
    CONSTANTS
   */

  var PANEL_ID = require("./groups/panelId");
  var GROUPS_TABLE_ID = PANEL_ID + "GroupsTable";
  var RESOURCE = "User";
  var XML_ROOT = "USER";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Groups");
    this.icon = "fa-users";

    this.element = info[XML_ROOT];
    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;
   Panel.prototype.onShow = _onShow;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var groups;
    var groupTrHTML = TemplateChgrpTr({"element": this.element});
    if (this.element.GROUPS !== undefined && this.element.GROUPS.ID !== undefined) {
      if (Array.isArray(this.element.GROUPS.ID)) {
        groups = this.element.GROUPS.ID;
      } else {
        groups = [this.element.GROUPS.ID];
      }
    } else {
      groups = [];
    }
    this.groups = groups;
    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: this.groups
      }
    };
    this.groupsTable = new GroupsTable(GROUPS_TABLE_ID, opts);
    this.groupsTableEdit = new GroupsTable("user_groups_edit", {
        info: false,
        select: true,
        selectOptions: {
          "multiple_choice": true
        }
      });

    return TemplateHTML({
      "groupsTableHTML": this.groupsTable.dataTableHTML,
      "groupsTableEditHTML": this.groupsTableEdit.dataTableHTML,
      "element": this.element
    });
  }

  function _setup(context) {
    this.groupsTable.initialize();
    this.groupsTable.refreshResourceTableSelect();
    this.groupsTableEdit.initialize();
    this.groupsTableEdit.refreshResourceTableSelect();
    this.groupsTableEdit.selectResourceTableSelect({ids: this.groups});
    var that = this;

    $("#cancel_update_group").hide();
    var that = this;
    context.off("click", "#update_group");
    context.on("click", "#update_group", function() {
      ResourceSelect.insert({
        context: $("#choose_primary_grp", context),
        resourceName: "Group",
        callback : function(response){
          $("#choose_primary_grp").html(response[0].outerHTML);
          $(".resource_list_select option[elem_id=" + that.element.GID + "]").prop("selected", true);
        }
      });
      $(".show_labels").hide();
      $(".select_labels").show();
      $("#submit-group").show();
    });

    context.off("click", "#cancel_update_group");
    context.on("click", "#cancel_update_group", function() {
      $(".select_labels").hide();
      $(".show_labels").show();
      $("#submit-group").hide();
    });

    $("#Form_change_second_grp").submit(function() {
      var selectPrimaryGrp = $("#choose_primary_grp  .resource_list_select").val();
      var selectedGroupsList = that.groupsTableEdit.retrieveResourceTableSelect();

      if (selectPrimaryGrp != -1 && selectPrimaryGrp != that.element.GID) {
        Sunstone.runAction("User.chgrp", [that.element.ID], selectPrimaryGrp);
      }

      $.each(selectedGroupsList, function(index, groupId) {
        if ($.inArray(groupId, that.groups) === -1) {
          Sunstone.runAction("User.addgroup", [that.element.ID], groupId);
        }
      });

      $.each(that.groups, function(index, groupId) {
        if ($.inArray(groupId, selectedGroupsList) === -1) {
          Sunstone.runAction("User.delgroup", [that.element.ID], groupId);
        }
      });

      $(".select_labels").hide();
      $(".show_labels").show();
      setTimeout(function() {
       Sunstone.runAction('User.refresh');
       Sunstone.runAction("User.refresh");
      }, 1500);

      return false;
    });
    return false;
  }

  function _onShow() {
    this.groupsTableEdit.refreshResourceTableSelect();
    this.groupsTableEdit.selectResourceTableSelect({ids: this.groups});
  }
});
