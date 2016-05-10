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

  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./spice/html');
  var Sunstone = require('sunstone');
  var Spice = require('utils/spice');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./spice/dialogId');
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
  Dialog.prototype.onClose = _onClose;
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

    $("#open_in_a_new_window_spice", context).on("click", function() {
      var dialog = Sunstone.getDialog(DIALOG_ID);
      dialog.hide();
    });

    return false;
  }

  function _onShow(context) {
    Spice.spiceCallback(this.element);
    return false;
  }

  function _onClose(context) {
    Spice.disconnect();
    Spice.unlock();
    return false;
  }

  function _setElement(element) {
    this.element = element
  }
});
