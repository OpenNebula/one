/* -------------------------------------------------------------------------- */
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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

  var BaseDialog = require('utils/dialogs/dialog');
  var GuacController = require('utils/guacamole/controller');
  var Locale = require("utils/locale");
  var Notifier = require("utils/notifier");
  var Sunstone = require('sunstone');

  var TemplateHTML = require('hbs!./guac/html');

  var DIALOG_ID = require('./guac/dialogId');

  function Dialog() {
    this.dialogId = DIALOG_ID;

    BaseDialog.call(this);
  };

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.onClose = _onClose;
  Dialog.prototype.setup = _setup;
  Dialog.prototype.setElement = _setElement;

  return Dialog;

  /* FUNCTION DEFINITIONS */

  function _html() {
    return TemplateHTML({ 'dialogId': this.dialogId });
  }

  function _setup(context) {
    $("#open_in_a_new_window_gclient", context).on("click", function() {
      var dialog = Sunstone.getDialog(DIALOG_ID);
      dialog.hide();
    });

    return false;
  }

  function _onShow() {
    var token = this.element.token;
    var info = this.element.info;

    if (!token) {
      Notifier.notifyError(
        Locale.tr("The OpenNebula service for remote console is not running, please contact your administrator.")
      );

      return null;
    }

    this.controller = new GuacController();
    this.controller.setInformation(info);
    this.controller.setConnection(token);

    return false;
  }

  function _onClose() {
    this.controller.disconnect();

    return false;
  }

  function _setElement(element) {
    this.element = element;
  }
});
