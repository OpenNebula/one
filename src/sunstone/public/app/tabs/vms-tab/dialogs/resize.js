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
  var TemplateHTML = require('hbs!./resize/html');
  var Sunstone = require('sunstone');
  var Tips = require('utils/tips');
  var CapacityInputs = require('tabs/templates-tab/form-panels/create/wizard-tabs/general/capacity-inputs');
  var Config = require('sunstone-config');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./resize/dialogId');
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
      'capacityInputsHTML': CapacityInputs.html()
    });
  }

  function _setup(context) {
    var that = this;
    CapacityInputs.setup(context);

    Tips.setup(context);

    $("#enforce", context).attr("checked", Config.isFeatureEnabled("resize_enforce"));

    $('#' + DIALOG_ID + 'Form', context).submit(function() {
      var templateJSON = CapacityInputs.retrieveChanges(context);

      var enforce = $("#enforce", this).is(":checked");

      var topology = {}

      if (templateJSON && templateJSON.CORES){
        topology.CORES = templateJSON["CORES"];
        topology.SOCKETS = parseInt(templateJSON["VCPU"]) / parseInt(templateJSON["CORES"]);
        topology.THREADS = 1;
        delete templateJSON["CORES"];
      }

      if (!$.isEmptyObject(topology)){
        templateJSON.TOPOLOGY = topology;
      }

      var obj = {
        "vm_template": templateJSON,
        "enforce": enforce,
      }

      Sunstone.runAction('VM.resize', that.element.ID, obj);

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      return false;
    });

    return false;
  }

  function _onShow(context) {
    var that = this;

    this.setNames( {tabId: TAB_ID} );

    CapacityInputs.fill(context, that.element);

    return false;
  }

  function _setElement(element) {
    this.element = element
  }
});
