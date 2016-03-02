/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
  var TemplateHTML = require('hbs!./confirm-with-select/html');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');
  var ResourceSelect = require('utils/resource-select');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./confirm-with-select/dialogId');

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
    //when we proceed with a "confirm with select" we need to
    //find out if we are running an action with a parametre on a datatable
    //items or if its just an action
    $('#confirm_with_select_proceed', dialog).click(function() {
      var actionId = dialog.data('buttonAction');
      var action = Sunstone.getAction(actionId);
      var param = $('.resource_list_select', dialog).val();

      if (!param.length) {
        Notifier.notifyError("You must select a value");
        return false;
      };

      if (!action) {
        Notifier.notifyError("Action " + action + " not defined.");
        return false;
      };

      var error;
      switch (action.type){
      case "multiple":
        error = Sunstone.runAction(actionId, action.elements(), param);
        break;
      default:
        error = Sunstone.runAction(actionId, param);
        break;
      }

      if (!error) {
        dialog.foundation('close');
      }

      return false;
    });

    return false;
  }

  function _onShow(dialog) {
    var actionId = dialog.data('buttonAction');
    var tabId = dialog.data('buttonTab');
    var button = Sunstone.getButton(tabId, actionId);

    var tip = Locale.tr("You have to confirm this action");
    if (button.tip) {
      tip = button.tip
    }

    if (button.custom_select) {
      $('div#confirm_select', dialog).html(button.custom_select);
    } else {
      ResourceSelect.insert({
          context: $('#confirm_select', dialog),
          resourceName: button.select,
          emptyValue: true
        });
    }

    $('#confirm_with_select_tip', dialog).text(tip);

    var action = Sunstone.getAction(actionId);
    var elements = action.elements();
    if (elements) {
      var str = actionId.split('.');
      $(".confirm_action", dialog).html(str[1] + ' ' + str[0] + ': ' + elements.join(', '))
    }

    return false;
  }
});
