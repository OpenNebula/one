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
  var TemplateHTML = require('hbs!./disk-snapshot/html');
  var Sunstone = require('sunstone');
  var Tips = require('utils/tips');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./disk-snapshot/dialogId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    BaseDialog.call(this);
  }

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.setup = _setup;
  Dialog.prototype.setParams = _setParams;

  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'dialogId': this.dialogId
    });
  }

  function _setup(context) {
    var that = this;

    Tips.setup(context);

    $('#' + DIALOG_ID + 'Form', context).submit(function() {
      var snapshot_name = $('#snapshot_name', this).val();
      var obj = {
        "disk_id" : that.diskId,
        "snapshot_name": snapshot_name
      };

      Sunstone.runAction('VM.disk_snapshot_create', that.element.ID, obj);

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      return false;
    });

    return false;
  }

  function _onShow(context) {
    this.setNames( {tabId: TAB_ID} );
    $("#disk_id", context).val(this.diskId);
    $("#snapshot_name", context).focus();
    return false;
  }

  /**
   * @param {object} params
   *        - params.element : VM element
   *        - params.diskId : Disk ID to snapshot
   */
  function _setParams(params) {
    this.element = params.element;
    this.diskId = params.diskId;
  }
});
