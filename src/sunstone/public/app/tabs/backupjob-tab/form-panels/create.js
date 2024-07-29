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

  //require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var VmsTable = require("tabs/vms-tab/datatable");
  var DatastoresTable = require('tabs/datastores-tab/datatable');
  var ScheduleActions = require("utils/schedule_action");
  var Sunstone = require('sunstone');

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require('hbs!./create/wizard');

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./create/formPanelId');
  var TAB_ID = require('../tabId');
  var RESOURCE = "create_backupjob";
  var INCREMENT = 'INCREMENT'

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'create': {
        'title': Locale.tr("Create BackupJob"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      }
    };

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    var opts = {
      select: true,
      selectOptions: {"multiple_choice": true}
    }
    this.vmsTable = new VmsTable(
      FORM_PANEL_ID + "vmsTable",
      opts,
      {
        name_index: 2 //VM name
      }
    );
  
    this.datastoresTable = new DatastoresTable(
      FORM_PANEL_ID + "datastoresTable",
      opts
    );

    return TemplateWizardHTML({
      formPanelId: this.formPanelId,
      vmsTableHTML: this.vmsTable.dataTableHTML,
      datastoresTableHTML: this.datastoresTable.dataTableHTML,
      tableSchedActions: ScheduleActions.htmlTable(
        resource = RESOURCE,
        leases = false,
        body = ScheduleActions.getScheduleActionTableContent(),
        isVM = true,
        canAdd = true
      )
    });
  }

  function _onShow(dialog) {
    $("#name", dialog).focus();

    this.vmsTable.refreshResourceTableSelect();
    this.datastoresTable.refreshResourceTableSelect();

    dialog.on('change', '#mode', function(e) {
      var value = $(this).val()
      var parent = $("#increment_mode").parent().closest('div')
      if(value === INCREMENT && parent.hasClass("hide")){
        parent.removeClass("hide")
      }else{
        parent.addClass("hide")
      }
    });
  }

  // Set up the create datastore dialog
  function _setup(context) {
    var that = this;
    Tips.setup(context);

    that.vmsTable.initialize({
      externalClick: function(){
        var itemsSelected = that.vmsTable.retrieveResourceTableSelect()
        var itemsSelectedString = itemsSelected.join(",")
        $("#vmsOrdered", context).val(itemsSelectedString);
      }
    });
    that.datastoresTable.initialize();
    ScheduleActions.setupButtons(
      RESOURCE,
      context,
      that
    )

  }


  function _submitWizard(context) {
    var that = this;

    var name  = $('#name', context).val();
    var priority = $("#priority", context).val();

    if(name, priority){
      var fsFreeze = $("#fsFreeze", context).val();
      var keepLast = $("#keepLast",context).val();
      var mode = $("#mode",context).val()
      var increment_mode = $("#increment_mode", context).val()
      var backupVolatile = $("#backupVolatile",context).val()
      var selectedVmsList = $("#vmsOrdered", context).val();
      var selectedDatastoresList = that.datastoresTable.retrieveResourceTableSelect();
      var schedule = ScheduleActions.retrieve(context, false, RESOURCE);

      backupJob = {
        backupjob: {
          NAME: name,
          FS_FREEZE: fsFreeze,
          KEEP_LAST: keepLast,
          MODE: mode,
          BACKUP_VOLATILE: backupVolatile,
          DATASTORE_ID: selectedDatastoresList.join(","),
          PRIORITY: priority,
          BACKUP_VMS: selectedVmsList,
          SCHED_ACTION: schedule
        }
      }

      if(mode === INCREMENT && increment_mode){
        backupJob.backupjob.INCREMENT_MODE = increment_mode
      }

      Sunstone.runAction("BackupJob.create", backupJob);
    }
    return false;
  }
});

