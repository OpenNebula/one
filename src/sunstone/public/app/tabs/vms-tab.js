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
  var Locale = require("utils/locale");
  var Buttons = require("./vms-tab/buttons");
  var Actions = require("./vms-tab/actions");
  var Table = require("./vms-tab/datatable");
  var TAB_ID = require("./vms-tab/tabId");
  var DATATABLE_ID = "dataTableVms";

  var _dialogs = [
    require("./vms-tab/dialogs/deploy"),
    require("./vms-tab/dialogs/migrate"),
    require("./vms-tab/dialogs/resize"),
    require("./vms-tab/dialogs/attach-disk"),
    require("./vms-tab/dialogs/disk-snapshot"),
    require("./vms-tab/dialogs/disk-saveas"),
    require("./vms-tab/dialogs/disk-snapshot-rename"),
    require("./vms-tab/dialogs/disk-resize"),
    require("./vms-tab/dialogs/attach-nic"),
    require("./vms-tab/dialogs/attach-sg"),
    require("./vms-tab/dialogs/snapshot"),
    require("./vms-tab/dialogs/revert"),
    require("./vms-tab/dialogs/saveas-template"),
    require("./vms-tab/dialogs/backup"),
    require("./vms-tab/dialogs/update-nic")
  ];

  var _panelsHooks = [
    require("./vms-tab/hooks/header"),
    require("./vms-tab/hooks/state")
  ];

  var _panels = [
    require("./vms-tab/panels/info"),
    require("./vms-tab/panels/capacity"),
    require("./vms-tab/panels/storage"),
    require("./vms-tab/panels/network"),
    require("./vms-tab/panels/snapshots"),
    require("./vms-tab/panels/placement"),
    require("./vms-tab/panels/actions"),
    require("./vms-tab/panels/conf"),
    require("./vms-tab/panels/template"),
    require("./vms-tab/panels/log")
  ];

  var _formPanels = [
    require("./vms-tab/form-panels/create"),
    require("./vms-tab/form-panels/updateconf")
  ];

  var Tab = {
    tabId: TAB_ID,
    title: Locale.tr("VMs"),
    icon: "fa-th",
    tabClass: "subTab",
    parentTab: "instances-top-tab",
    listHeader: Locale.tr("VMs"),
    infoHeader: Locale.tr("VM"),
    lockable: true,
    subheader: "<span class=\"total_vms\"/> <small>" + Locale.tr("TOTAL") + "</small>&emsp;\
        <span class=\"active_vms\"/> <small>" + Locale.tr("ACTIVE") + "</small>&emsp;\
        <span class=\"off_vms\"/> <small>" + Locale.tr("OFF") + "</small>&emsp;\
        <span class=\"pending_vms\"/> <small>" + Locale.tr("PENDING") + "</small>&emsp;\
        <span class=\"failed_vms\"/> <small>" + Locale.tr("FAILED") + "</small>",
    resource: "VM",
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true}),
    panels: _panels,
    panelsHooks: _panelsHooks,
    formPanels: _formPanels,
    dialogs: _dialogs
  };

  return Tab;
});
