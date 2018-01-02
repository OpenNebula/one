/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
  var TemplateHTML = require('hbs!./migrate/html');
  var Sunstone = require('sunstone');
  var DatastoresTable = require('tabs/datastores-tab/datatable');
  var HostsTable = require('tabs/hosts-tab/datatable');
  var Notifier = require('utils/notifier');
  var Tips = require('utils/tips');
  var Locale = require('utils/locale');
  var OpenNebulaVM = require('opennebula/vm');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./migrate/dialogId');
  var TAB_ID = require('../tabId')

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    this.hostsTable = new HostsTable('migrate_vm', {'select': true});
    this.datastoresTable = new DatastoresTable('migrate_vm_ds', {
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
  Dialog.prototype.setLive = _setLive;

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

    $('#' + DIALOG_ID + 'Form', context).submit(function() {
      var extra_info = {};

      if ($("#selected_resource_id_migrate_vm", context).val()) {
          extra_info['host_id'] = $("#selected_resource_id_migrate_vm", context).val();
      } else {
          Notifier.notifyError(Locale.tr("You have not selected a host"));
          return false;
      }

      extra_info['ds_id'] = $("#selected_resource_id_migrate_vm_ds", context).val() || -1
      extra_info['enforce'] = $("#enforce", context).is(":checked");

      $.each(Sunstone.getDataTable(TAB_ID).elements(), function(index, elem) {
        if (that.live) {
          Sunstone.runAction("VM.migrate_live_action", elem, extra_info);
        } else {
          Sunstone.runAction("VM.migrate_action", elem, extra_info);
        }
      });

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      return false;
    });

    return false;
  }

  function _onShow(context) {
    this.datastoresTable.resetResourceTableSelect();
    this.hostsTable.resetResourceTableSelect();

    if (this.live) {
      $(".migrate_vm_ds_selection", context).hide();
    }

    $.each(Sunstone.getDataTable(TAB_ID).elements(), function() {
      var vm_id = "" + this;

      OpenNebulaVM.show({
        data : {
          id: vm_id
        },
        timeout: true,
        success: function (request, vm_json) {
          var element = vm_json.VM;
          var hostname = OpenNebulaVM.hostnameStr(element);

          $('.confirm-resources-header', context).append(
              '<span class="radius secondary label">' +
              Locale.tr("VM") + ' ' + element.ID + ' '+ element.NAME +' ' +
              Locale.tr("is currently running on Host") +
              ' ' + hostname + '</span><br>'
          );
        }
      });
    });
    return false;
  }

  // @param [Boolean] live Set migrate live or migrate
  function _setLive(live) {
    this.live = live;
  }
});
