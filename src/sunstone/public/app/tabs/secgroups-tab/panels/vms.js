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

define(function(require){
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var VMsTable = require('tabs/vms-tab/datatable');
  var Template = require('hbs!./vms/html');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./vms/panelId');
  var VMS_TABLE_ID = PANEL_ID + "VMsTable"
  
  var RESOURCE = "SecurityGroup";
  var XML_ROOT = "SECURITY_GROUP";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("VMs");
    this.icon = "fa-th";

    this.element = info[XML_ROOT];

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var ids;

    var updatingIds = _getIds(this.element.UPDATING_VMS.ID);
    updatingIds = updatingIds.concat( _getIds(this.element.OUTDATED_VMS.ID) );

    var ids = _getIds(this.element.UPDATED_VMS.ID);
    ids = ids.concat( updatingIds );

    var opt = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: ids,
        starred_ids: updatingIds,
        starred_icon: '<i class="fas fa-exclamation-triangle fa-fw"></i>'
      }
    };

    this.vmsDataTable = new VMsTable(PANEL_ID + '_UPDATED', opt);

    ids = _getIds(this.element.ERROR_VMS.ID);
    this.errorDataTable = new VMsTable(PANEL_ID + '_ERROR', _buildOpts(ids));

    var allUpdated = (this.element.UPDATING_VMS.ID == undefined &&
                      this.element.OUTDATED_VMS.ID == undefined &&
                      this.element.ERROR_VMS.ID == undefined);

    return Template({
      'allUpdated': allUpdated,
      'vmsTableHTML': this.vmsDataTable.dataTableHTML,
      'errorTableHTML': this.errorDataTable.dataTableHTML
    });
  }

  function _getIds(attr){
    var ids = [];

    if (attr != undefined){
      ids = attr;

      if (!Array.isArray(ids)){
        ids = [ids];
      }
    }

    return ids;
  }

  function _buildOpts(ids){
    return {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: ids
      }
    };
  }

  function _setup(context) {
    this.vmsDataTable.initialize();
    this.vmsDataTable.refreshResourceTableSelect();

    this.errorDataTable.initialize();
    this.errorDataTable.refreshResourceTableSelect();

    return false;
  }
})
