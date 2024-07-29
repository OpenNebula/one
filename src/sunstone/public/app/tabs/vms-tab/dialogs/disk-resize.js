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
  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./disk-resize/html');
  var Sunstone = require('sunstone');
  var Tips = require('utils/tips');
  var UserInputs = require("utils/user-inputs");
  //var RangeSlider = require('utils/range-slider');
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

  }function convertCostNumber(number){
    if(number >= 1000000){
      number = (number/1000000).toFixed(2)
      return number.toString()+"M";
    }
    else if(number >= 1000){
      number = (number/1000).toFixed(2)
      return number.toString()+"K";
    }
    else if (number >= 0 && number < 1000)
      return number.toFixed(2);
    else
      return number;
  }

  function _setup(context) {
    var that = this;
    Tips.setup(context);
    var oneTera = Humanize.sizeToMB("1TB")*1024;
    var max = that.diskSize > oneTera? that.diskSize*1024 : oneTera;
    var attrs = {
      min: that.diskSize,
      max: max,
      initial: that.diskSize,
      name: "resize",
      max_value: "",
      type: "range",
      no_ticks: true
    }
    //$( ".diskSlider", context).html(RangeSlider.html(attrs));

    // Functions for disks slider

    UserInputs.insertAttributeInputMB(attrs, $(".diskSlider", context));

    $( ".uinput-slider-val",context).prop('type', 'text');
    $( ".uinput-slider-val",context).val(Humanize.size($(".uinput-slider",context).val()));

    $( ".uinput-slider", context).on("input", function(){
      $( ".uinput-slider-val",context).val(Humanize.size($( ".uinput-slider",context).val()));
      var cost = Humanize.sizeToMB($( ".uinput-slider",context).val())*that.diskCost;
      if(isNaN(cost)){
        cost = 0;
      }
      document.getElementById("new_cost_resize").textContent =  Locale.tr("Cost")+": "+ convertCostNumber(cost);
    });

    $( ".uinput-slider-val", context).on("keypress", function(e){
      if(e.which === 13){
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }).on("change", function(e){
      $( ".uinput-slider",context).val(Humanize.sizeToMB(($( ".uinput-slider-val",context).val()).toString())*1024);
      var cost = Humanize.sizeToMB($( ".uinput-slider",context).val())*that.diskCost;
      if(isNaN(cost)){
        cost = 0;
      }
      document.getElementById("new_cost_resize").textContent =  Locale.tr("Cost")+": "+ convertCostNumber(cost);
    });

    var cost = Humanize.sizeToMB($( ".uinput-slider",context).val())*this.diskCost;
    if(isNaN(cost)){
        cost = 0;
    }
    document.getElementById("new_cost_resize").textContent =  Locale.tr("Cost")+": "+ convertCostNumber(cost);

    $('#' + DIALOG_ID + 'Form', context).submit(function() {
      var new_size = parseInt(Humanize.sizeToMB($( ".uinput-slider-val", context).val()));
      new_size = new_size.toString();
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
