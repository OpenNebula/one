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
  var Config = require('sunstone-config');
  var Sunstone = require('sunstone');
  var Humanize = require('utils/humanize');
  var Notifier = require('utils/notifier');
  var OpenNebulaVM = require('opennebula/vm');
  var TemplateUtils = require('utils/template-utils');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./snapshots/panelId');
  var SNAPSHOT_DIALOG_ID = require('../dialogs/snapshot/dialogId');
  var REVERT_DIALOG_ID = require('../dialogs/revert/dialogId');
  var RESOURCE = "VM"
  var XML_ROOT = "VM"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.panelId = PANEL_ID;
    this.title = Locale.tr("Snapshots");
    this.icon = "fa-laptop";
    this.class = "not_firecracker";

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
    var that = this;
    var html = '<form id="snapshot_form" vmid="' + that.element.ID + '" >\
      <div class="row">\
      <div class="large-12 columns">\
         <table class="info_table dataTable">\
           <thead>\
             <tr>\
                <th>' + Locale.tr("ID") + '</th>\
                <th>' + Locale.tr("Name") + '</th>\
                <th>' + Locale.tr("Timestamp") + '</th>\
                <th>' + Locale.tr("Actions") + '</th>\
                <th>'

    if (Config.isTabActionEnabled("vms-tab", "VM.snapshot_create")) {
      // If VM is not RUNNING, then we forget about the attach disk form.
      if (that.element.STATE == OpenNebulaVM.STATES.ACTIVE && that.element.LCM_STATE == OpenNebulaVM.LCM_STATES.RUNNING) {
        html += '\
           <button id="take_snapshot" class="button small success right radius" >' + Locale.tr("Take snapshot") + '</button>'
      } else {
        html += '\
           <button id="take_snapshot" class="button small success right radius" disabled="disabled">' + Locale.tr("Take snapshot") + '</button>'
      }
    }

    html +=  '</th>\
              </tr>\
           </thead>\
           <tbody>';

    var snapshots = []
    if (Array.isArray(that.element.TEMPLATE.SNAPSHOT))
        snapshots = that.element.TEMPLATE.SNAPSHOT
    else if (!$.isEmptyObject(that.element.TEMPLATE.SNAPSHOT))
        snapshots = [that.element.TEMPLATE.SNAPSHOT]

    if (!snapshots.length) {
      html += '\
          <tr id="no_snapshots_tr">\
            <td colspan="6">'          + Locale.tr("No snapshots to show") + '</td>\
          </tr>'        ;
    } else {

      for (var i = 0; i < snapshots.length; i++) {
        var snapshot = snapshots[i];

        if (
           (
            that.element.STATE == OpenNebulaVM.STATES.ACTIVE) &&
           (
            that.element.LCM_STATE == OpenNebulaVM.LCM_STATES.HOTPLUG_SNAPSHOT)) {
          actions = Locale.tr("snapshot in progress");
        } else {
          actions = '';

          if ((that.element.STATE == OpenNebulaVM.STATES.ACTIVE &&
               that.element.LCM_STATE == OpenNebulaVM.LCM_STATES.RUNNING)) {

            if (Config.isTabActionEnabled("vms-tab", "VM.snapshot_revert")) {
              actions += '<a href="VM.snapshot_revert" class="snapshot_revert" ><i class="fas fa-reply"/>' + Locale.tr("Revert") + '</a> &emsp;'
            }

            if (Config.isTabActionEnabled("vms-tab", "VM.snapshot_delete")) {
              actions += '<a href="VM.snapshot_delete" class="snapshot_delete" ><i class="fas fa-times"/>' + Locale.tr("Delete") + '</a>'
            }
          } else if (that.element.STATE == OpenNebulaVM.STATES.POWEROFF &&  that.element.HISTORY_RECORDS.HISTORY.VM_MAD == "vcenter"){
            if (Config.isTabActionEnabled("vms-tab", "VM.snapshot_delete")) {
              actions += '<a href="VM.snapshot_delete" class="snapshot_delete" ><i class="fas fa-times"/>' + Locale.tr("Delete") + '</a>'
            }
          }
        }

        html += '\
              <tr snapshot_id="' + (snapshot.SNAPSHOT_ID) + '">\
                <td>'            + TemplateUtils.htmlEncode(snapshot.SNAPSHOT_ID) + '</td>\
                <td>'            + TemplateUtils.htmlEncode(snapshot.NAME) + '</td>\
                <td>'            + Humanize.prettyTime(snapshot.TIME) + '</td>\
                <td>'            + actions + '</td>\
            </tr>'        ;
      }
    }

    html += '\
            </tbody>\
          </table>\
        </div>\
        </div>\
      </form>';

    return html;
  }

  function _setup(context) {
    var that = this;

    if (Config.isTabActionEnabled("vms-tab", "VM.snapshot_create")) {
      context.off('click', '#take_snapshot');
      context.on('click', '#take_snapshot', function() {
        var dialog = Sunstone.getDialog(SNAPSHOT_DIALOG_ID);
        dialog.reset();
        dialog.setElement(that.element);
        dialog.show();
        return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.snapshot_revert")) {
      context.off('click', '.snapshot_revert');
      context.on('click', '.snapshot_revert', function() {
        var dialog = Sunstone.getDialog(REVERT_DIALOG_ID);
        that.element.snapshot_id = $(this).parents('tr').attr('snapshot_id');
        dialog.reset();
        dialog.setElement(that.element);
        dialog.show();
        return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.snapshot_delete")) {
      context.off('click', '.snapshot_delete');
      context.on('click', '.snapshot_delete', function() {
        var snapshot_id = $(this).parents('tr').attr('snapshot_id');
        Sunstone.runAction('VM.snapshot_delete', that.element.ID,  {"snapshot_id": snapshot_id});
        return false;
      });
    }
  }
});
