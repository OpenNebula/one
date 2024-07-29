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
  var TemplateHTML = require('hbs!./attach-nic/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var NicsSection = require('utils/nics-section');
  var WizardFields = require('utils/wizard-fields');
  var Config = require('sunstone-config');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./attach-nic/dialogId');
  var TAB_ID = require('../tabId')

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
  Dialog.prototype.setElement = _setElement;

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

    NicsSection.insert({},
      $(".nicsContext", context),
      { floatingIP: true,
        forceIPv6:true,
        forceIPv4:true,
        management: true,
        securityGroups: Config.isFeatureEnabled("secgroups"),
        hide_add_button:true,
        click_add_button:true,
        hide_auto_button: true
      });

    $('#' + DIALOG_ID + 'Form', context).submit(function() {
      var templateJSON = NicsSection.retrieve($(".nicsContext", context));
      var obj = {
        "NIC": templateJSON
      };

      Sunstone.runAction('VirtualRouter.attachnic', that.element.ID, obj);

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      return false;
    });

    return false;
  }

  function _onShow(context) {
    this.setNames( {tabId: TAB_ID} );

    return false;
  }

  function _setElement(element) {
    this.element = element;
  }
});
