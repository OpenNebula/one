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
  /* DEPENDENCIES */

  var BaseDialog = require('utils/dialogs/dialog');
  var TemplateHTML = require('hbs!./two-factor-auth/html');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var WebAuthnJSON = require('../../../../bower_components/webauthn-json/dist/index');


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
    var authTokens = [];
    if (this.element != undefined && this.element.TEMPLATE.SUNSTONE != undefined) {
      var sunstone_setting = this.element.TEMPLATE.SUNSTONE || {};
      if (sunstone_setting.TWO_FACTOR_AUTH_SECRET != undefined) {
        authTokens.push({ 'ID': 0, 'TYPE': 'Authenticator app (HOTP)', 'NAME': '' });
      }
      if (sunstone_setting.WEBAUTHN_CREDENTIALS != undefined) {
        // The handling of double quotes in JSONUtils.template_to_str() is buggy, WEBAUTHN_CREDENTIALS uses single quotes instead
        var credentials = JSON.parse(sunstone_setting.WEBAUTHN_CREDENTIALS.replace(/\'/g, '"')).cs || {};
        $.each(credentials, function () {
          authTokens.push({ 'ID': this.pk, 'TYPE': 'Security key (FIDO2 / U2F / WebAuthn)', 'NAME': this.name });
        });
      }
    }

    return TemplateHTML({
      'dialogId': this.dialogId,
      'authTokens': authTokens
    });
  }

  function _setup(context) {
    var that = this;
    var sunstone_setting = this.element != undefined ? this.element.TEMPLATE.SUNSTONE : {};

    context.on("click", "i.remove-tab", function(){
      var tr = $(this).closest("tr");
      $(this).closest("td").html("<i class=\"fas fa-spinner fa-spin\"/>");
      var tokenid = $(tr).attr("data-tokenid");
      var sunstone_setting = that.element.TEMPLATE.SUNSTONE || {};
      if (tokenid == 0) {
        Sunstone.runAction(
          "User.disable_sunstone_two_factor_auth",
          that.element.ID,
          { current_sunstone_setting: sunstone_setting }
        );
      } else {
        Sunstone.runAction(
          "User.disable_sunstone_security_key",
          that.element.ID,
          { current_sunstone_setting: sunstone_setting, tokenid_to_remove: tokenid }
        );
      }
    });

    // Register authenticator app button
    if (sunstone_setting != undefined && sunstone_setting.TWO_FACTOR_AUTH_SECRET != undefined) {
      $("#register_authenticator_app", context).prop("disabled", true);
      $("#register_authenticator_app", context).html(Locale.tr("Authenticator app already registered"));
    }

    context.off("click", "#register_authenticator_app");
    context.on("click", "#register_authenticator_app", function () {
      $("#authenticator_app_div").show();
      $("#security_key_div").hide();
      var secret = randomBase32();
      $("#secret", context).val(secret);
      $('#qr_code', context).html('<img src="' + '/two_factor_auth_hotp_qr_code?secret=' + secret + '&csrftoken=' + csrftoken + '" width="75%" alt="' + secret + '" />');
      $("#enable_btn", context).click(function () {
        var secret = $("#secret", context).val();
        var token = $("#token", context).val();
        Sunstone.runAction(
          "User.enable_sunstone_two_factor_auth",
          that.element.ID,
          { current_sunstone_setting: that.sunstone_setting, secret: secret, token: token }
        );
      });
    });

    context.off("click", "#register_security_key");
    context.on("click", "#register_security_key", function () {
      $("#authenticator_app_div").hide();
      $("#security_key_div").show();
      context.off("click", "#add_btn");
      $.ajax({
        url: "webauthn_options_for_create",
        type: "GET",
        dataType: "json",
        success: function (response) {
          if (!navigator.credentials) {
            $("#security_key_div").hide();
            Notifier.onError(null, { error: { message: 'WebAuthn functionality unavailable. Ask your cloud administrator to enable TLS.' } });
            return;
          }
          context.on("click", "#add_btn", function () {
            WebAuthnJSON.create({ "publicKey": response }).then(function(publicKeyCredential) {
              var nickname = $("#nickname", context).val();
              Sunstone.runAction(
                "User.enable_sunstone_security_key",
                that.element.ID,
                { nickname: nickname, publicKeyCredential: publicKeyCredential, current_sunstone_setting: that.sunstone_setting }
              );
            })
            .catch(function(e) {
              Notifier.onError(null, { error: { message: e.message } });
            });              
          });
        },
        error: function (response) {
          if (response.status == 501) {
            $("#security_key_div").hide();
            Notifier.onError(null, { error: { message: 'WebAuthn functionality unavailable. Ask your cloud administrator to upgrade the Ruby version.' } });
          }
        }
      });
    });

    return false;
  }

  function randomBase32() {
    const items = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567');
    const result = Array(16).fill(0).map(function() { return items[Math.floor(Math.random()*items.length)] });
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