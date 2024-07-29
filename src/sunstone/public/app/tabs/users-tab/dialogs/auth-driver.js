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
  var TemplateHTML = require('hbs!./auth-driver/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var UserCreation = require('tabs/users-tab/utils/user-creation');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./auth-driver/dialogId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    this.userCreation = new UserCreation(DIALOG_ID,
                        {name: false, password: false, group_select: false});

    BaseDialog.call(this);
  }

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.setup = _setup;

  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'dialogId': this.dialogId,
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

        var selElems = Sunstone.getDataTable(TAB_ID).elements();

        Sunstone.runAction('User.chauth', selElems, inputs.auth_driver);

        Sunstone.getDialog(DIALOG_ID).hide();
        Sunstone.getDialog(DIALOG_ID).reset();
        Sunstone.runAction('User.refresh');
      })
      .on("submit", function(ev) {
        ev.preventDefault();
      });

    return false;
  }

  function _onShow(context) {
    this.setNames( {tabId: TAB_ID} );

    return false;
  }
});
