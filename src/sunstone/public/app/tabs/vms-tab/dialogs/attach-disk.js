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
  var TemplateHTML = require('hbs!./attach-disk/html');
  var Sunstone = require('sunstone');
  var Tips = require('utils/tips');
  var DiskTab = require('tabs/templates-tab/form-panels/create/wizard-tabs/storage/disk-tab');
  var IothreadsConf = require('tabs/templates-tab/form-panels/create/wizard-tabs/utils/iothreads');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./attach-disk/dialogId');
  var TAB_ID = require('../tabId')

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    this.diskTab = new DiskTab(DIALOG_ID + 'DiskTab');

    BaseDialog.call(this);
  };

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.setup = _setup;
  Dialog.prototype.setElement = _setElement;

  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'dialogId': this.dialogId,
      'diskTabHTML': this.diskTab.html()
    });
  }

  function _setup(context) {
    var that = this;
    that.diskTab.setup(context);

    Tips.setup(context);

    $('#' + DIALOG_ID + 'Form', context).submit(function() {
      var templateJSON = that.diskTab.retrieve(context);
      var obj = {
        "DISK": templateJSON
      }

      Sunstone.runAction('VM.attachdisk', that.element.ID, obj);

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      return false;
    });

    return false;
  }

  function _onShow(context) {
    this.setNames( {tabId: TAB_ID} );

    this.diskTab.onShow(context);

    if (this && this.element && this.element.TEMPLATE && this.element.TEMPLATE.TM_MAD_SYSTEM && this.element.TEMPLATE.TM_MAD_SYSTEM === 'ssh'){
      $('.edge_cluster_section').hide();
    }
    else{
      $('.edge_cluster_section').show();
    }

    if (this && this.element && this.element.TEMPLATE){
      IothreadsConf.setupAttachDisk(this.element.TEMPLATE);
    }

    return false;
  }

  function _setElement(element) {
    this.element = element
  }
});
