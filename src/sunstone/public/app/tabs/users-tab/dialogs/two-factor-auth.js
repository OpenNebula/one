/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
  /* DEPENDENCIES */

  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./two-factor-auth/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var OpenNebula = require('opennebula');
  var ResourceSelect = require('utils/resource-select');

   /* CONSTANTS */

  var DIALOG_ID = require('./two-factor-auth/dialogId');
  var USERS_TAB_ID = require('../tabId');

   /* CONSTRUCTOR */

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

   /* FUNCTION DEFINITIONS */

  function _setParams(params) {
    this.element = params.element;
    this.sunstone_setting = params.sunstone_setting;
  }

  function _html() {
    return TemplateHTML({
      'dialogId': this.dialogId
    });
  }

  function _setup(context) {
    var that = this;
    var secret = randomBase32();
    $("#secret", context).val(secret);
    $('#qr_code', context).html('<img src="'+ '/two_factor_auth_hotp_qr_code?secret=' + secret + '&csrftoken=' + csrftoken + '" width="75%" alt="' + secret + '" />'); 
    $("#enable_btn", context).click(function(){
      var secret = $("#secret", context).val();
      var token = $("#token", context).val();
       Sunstone.runAction(
        "User.enable_sunstone_two_factor_auth",
        that.element.ID,
        {current_sunstone_setting: that.sunstone_setting, secret: secret, token: token}
      );
    });

    return false;
  }

  function randomBase32() {
    const items = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567');
    const result = Array(16).fill(0).map(() => items[Math.floor(Math.random()*items.length)]);
    return result.join('');
  };

  function _onShow(context) {
    var tabId = Sunstone.getTab();
    if (tabId == USERS_TAB_ID){
      this.setNames( Sunstone.getDataTable(USERS_TAB_ID).elements({names: true}) );
    }
    return false;
  }
});