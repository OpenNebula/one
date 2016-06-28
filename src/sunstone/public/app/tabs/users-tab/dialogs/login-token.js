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
  var TemplateHTML = require('hbs!./login-token/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var OpenNebula = require('opennebula');
  //var Config = require('sunstone-config');

  /*
    CONSTANTS
   */

  var DIALOG_ID = require('./login-token/dialogId');
  var USERS_TAB_ID = require('../tabId');

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

  /**
   * @param {object} params
   *        - params.element : user element
   */
  function _setParams(params) {
    this.element = params.element;
  }

  function _html() {
    return TemplateHTML({
      'dialogId': this.dialogId,
      'element': this.element
    });
  }

  function _setup(context) {
    var that = this;

    $("#token_btn", context).click(function(){

      $("#token_btn", context).html('<i class="fa fa-spinner fa-spin"/>')

      OpenNebula.User.login({
        data : {
          id: "-1",
          'username': that.element.NAME,
          //token
          //expire
        },
        success: function(req, response){
          OpenNebula.User.show({
            data : {
              id: that.element.ID
            },
            success: function(request, user_json){
              Sunstone.getDialog(DIALOG_ID).hide();
              Sunstone.getDialog(DIALOG_ID).setParams({element: user_json.USER});
              Sunstone.getDialog(DIALOG_ID).reset();
              Sunstone.getDialog(DIALOG_ID).show();

              if (Sunstone.getTab() == USERS_TAB_ID){
                Sunstone.runAction('User.refresh');
              } else {
                Sunstone.runAction('Settings.refresh');
              }
            },
            error: function(request, error_json){
              Sunstone.getDialog(DIALOG_ID).hide();
              Notifier.onError(request, error_json);
            }
          });
        },
        error: Notifier.onError
      });
    });

    return false;
  }

  function _onShow(context) {
    var tabId = Sunstone.getTab();

    if (tabId == USERS_TAB_ID){
      this.setNames( Sunstone.getDataTable(USERS_TAB_ID).elements({names: true}) );
    }

    return false;
  }
});
