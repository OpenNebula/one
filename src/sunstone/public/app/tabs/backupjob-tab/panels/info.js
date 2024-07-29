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
  var PermissionsTable = require('utils/panel/permissions-table');
  var RenameTr = require('utils/panel/rename-tr');
  var ChangePriorityTr = require('../utils/changePriority-tr');
  var TemplateTable = require('utils/panel/template-table');
  var Humanize = require('utils/humanize');
  var BackupJobState = require('../utils/status');
  
  /*
    TEMPLATES
   */

  var TemplateInfo = require('hbs!./info/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./info/panelId');
  var RESOURCE = "BackupJob"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Info");
    this.icon = "fa-info-circle";

    this.element = info[RESOURCE.toUpperCase()];

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
    var renameTrHTML = RenameTr.html(TAB_ID, RESOURCE, this.element.NAME);
    var changePriorityTrHTML = ChangePriorityTr.html(TAB_ID, RESOURCE, this.element.PRIORITY)
    var attributes = TemplateTable.getTemplatesAttributes(this.element.TEMPLATE)
    
    //remove the schedule actions
    if(attributes && attributes.general && attributes.general.SCHED_ACTION){
      delete attributes.general.SCHED_ACTION
    }

    var templateTableHTML = TemplateTable.html(attributes.general, RESOURCE, Locale.tr("Attributes"), false);
    var permissionsTableHTML = PermissionsTable.html(TAB_ID, RESOURCE, this.element);
    var last_backup = this.element.LAST_BACKUP_TIME ? 
      this.element.LAST_BACKUP_TIME === '0' ? '-' : Humanize.prettyTime(this.element.LAST_BACKUP_TIME) : "-";
    var stateStr = BackupJobState.state(this.element)

    return TemplateInfo({
      'element': this.element,
      'lastBackup': last_backup,
      'stateStr': stateStr,
      'renameTrHTML': renameTrHTML,
      'changePriorityTrHTML': changePriorityTrHTML,
      'templateTableHTML': templateTableHTML,
      'permissionsTableHTML': permissionsTableHTML,
    });
  }

  function _setup(context) {
    RenameTr.setup(TAB_ID, RESOURCE, this.element.ID, context);
    ChangePriorityTr.setup(TAB_ID, RESOURCE, this.element.ID, context)
    PermissionsTable.setup(TAB_ID, RESOURCE, this.element, context);

    var attributes = TemplateTable.getTemplatesAttributes(this.element.TEMPLATE)

    // General Attributes section
    TemplateTable.setup(attributes.general, RESOURCE, this.element.ID, context, undefined, attributes.vcenter);
    return false;
  }
});
