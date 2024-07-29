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

  var Locale = require('utils/locale');
  var Sunstone = require('sunstone');
  var TemplateTable = require('utils/panel/template-table');
  var TemplateUtils = require('utils/template-utils');
  var UserCreation = require('tabs/users-tab/utils/user-creation');
  
  /* TEMPLATES */
  
  var TemplateInfo = require('hbs!./auth/html');

  /* CONSTANTS */

  var PASSWORD_DIALOG_ID = require('tabs/users-tab/dialogs/password/dialogId');
  var LOGIN_TOKEN_DIALOG_ID = require('tabs/users-tab/dialogs/login-token/dialogId');
  var TWO_FACTOR_AUTH_DIALOG_ID = require('tabs/users-tab/dialogs/two-factor-auth/dialogId');
  var CONFIRM_DIALOG_ID = require('utils/dialogs/generic-confirm/dialogId');
  var RESOURCE = "User";
  var XML_ROOT = "USER";
  var REGEX_HIDDEN_ATTRS = /^(SUNSTONE|SSH_PUBLIC_KEY|SSH_PRIVATE_KEY|SSH_PASSPHRASE)$/

  /* CONSTRUCTOR */

  function Panel(info) {
    this.title = Locale.tr("Auth");
    this.icon = "fa-key";
    this.element = info[XML_ROOT];
    this.userCreation = new UserCreation(this.tabId, {name: false, password: false, group_select: false});
    return this;
  }

  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /* FUNCTION DEFINITIONS */

  function _html() {
    var attributes = TemplateTable.getTemplatesAttributes(this.element.TEMPLATE, {
      regexHidden: REGEX_HIDDEN_ATTRS
    })

    var templateTableHTML = TemplateTable.html(attributes.general, RESOURCE, Locale.tr("Attributes"));

    return TemplateInfo({
      'element': this.element,
      'tabId': this.tabId,
      'templateTableHTML': templateTableHTML,
      'userCreationHTML': this.userCreation.html()
    });
  }

  function _setup(context) {
    var that = this;
    this.userCreation.setup(context);

    var attributes = TemplateTable.getTemplatesAttributes(this.element.TEMPLATE, {
      regexHidden: REGEX_HIDDEN_ATTRS
    })

    TemplateTable.setup(attributes.general, RESOURCE, this.element.ID, context, attributes.hidden);

    // Change two factor auth
    if (that.element.ID == config['user_id']) {
      $("#manage_two_factor_auth", context).html(Locale.tr("Manage two factor authentication"));
    } else {
      if (that.element.TEMPLATE.SUNSTONE && (that.element.TEMPLATE.SUNSTONE.TWO_FACTOR_AUTH_SECRET || (that.element.TEMPLATE.SUNSTONE.WEBAUTHN_CREDENTIALS != undefined && that.element.TEMPLATE.SUNSTONE.WEBAUTHN_CREDENTIALS != "{'cs':[]}"))) {
        $("#manage_two_factor_auth", context).html(Locale.tr("Disable all authenticators"));
      } else {
        $("#manage_two_factor_auth", context).prop("disabled", true);
        $("#manage_two_factor_auth", context).html(Locale.tr("No"));
      }
    }
    context.off("click", "#manage_two_factor_auth");
    context.on("click", "#manage_two_factor_auth", function () {
      var sunstone_setting = that.element.TEMPLATE.SUNSTONE || {};
      if (that.element.ID != config['user_id'] && (sunstone_setting.TWO_FACTOR_AUTH_SECRET || (sunstone_setting.WEBAUTHN_CREDENTIALS != undefined && sunstone_setting.WEBAUTHN_CREDENTIALS != "{'cs':[]}"))) {
        Sunstone.runAction(
          "User.disable_sunstone_two_factor_auth",
          that.element.ID,
          { current_sunstone_setting: sunstone_setting, delete_all: true }
        );
      } else {
        Sunstone.getDialog(TWO_FACTOR_AUTH_DIALOG_ID).setParams({ element: that.element, sunstone_setting: sunstone_setting });
        Sunstone.getDialog(TWO_FACTOR_AUTH_DIALOG_ID).reset();
        Sunstone.getDialog(TWO_FACTOR_AUTH_DIALOG_ID).show();
      }
    });

    // View password button
    context.off("click", "#view_password");
    context.on("click", "#view_password", function(){
      Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
        header : Locale.tr("Password"),
        headerTabId: that.tabId,
        body: '<label>' + Locale.tr("Current password") + '</label>' +
              '<pre>'+that.element.PASSWORD+'</pre>',
        question : '',
        buttons : [
          Locale.tr("Close"),
        ],
        submit : [
          function(){
            return false;
          }
        ]
      });

      Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
      Sunstone.getDialog(CONFIRM_DIALOG_ID).show();
    });

    // Edit password button
    context.off("click", "#update_password");
    context.on("click", "#update_password", function(){
      Sunstone.getDialog(PASSWORD_DIALOG_ID).setParams(
        {selectedElements: [that.element.ID]});
      Sunstone.getDialog(PASSWORD_DIALOG_ID).reset();
      Sunstone.getDialog(PASSWORD_DIALOG_ID).show();
    });

    // Login token button
    context.off("click", "#login_token");
    context.on("click", "#login_token", function(){
      Sunstone.getDialog(LOGIN_TOKEN_DIALOG_ID).setParams({element: that.element});
      Sunstone.getDialog(LOGIN_TOKEN_DIALOG_ID).reset();
      Sunstone.getDialog(LOGIN_TOKEN_DIALOG_ID).show();
    });

    context.off("click", "#div_edit_auth_driver_link");
    context.on("click", "#div_edit_auth_driver_link", function() {
      $("#show_auth_driver").hide();
      $("#label_auth").hide();
      $("#change_auth_driver").show();
      $("#users-tab_driver").val(that.element.AUTH_DRIVER);
    });

    context.off("change", "#users-tab_driver");
    context.on("change", "#users-tab_driver", function() {
      var newAuthDriver= $(this).val();
      if (newAuthDriver != "") {
        Sunstone.runAction(RESOURCE + ".chauth", [that.element.ID], newAuthDriver);
        $("#change_auth_driver").hide();
        $("#show_auth_driver").show();
        Sunstone.runAction(RESOURCE + ".refresh");
      }
    });

    // Public SSH input

    context.off("click", ".user_ssh_public_key_edit");
    context.on("click", ".user_ssh_public_key_edit", function() {
      $("#user_ssh_public_key_text", context).hide();
      $("#user_ssh_public_key_textarea", context).show().focus();
    });

    context.off("change", "#user_ssh_public_key_textarea");
    context.on("change", "#user_ssh_public_key_textarea", function() {
      var template_str = 'SSH_PUBLIC_KEY = "'+TemplateUtils.escapeDoubleQuotes($(this).val())+'"';

      Sunstone.runAction("User.append_template", that.element.ID, template_str);
    });

    context.off("focusout", "#user_ssh_public_key_textarea");
    context.on("focusout", "#user_ssh_public_key_textarea", function() {
      $("#user_ssh_public_key_text", context).show();
      $("#user_ssh_public_key_textarea", context).hide();
    });

    $("#user_ssh_public_key_text", context).show();
    $("#user_ssh_public_key_textarea", context).hide();

    // Private SSH input

    context.off("click", ".user_ssh_private_key_edit");
    context.on("click", ".user_ssh_private_key_edit", function() {
      $("#user_ssh_private_key_text", context).hide();
      $("#user_ssh_private_key_textarea", context).show().focus();
    });

    context.off("change", "#user_ssh_private_key_textarea");
    context.on("change", "#user_ssh_private_key_textarea", function() {
      var template_str = 'SSH_PRIVATE_KEY = "'+TemplateUtils.escapeDoubleQuotes($(this).val())+'"';

      Sunstone.runAction("User.append_template", that.element.ID, template_str);
    });

    context.off("focusout", "#user_ssh_private_key_textarea");
    context.on("focusout", "#user_ssh_private_key_textarea", function() {
      $("#user_ssh_private_key_text", context).show();
      $("#user_ssh_private_key_textarea", context).hide();
    });

    $("#user_ssh_private_key_text", context).show();
    $("#user_ssh_private_key_textarea", context).hide();
    
    // Private SSH Passphrases input

    context.off("click", ".user_ssh_passphrase_edit");
    context.on("click", ".user_ssh_passphrase_edit", function() {
      $("#user_ssh_passphrase_text", context).hide();
      $("#user_ssh_passphrase_textarea", context).show().focus();
    });

    context.off("change", "#user_ssh_passphrase_textarea");
    context.on("change", "#user_ssh_passphrase_textarea", function() {
      var template_str = 'SSH_PASSPHRASE = "'+TemplateUtils.escapeDoubleQuotes($(this).val())+'"';

      Sunstone.runAction("User.append_template", that.element.ID, template_str);
    });

    context.off("focusout", "#user_ssh_passphrase_textarea");
    context.on("focusout", "#user_ssh_passphrase_textarea", function() {
      $("#user_ssh_passphrase_text", context).show();
      $("#user_ssh_passphrase_textarea", context).hide();
    });

    $("#user_ssh_passphrase_text", context).show();
    $("#user_ssh_passphrase_textarea", context).hide();

    return false;
  }
});
