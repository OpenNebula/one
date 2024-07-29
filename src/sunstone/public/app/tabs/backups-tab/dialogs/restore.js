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
  var TemplateHTML = require("hbs!./restore/html");
  var Sunstone = require("sunstone");
  var DatastoreTable = require("tabs/datastores-tab/datatable");
  var OpenNebulaDatastore = require("opennebula/datastore");

  /*
    CONSTANTS
   */

  var DIALOG_ID = require("./restore/dialogId");
  var BACKUPS_TAB_ID = require("tabs/backups-tab/tabId");

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    this.datastoreTable = new DatastoreTable("backup_restore", {
      "select": true,
      "selectOptions": {
        "filter_fn": function(ds) {
          return ds.TYPE == OpenNebulaDatastore.TYPES.IMAGE_DS;
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
      var sel_elems = Sunstone.getDataTable(BACKUPS_TAB_ID).elements();

      var extra_info = {};

      var targetDS = that.datastoreTable.retrieveResourceTableSelect();
      extra_info["dst_id"] = targetDS;
      
      var noNIC = $("#restore_no_nic", dialog).prop('checked')
      var noIP = $("#restore_no_ip", dialog).prop('checked')
      var name = $("#restore_name", dialog).val()
      var incrementId = $("#restore_increment_id", dialog).val()
      var restore_opts = ""

      if (noNIC) {
        restore_opts += 'NO_NIC="YES"\n'
      }
      
      if (noIP) {
        restore_opts += 'NO_IP="YES"\n'
      }

      if (name && name !== '') {
        restore_opts += 'NAME="' + name + '"\n'
      }

      if (incrementId && incrementId !== '') {
        restore_opts += 'INCREMENT_ID="' + incrementId + '"\n'
      }

      extra_info["restore_opts"] = restore_opts;      

      if (sel_elems.length > 1) {
        for (var i = 0; i < sel_elems.length; i++) {
          Sunstone.runAction("Backup.restore", sel_elems[i], extra_info);
        }
      } else {
        Sunstone.runAction("Backup.restore", sel_elems[0], extra_info);
      }

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      setTimeout(function() {
        Sunstone.runAction("Backup.refresh");
      }, 1500);
      return false;
    });

    return false;
  }

  function _onShow(dialog) {
    var sel_elems = Sunstone.getDataTable(BACKUPS_TAB_ID).elements({names: true});

    this.setNames( {elements: sel_elems} );

    this.datastoreTable.resetResourceTableSelect();

    return false;
  }
});
