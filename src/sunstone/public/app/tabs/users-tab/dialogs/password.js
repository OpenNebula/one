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
  var TemplateHTML = require('hbs!./password/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var UserCreation = require('tabs/users-tab/utils/user-creation');
  var Config = require('sunstone-config');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./password/dialogId');
  var USERS_TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    this.userCreation = new UserCreation(DIALOG_ID,
                        {name: false, auth_driver: false, group_select: false});
  
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

  /**
   * @param {object} params
   *        - params.selectedElements : Array of user ids
   */
  function _setParams(params) {
    this.selectedElements = params.selectedElements;
  }

  function _html() {
    this.cantChangePassword = parseInt(this.selectedElements) <= 1;
    return TemplateHTML({
      'dialogId': this.dialogId,
      'cantChangePassword': this.cantChangePassword,
      'userCreationHTML': this.userCreation.html()      
    });
  }

  function _setup(context) {
    var that = this;

    this.userCreation.setup(context);

    Foundation.reflow(context, 'abide');

    $('#' + DIALOG_ID + 'Form')
      .on('forminvalid.zf.abide', function(ev, frm) {
        Notifier.notifyError(Locale.tr("One or more required fields are missing or malformed."));
      })
      .on('formvalid.zf.abide', function(ev, frm) {
        var inputs = that.userCreation.retrieve(context);

        Sunstone.runAction('User.passwd', that.selectedElements, inputs.password);

        Sunstone.getDialog(DIALOG_ID).hide();
        Sunstone.getDialog(DIALOG_ID).reset();
        if (Sunstone.getTab() == USERS_TAB_ID){
          Sunstone.runAction('User.refresh');
        } else {
          Sunstone.runAction('Settings.refresh');
        }
      })
      .on("submit", function(ev) {
        ev.preventDefault();
      });

    return false;
  }

  function _onShow(context) {
    var tabId = Sunstone.getTab();

    if (tabId == USERS_TAB_ID){
      this.setNames( {tabId: USERS_TAB_ID} );
    }

    return false;
  }
});
