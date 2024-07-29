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

  var TabDataTable = require("utils/tab-datatable");
  var SunstoneConfig = require("sunstone-config");
  var Locale = require("utils/locale");
  var TemplateUtils = require("utils/template-utils");
  var LabelsUtils = require("utils/labels/utils");
  var SearchDropdown = require("hbs!./datatable/search");
  var Status = require("utils/status");

  /*
    CONSTANTS
   */

  var RESOURCE = "VMGroup";
  var XML_ROOT = "VM_GROUP";
  var TAB_NAME = require("./tabId");
  var LABELS_COLUMN = 6;
  var SEARCH_COLUMN = 7;
  var TEMPLATE_ATTR = "TEMPLATE";

  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    this.xmlRoot = XML_ROOT;
    this.labelsColumn = LABELS_COLUMN;

    this.dataTableOptions = {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check"]},
          {"sWidth": "35px", "aTargets": [0]},
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ["_all"]},
          {"sType": "num", "aTargets": [1]}
      ]
    };

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Name"),
      Locale.tr("Owner"),
      Locale.tr("Group"),
      Locale.tr("VMs"),
      Locale.tr("Labels"),
      "search_data"
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "select_resource": Locale.tr("Please select a vm group from the list"),
      "you_selected": Locale.tr("You selected the following vm group:"),
      "select_resource_multiple": Locale.tr("Please select one or more vm groups from the list"),
      "you_selected_multiple": Locale.tr("You selected the following vm groups:")
    };

    this.totalVMGroups = 0;
    this.totalVMs = 0;

    this.conf.searchDropdownHTML = SearchDropdown({tableId: this.dataTableId});
    this.searchColumn = SEARCH_COLUMN;

    TabDataTable.call(this);
  }

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.preUpdateView = _preUpdateView;
  Table.prototype.postUpdateView = _postUpdateView;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    var element = element_json[XML_ROOT];
    var numVms = 0;
    this.totalVMGroups++;

    if(!Array.isArray(element.ROLES.ROLE)){
      element.ROLES.ROLE = [element.ROLES.ROLE];
    }

    for(role_index in element.ROLES.ROLE){
      if(element && element.ROLES && element.ROLES.ROLE && element.ROLES.ROLE[role_index] && element.ROLES.ROLE[role_index].VMS){
        var vms = element.ROLES.ROLE[role_index].VMS;
        var vms = vms.split(",");
        numVms += vms.length;
      }
    }
    this.totalVMs += numVms;

    var search = {
      NAME:  element.NAME,
      UNAME: element.UNAME,
      GNAME: element.GNAME
    };

    var color_html = Status.state_lock_to_color("VMGROUP", false, element_json[XML_ROOT]["LOCK"]);

    return [
      "<input class=\"check_item\" type=\"checkbox\" "+
                          "style=\"vertical-align: inherit;\" id=\""+this.resource.toLowerCase()+"_" +
                           element.ID + "\" name=\"selected_items\" value=\"" +
                           element.ID + "\"/>"+color_html,
        element.ID,
        element.NAME,
        element.UNAME,
        element.GNAME,
        numVms,
        (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||""),
        btoa(unescape(encodeURIComponent(JSON.stringify(search))))
    ];
  }

  function _preUpdateView() {
    this.totalVMGroups = 0;
    this.totalVMs= 0;
  }

  function _postUpdateView() {
    $(".total_vmgroup").text(this.totalVMGroups);
    $(".total_vms_vmgroup").text(this.totalVMs);
  }

});
