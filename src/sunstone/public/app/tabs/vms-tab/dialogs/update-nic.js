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

  var OpennebulaVM = require("opennebula/vm");
  var BaseDialog = require("utils/dialogs/dialog");
  var Sunstone = require("sunstone");
  var Notifier = require("utils/notifier");
  var Tips = require("utils/tips");
  var NicTab = require("tabs/templates-tab/form-panels/create/wizard-tabs/network/nic-tab");
  var WizardFields = require("utils/wizard-fields");
  
  /*
    TEMPLATES
   */

  var QoSHTML = require('hbs!tabs/templates-tab/form-panels/create/wizard-tabs/network/nic-tab/QoS/html');
  var TemplateHTML = require("hbs!./update-nic/html");
  
  /*
    CONSTANTS
   */

  var DIALOG_ID = require("./update-nic/dialogId");
  var TAB_ID = require("../tabId");

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    this.nicTab = new NicTab(DIALOG_ID + "NicTab");

    BaseDialog.call(this);
  };

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.setup = _setup;
  Dialog.prototype.setElement = _setElement;
  Dialog.prototype.setNicId = _setNicId;

  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      "dialogId": this.dialogId,
      "QoSFields": QoSHTML()
    });
  }

  function _setup(context) {
    this.context = context;

    var that = this;

    Tips.setup(context);

    $("#parent", context).hide();

    $("#" + DIALOG_ID + "Form", context).submit(function() {

      var obj = {
        nic_id: that.nicId,
        nic_template: { NIC: WizardFields.retrieve(context) }
      }

      Sunstone.runAction("VM.updatenic", that.element.ID, obj);
      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();

      return false;
    });

    return false;
  }

  function _onShow(context) {
    var that = this;

    this.setNames( {tabId: TAB_ID} );
    var nics = Array.isArray(this.element.TEMPLATE.NIC) ? this.element.TEMPLATE.NIC : [this.element.TEMPLATE.NIC]

    var nicToUpdate = nics.filter(function(nic) {
      return nic.NIC_ID === that.nicId
    })[0]

    WizardFields.fill(context, $.extend({}, nicToUpdate))

    return false;
  }

  function _setElement(element) {
    this.element = element;
  }

  function _setNicId(nicId) {
    this.nicId = nicId
  }
});
