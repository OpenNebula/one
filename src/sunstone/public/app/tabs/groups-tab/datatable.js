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

define(function(require) {
  /*
    DEPENDENCIES
   */

  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var QuotaDefaults = require('utils/quotas/quota-defaults');
  var QuotaWidgets = require('utils/quotas/quota-widgets');

  /*
    CONSTANTS
   */

  var RESOURCE = "Group";
  var XML_ROOT = "GROUP";
  var TAB_NAME = require('./tabId');

  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    this.xmlRoot = XML_ROOT;

    this.dataTableOptions = {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": ["check",4,5,6] },
          {"sWidth": "35px", "aTargets": [0]},
          {"sWidth": "150px", "aTargets": [4,5,6] },
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']}
      ]
    };

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Name"),
      Locale.tr("Users"),
      Locale.tr("VMs"),
      Locale.tr("Memory"),
      Locale.tr("CPU")
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "select_resource": Locale.tr("Please select a Group from the list"),
      "you_selected": Locale.tr("You selected the following Group:"),
      "select_resource_multiple": Locale.tr("Please select one or more groups from the list"),
      "you_selected_multiple": Locale.tr("You selected the following groups:")
    };

    this.totalGroups = 0;

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
    this.totalGroups++;

    var element = element_json[XML_ROOT];

    var users_str = "0";

    if (element.USERS.ID){
      if ($.isArray(element.USERS.ID)){
        users_str = element.USERS.ID.length;
      } else {
        users_str = "1";
      }
    }

    var vms    = '<span class="progress-text right" style="font-size: 12px">-</span>';
    var memory = '<span class="progress-text right" style="font-size: 12px">-</span>';
    var cpu    = '<span class="progress-text right" style="font-size: 12px">-</span>';

    var default_group_quotas = QuotaDefaults.getDefaultGroupQuotas();

    QuotaWidgets.initEmptyQuotas(element);

    if (!$.isEmptyObject(element.VM_QUOTA)){
      vms = QuotaWidgets.quotaBar(
        element.VM_QUOTA.VM.VMS_USED,
        element.VM_QUOTA.VM.VMS,
        default_group_quotas.VM_QUOTA.VM.VMS);

      memory = QuotaWidgets.quotaBarMB(
        element.VM_QUOTA.VM.MEMORY_USED,
        element.VM_QUOTA.VM.MEMORY,
        default_group_quotas.VM_QUOTA.VM.MEMORY);

      cpu = QuotaWidgets.quotaBarFloat(
        element.VM_QUOTA.VM.CPU_USED,
        element.VM_QUOTA.VM.CPU,
        default_group_quotas.VM_QUOTA.VM.CPU);
    }

    return [
      '<input class="check_item" type="checkbox" id="'+RESOURCE.toLowerCase()+'_' +
                           element.ID + '" name="selected_items" value="' +
                           element.ID + '"/>',
      element.ID,
      element.NAME,
      users_str,
      vms,
      memory,
      cpu
    ];
  }

  function _preUpdateView() {
    this.totalGroups = 0;
  }

  function _postUpdateView() {
    $(".total_groups").text(this.totalGroups);
  }
});
