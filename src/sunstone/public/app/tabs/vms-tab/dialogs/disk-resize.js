/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./disk-resize/html');
  var Sunstone = require('sunstone');
  var Tips = require('utils/tips');
  var RangeSlider = require('utils/range-slider');
  var Humanize = require('utils/humanize');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./disk-resize/dialogId');
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
    $( ".diskSlider", context).html(RangeSlider.html({
        min: that.diskSize,
        max: Humanize.sizeToMB("500GB"),
        initial: that.diskSize,
        name: "resize"
    }));
    $( ".uinput-slider-val",context).prop('type', 'text');
    $( ".uinput-slider-val",context).val(Humanize.size($( ".uinput-slider",context).val()));

    $( ".uinput-slider", context).on("change", function(){
      $( ".uinput-slider-val",context).val(Humanize.size($( ".uinput-slider",context).val()));
      document.getElementById("new_cost_resize").textContent =  Locale.tr("Cost")+": "+((Humanize.sizeToMB($( ".uinput-slider",context).val()))*that.diskCost).toFixed(2) + Locale.tr(" cost/hour") ;
    });

    $( ".uinput-slider-val", context).on("change", function(){
      $( ".uinput-slider",context).val(Humanize.sizeToMB($( ".uinput-slider-val",context).val()));
      document.getElementById("new_cost_resize").textContent =  Locale.tr("Cost")+": "+((Humanize.sizeToMB($( ".uinput-slider",context).val()))*that.diskCost).toFixed(2) + Locale.tr(" cost/hour") ;
    });

    $('#' + DIALOG_ID + 'Form', context).submit(function() {
      var new_size = $( ".uinput-slider",context).val();
      var obj = {
        "vm_id": that.element.ID,
        "disk_id" : that.diskId,
        "new_size": new_size
      };

      Sunstone.runAction('VM.disk_resize', that.element.ID, obj);

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      return false;
    });

    return false;
  }

  function _onShow(context) {
    this.setNames( {tabId: TAB_ID} );
    $("#disk_id", context).val(this.diskId);
    $("#resize_disk", context).focus();
    return false;
  }

  /**
   * @param {object} params
   *        - params.element : VM element
   *        - params.diskId : Disk ID to save as
   *        - params.snapshotId : Disk snapshot ID to save as. Can be undefined
   */
  function _setParams(params) {
    this.element = params.element;
    this.diskId = params.diskId;
    this.diskSize = params.diskSize;
    this.diskCost = params.diskCost;
  }
});
