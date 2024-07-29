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
  var TemplateHTML = require('hbs!./confirm/html');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var TemplateUtils = require('utils/template-utils');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./confirm/dialogId');

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

  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({dialogId: this.dialogId});
  }

  function _setup(dialog) {
    $(dialog).keypress(function (e) {
      if (e.which == 13 || e.keyCode == 13) {
        $('#confirm_proceed', dialog).click();
        return false;
      } else {
        return true;
      }
    });

    // Submit action is configured in sunstone.js since it's an action_button
    return false;
  }

  function _onShow(dialog) {
    var actionId = dialog.data('buttonAction');
    var tabId = dialog.data('buttonTab');
    var button = Sunstone.getButton(tabId, actionId);

    var tip = Locale.tr("You have to confirm this action");
    if (button && button.tip) {
      tip = button.tip
    }

    $('#confirm_proceed', dialog).val(actionId);
    $('#confirm_tip', dialog).text(tip);

    if(button && button.text && button.icon) {
      $('.subheader', dialog).html(button.icon + button.text);
    } else if(button && button.text){
      $('.subheader', dialog).html(button.text);
    }

    var action = Sunstone.getAction(actionId);
    this.setNames( {elements: action.elements({names: true})} );

    return false;
  }
});
