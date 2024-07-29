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
  var VmsTable = require('tabs/vms-tab/datatable');
  var TemplateVms = require('hbs!./vms/html');
  var TemplateInfoError = require("hbs!utils/info-error/html");
  var TemplateUtils = require("utils/template-utils");
  var EDIT_VMS_DIALOG_ID = require('../dialogs/editVms/dialogId');
  var Sunstone = require("sunstone");
  var Tips = require('utils/tips');
  var OpenNebulaAction = require("opennebula/action");
  var OpenNebula = require("opennebula");

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./vms/panelId');
  var VMS_TABLE_ID = PANEL_ID + "VmsTable"
  var VMS_ERROR_TABLE_ID = PANEL_ID + "VmsErrorTable"
  var VMS_BACKINGUP_TABLE_ID = PANEL_ID + "VmsBackingUpTable"
  var VMS_OUTDATED_TABLE_ID = PANEL_ID + "VmsOutdatedTable"
  var VMS_UPDATED_TABLE_ID = PANEL_ID + "VmsUpdatedTable"
  var RESOURCE = "BackupJob"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("VMs");
    this.icon = "fa-server";

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

  function setVarsDatatable(element, key){
    if(element && element[key] && element[key].ID) {
      const ids = element[key].ID
      return Array.isArray(ids)? ids : [ids]
    }
    return []
  }

  function createDatatable(name, ids) {
    return new VmsTable(name, {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: ids
      }
    })
  }

  function initializeDatatable(datatable){
    datatable.initialize();
    datatable.refreshResourceTableSelect();
  }
 
  function emptyFunction() {}

  function getVmPool(callbacks, element){
    function emptyFunction() {}
    var success = callbacks && typeof callbacks.success === 'function'? callbacks.success : emptyFunction
    var error = callbacks && typeof callbacks.error === 'function'? callbacks.error : emptyFunction

    var vm_pool = OpenNebulaAction.cache("VM");
    if(vm_pool && vm_pool.data){
      success(vm_pool.data, element);
    }else{
      OpenNebula.VM.list({
        timeout: true,
        success: function (request, item_list){
          if(item_list){
            success(item_list, element);
          }
        },
        error: function(){
          if(errorCallback && typeof errorCallback === "function"){
            error();
          }
        }
      });
    }
  }

  function openDialog(vmpool, element){
    var dialog = Sunstone.getDialog(EDIT_VMS_DIALOG_ID);
    dialog.setElement(element);
    dialog.setVMPool(vmpool);
    dialog.reset();
    dialog.show();
  }

  function _html() {
    var vms = [];

    if (this.element && this.element.TEMPLATE && this.element.TEMPLATE.BACKUP_VMS != undefined){
      vms = this.element.TEMPLATE.BACKUP_VMS.split(",")
    }

    var errorMessageHTML = "";
    if (this.element &&
      this.element.TEMPLATE &&
      this.element.TEMPLATE.ERROR){
        errorMessageHTML = TemplateInfoError(
          {
            error_msg: this.element.TEMPLATE.ERROR,
            error_title: Locale.tr("BackupJob Error"),
            canDismiss: true,
            dismissId: "close_vm_async_error",
            textDismiss: "Retry",
            size: 12
          }
        );
    } 

    var errorVms = setVarsDatatable(this.element, 'ERROR_VMS')
    var vmsBackingUp = setVarsDatatable(this.element, 'BACKING_UP_VMS')
    var vmsOutdated = setVarsDatatable(this.element, 'OUTDATED_VMS')
    var vmsUpdated = setVarsDatatable(this.element, 'UPDATED_VMS')

    this.vmsDataTable = createDatatable(VMS_TABLE_ID, vms) 

    this.vmsErrorDataTable = createDatatable(VMS_ERROR_TABLE_ID, errorVms)

    this.vmsBackingUpDataTable = createDatatable(VMS_BACKINGUP_TABLE_ID, vmsBackingUp) 

    this.vmsOutdatedDataTable = createDatatable(VMS_OUTDATED_TABLE_ID, vmsOutdated)

    this.vmsUpdatedDataTable = createDatatable(VMS_UPDATED_TABLE_ID, vmsUpdated)

    return TemplateVms({
      'datatableVms': this.vmsDataTable.dataTableHTML,
      'errorMessageHTML': errorMessageHTML,
      'datatableVmsError': this.vmsErrorDataTable.dataTableHTML,
      'datatableVmsBackingUp': this.vmsBackingUpDataTable.dataTableHTML,
      'datatableVmsOutdated': this.vmsOutdatedDataTable.dataTableHTML,
      'datatableVmsUpdated': this.vmsUpdatedDataTable.dataTableHTML
    });
  }

  function _setup(context) {
    var that = this;
    Tips.setup(context);
    initializeDatatable(this.vmsDataTable)
    initializeDatatable(this.vmsErrorDataTable)
    initializeDatatable(this.vmsBackingUpDataTable)
    initializeDatatable(this.vmsOutdatedDataTable)
    initializeDatatable(this.vmsUpdatedDataTable)

    context.off("click", "#close_vm_async_error");
    context.on("click", "#close_vm_async_error", function() {
      var resourceId = that.element.ID;

      Sunstone.runAction(RESOURCE + ".retry", resourceId);
    });

    context.off('click', '#editVmsButton');
    context.on('click', '#editVmsButton', function() {
      getVmPool(
        {
          success: openDialog,
        }, 
        that.element
      )
      return false;
    });

    return false;
  }
})
