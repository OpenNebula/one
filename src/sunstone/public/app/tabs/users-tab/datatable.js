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

  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var QuotaDefaults = require('utils/quotas/quota-defaults');
  var QuotaWidgets = require('utils/quotas/quota-widgets');
  var TemplateUtils = require('utils/template-utils');
  var LabelsUtils = require('utils/labels/utils');
  var SearchDropdown = require('hbs!./datatable/search');
  var DashboardUtils = require('utils/dashboard');
  var Status = require('utils/status');

  /*
    CONSTANTS
   */

  var RESOURCE = "User";
  var XML_ROOT = "USER";
  var TAB_NAME = require('./tabId');
  var LABELS_COLUMN = 12;
  var SEARCH_COLUMN = 13;
  var TEMPLATE_ATTR = 'TEMPLATE';

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
          {"bSortable": false, "aTargets": ["check",6,7,8] },
          {"sWidth": "35px", "aTargets": [0]},
          {"sWidth": "150px", "aTargets": [6,7,8] },
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']},
          {"sType": "num", "aTargets": [1]}
      ]
    };

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Name"),
      Locale.tr("Group"),
      Locale.tr("Enabled"),
      Locale.tr("Auth driver"),
      Locale.tr("Password"),
      Locale.tr("VMs"),
      Locale.tr("Memory"),
      Locale.tr("CPU"),
      Locale.tr("Group ID"),
      Locale.tr("Hidden User Data"),
      Locale.tr("Labels"),
      "search_data"
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "select_resource": Locale.tr("Please select a User from the list"),
      "you_selected": Locale.tr("You selected the following User:"),
      "select_resource_multiple": Locale.tr("Please select one or more users from the list"),
      "you_selected_multiple": Locale.tr("You selected the following users:")
    };

    this.totalUsers = 0;

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
    this.totalUsers++;

    var element = element_json[XML_ROOT];

    var vms    = '<span class="progress-text right" style="font-size: 12px">-</span>';
    var memory = '<span class="progress-text right" style="font-size: 12px">-</span>';
    var cpu    = '<span class="progress-text right" style="font-size: 12px">-</span>';

    var default_user_quotas = QuotaDefaults.getDefaultUserQuotas();

    QuotaWidgets.initEmptyQuotas(element);

    if (!$.isEmptyObject(element.VM_QUOTA)){
      vms = QuotaWidgets.quotaBar(
        element.VM_QUOTA.VM.VMS_USED,
        element.VM_QUOTA.VM.VMS,
        default_user_quotas.VM_QUOTA.VM.VMS);

      memory = QuotaWidgets.quotaBarMB(
        element.VM_QUOTA.VM.MEMORY_USED,
        element.VM_QUOTA.VM.MEMORY,
        default_user_quotas.VM_QUOTA.VM.MEMORY);

      cpu = QuotaWidgets.quotaBarFloat(
        element.VM_QUOTA.VM.CPU_USED,
        element.VM_QUOTA.VM.CPU,
        default_user_quotas.VM_QUOTA.VM.CPU);
    }

    // Build hidden user template
    var hidden_template = TemplateUtils.htmlEncode(TemplateUtils.templateToString(element));

    var search = {
      NAME:  element.NAME,
      GNAME: element.GNAME,
      PASSWORD: element.PASSWORD,
      AUTH_DRIVER: element.AUTH_DRIVER
    }

    var color_html = Status.state_lock_to_color("USER",false, element_json[XML_ROOT]["LOCK"]);

    return [
      '<input class="check_item" type="checkbox" '+
                          'style="vertical-align: inherit;" id="'+this.resource.toLowerCase()+'_' +
                           element.ID + '" name="selected_items" value="' +
                           element.ID + '"/>'+color_html,
      element.ID,
      element.NAME,
      element.GNAME,
      (element.ENABLED == 1 ? Locale.tr("Yes") : Locale.tr("No")),
      element.AUTH_DRIVER,
      element.PASSWORD,
      vms,
      memory,
      cpu,
      element.GID,
      hidden_template,
      (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||''),
      btoa(unescape(encodeURIComponent(JSON.stringify(search))))
    ];
  }

  function _preUpdateView() {
    this.totalUsers = 0;
  }

  function _postUpdateView() {
    $(".total_users").removeClass("fadeinout");
    DashboardUtils.counterAnimation(".total_users", this.totalUsers);
  }
});
