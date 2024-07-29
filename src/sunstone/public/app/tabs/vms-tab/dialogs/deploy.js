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
  var TemplateHTML = require('hbs!./deploy/html');
  var Sunstone = require('sunstone');
  var DatastoresTable = require('tabs/datastores-tab/datatable');
  var HostsTable = require('tabs/hosts-tab/datatable');
  var Notifier = require('utils/notifier');
  var Tips = require('utils/tips');
  var Config = require('sunstone-config');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./deploy/dialogId');
  var TAB_ID = require('../tabId')

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    this.hostsTable = new HostsTable('deploy_vm', {'select': true});
    this.datastoresTable = new DatastoresTable('deploy_vm_ds', {
      'select': true,
      'selectOptions': {
        'filter_fn': function(ds) { return ds.TYPE == 1; } // Show system DS only
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
      'dialogId': this.dialogId,
      'hostsTableHTML': this.hostsTable.dataTableHTML,
      'datastoresTableHTML': this.datastoresTable.dataTableHTML
    });
  }

  function _setup(context) {
    var that = this;

    that.hostsTable.initialize();
    that.datastoresTable.initialize();

    Tips.setup(context);

    $("#enforce", context).attr("checked", Config.isFeatureEnabled("deploy_enforce"));

    $('#' + DIALOG_ID + 'Form', context).submit(function() {
      var extra_info = {};

      if ($("#selected_resource_id_deploy_vm", context).val()) {
          extra_info['host_id'] = $("#selected_resource_id_deploy_vm", context).val();
      } else {
          Notifier.notifyError(Locale.tr("You have not selected a host"));
          return false;
      }

      extra_info['ds_id'] = $("#selected_resource_id_deploy_vm_ds", context).val() || -1
      extra_info['enforce'] = $("#enforce", this).is(":checked") ? true : false

      $.each(Sunstone.getDataTable(TAB_ID).elements(), function(index, elem) {
          Sunstone.runAction("VM.deploy_action", elem, extra_info);
      });

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      return false;
    });

    return false;
  }

  function _onShow(dialog) {
    this.setNames( {tabId: TAB_ID} );
    this.datastoresTable.resetResourceTableSelect();
    this.hostsTable.resetResourceTableSelect();

    return false;
  }
});
