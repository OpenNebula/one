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
  
    var BaseDialog = require('utils/dialogs/dialog');
    var TemplateHTML = require('hbs!./editVms/html');
    var Sunstone = require('sunstone');
    var Tips = require('utils/tips');
    var VmsTable = require("tabs/vms-tab/datatable");
    var TemplateUtils = require('utils/template-utils');

    /*
      CONSTANTS
     */
  
    var DIALOG_ID = require('./editVms/dialogId');
    var TAB_ID = require('../tabId')
  
    /*
      CONSTRUCTOR
     */
  
    function Dialog() {
      this.dialogId = DIALOG_ID;
  
      BaseDialog.call(this);
    };
  
    Dialog.DIALOG_ID = DIALOG_ID;
    Dialog.prototype = Object.create(BaseDialog.prototype);
    Dialog.prototype.constructor = Dialog;
    Dialog.prototype.html = _html;
    Dialog.prototype.setup = _setup;
    Dialog.prototype.setElement = _setElement;
    Dialog.prototype.setVMPool = _setVMPool;
    Dialog.prototype.onShow = _onShow;
  
    return Dialog;
  
    /*
      FUNCTION DEFINITIONS
     */
  
    function _html() {
        var opts = {
          select: true,
          selectOptions: {"multiple_choice": true}
        }

        this.vmsDataTable = new VmsTable(
          DIALOG_ID + "vmsTable",
          opts,
          {
            name_index: 2 //VM name
          }
        );

        var vms = this.element && this.element.TEMPLATE && this.element.TEMPLATE.BACKUP_VMS? this.element.TEMPLATE.BACKUP_VMS : ""

        return TemplateHTML({
            'dialogId': this.dialogId+"DataTable",
            'vmsTabHTML': this.vmsDataTable.dataTableHTML,
            'vms': vms
        });
    }
  
    function _setup(context) {
        var that = this;
        that.vmsDataTable.initialize({
          externalClick: function(){
            var itemsSelected = that.vmsDataTable.retrieveResourceTableSelect()
            var itemsSelectedString = itemsSelected.join(",")
            $("#vmsOrdered", context).val(itemsSelectedString);
          }
        });

        that.vmsDataTable.refreshResourceTableSelect();
        
        Tips.setup(context);
        var selectedVmsList = $("#vmsOrdered", context).val();
        

        $('#' + DIALOG_ID + 'DataTableForm', context).submit(function() {
          var selectedVmsList = $("#vmsOrdered", context).val();

          var template = that.element.TEMPLATE
          template.BACKUP_VMS = selectedVmsList
          template_str  = TemplateUtils.templateToString(template, undefined);
          Sunstone.runAction("BackupJob.update_template", that.element.ID, template_str);
          Sunstone.getDialog(DIALOG_ID).hide();
          Sunstone.getDialog(DIALOG_ID).reset();
          return false;
        });
        return false;
    }
  
    function _onShow(context) {
        return false;
    }

    function _setElement(element) {
        this.element = element
    }

    function _setVMPool(vmPool) {
        this.vmPool = vmPool
    }
  });
  