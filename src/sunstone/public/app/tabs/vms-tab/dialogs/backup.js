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
  
    var BaseDialog = require("utils/dialogs/dialog");
    var TemplateHTML = require("hbs!./backup/html");
    var Sunstone = require("sunstone");
    var DatastoreTable = require("tabs/datastores-tab/datatable");
    var OpenNebulaDatastore = require("opennebula/datastore");
  
    /*
      CONSTANTS
     */
  
    var DIALOG_ID = require("./backup/dialogId");
    var VMS_TAB_ID = require("tabs/vms-tab/tabId");
  
    /*
      CONSTRUCTOR
     */
  
    function Dialog() {
      this.dialogId = DIALOG_ID;
  
      this.datastoreTable = new DatastoreTable("vm_backup", {
        "select": true,
        "selectOptions": {
          "filter_fn": function(ds) {
            return ds.TYPE == OpenNebulaDatastore.TYPES.BACKUP_DS;
          }
        }
      });
  
      BaseDialog.call(this);
    };
  
    Dialog.DIALOG_ID = DIALOG_ID;
    Dialog.prototype = Object.create(BaseDialog.prototype);
    Dialog.prototype.constructor = Dialog;
    Dialog.prototype.html = _html;
    Dialog.prototype.onShow = _onShow;
    Dialog.prototype.setup = _setup;
  
    return Dialog;
  
    /*
      FUNCTION DEFINITIONS
     */
  
    function _html() {
      return TemplateHTML({
        "dialogId": this.dialogId,
        "datastoreTableSelectHTML": this.datastoreTable.dataTableHTML
      });
    }
  
    function _setup(dialog) {
      var that = this;
      that.datastoreTable.initialize();
  
      $("#" + DIALOG_ID + "Form", dialog).submit(function() {
        var sel_elems = Sunstone.getDataTable(VMS_TAB_ID).elements();
  
        var extra_info = {
          "reset":$("#cb_backup_reset", dialog).prop("checked")
        };
  
        var targetDS = that.datastoreTable.retrieveResourceTableSelect();
        extra_info["dst_id"] = targetDS;
  
        if (sel_elems.length > 1) {
          for (var i = 0; i < sel_elems.length; i++) {
            Sunstone.runAction("VM.backup", sel_elems[i], extra_info);
          }
        } else {
          Sunstone.runAction("VM.backup", sel_elems[0], extra_info);
        }
  
        Sunstone.getDialog(DIALOG_ID).hide();
        Sunstone.getDialog(DIALOG_ID).reset();
        setTimeout(function() {
          Sunstone.runAction("VM.refresh");
        }, 1500);
        return false;
      });
  
      return false;
    }
  
    function _onShow(dialog) {
      var sel_elems = Sunstone.getDataTable(VMS_TAB_ID).elements({names: true});
  
      this.setNames( {elements: sel_elems} );
  
      this.datastoreTable.resetResourceTableSelect();
  
      return false;
    }
  });
  