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

//  require('foundation.accordion');
  var Locale = require("utils/locale");
  var Config = require("sunstone-config");
  var OpenNebula = require("opennebula");
  var TemplateUtils = require("utils/template-utils");
  var Sunstone = require("sunstone");
  var Notifier = require("utils/notifier");
  var Humanize = require("utils/humanize");

  /*
    TEMPLATES
   */

  var TemplateEasyInfo = require("hbs!./user-config/html");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./user-config/panelId");
  var RESOURCE = "User";
  var XML_ROOT = "USER";
  var LOGIN_TOKEN_DIALOG_ID = require("tabs/users-tab/dialogs/login-token/dialogId");
  var TWO_FACTOR_AUTH_DIALOG_ID = require('tabs/users-tab/dialogs/two-factor-auth/dialogId');

  /*
    CONSTRUCTOR
   */

  function Panel(info, tabId) {
    this.tabId = tabId || TAB_ID;
    this.title = Locale.tr("Config");
    this.icon = "fa-info";

    this.element = info[XML_ROOT];

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    this.cantChangePassword = parseInt(this.element.ID) <= 1;
    return TemplateEasyInfo({
      'languageOptions': Locale.language_options,
      'cantChangePassword': this.cantChangePassword
    });
  }

  function _setup(context) {
    var that = this;
    Foundation.reflow(context, "accordion");
    var ssh_key = this.element.TEMPLATE.SSH_PUBLIC_KEY;
    if (ssh_key && ssh_key.length) {
      $("#provision_ssh_key", context).val(ssh_key);
      $(".provision_add_ssh_key_button", context).hide();
      $(".provision_update_ssh_key_button", context).show();
    } else {
      $(".provision_add_ssh_key_button", context).show();
      $(".provision_update_ssh_key_button", context).hide();
    }

    $("#provision_new_language option[value=\"" + config["user_config"]["lang"] + "\"]", context).attr("selected", "selected");

    $.each(config["available_views"], function(id, view) {
      $("select#provision_user_views_select", context).append("<option value=\"" + view + "\">" + view + "</option>");
    });

    $("#provision_user_views_select option[value=\"" + config["user_config"]["default_view"] + "\"]", context).attr("selected", "selected");

    $(".provision_two_factor_auth_button", context).html(Locale.tr("Manage two factor authentication"));

    // Login token button
    context.off("click", ".provision_login_token_button");
    context.on("click", ".provision_login_token_button", function(){
      //Sunstone.getDialog(LOGIN_TOKEN_DIALOG_ID).setParams({element: that.element});
      //Sunstone.getDialog(LOGIN_TOKEN_DIALOG_ID).reset();
      Sunstone.getDialog(LOGIN_TOKEN_DIALOG_ID).show();
    });

    // Two factor auth button
    context.off("click", ".provision_two_factor_auth_button");
    context.on("click", ".provision_two_factor_auth_button", function(){
      var sunstone_setting = that.element.TEMPLATE.SUNSTONE || {};
      Sunstone.getDialog(TWO_FACTOR_AUTH_DIALOG_ID).setParams({
        element: that.element,
        sunstone_setting: sunstone_setting
      });
      Sunstone.getDialog(TWO_FACTOR_AUTH_DIALOG_ID).reset();
      Sunstone.getDialog(TWO_FACTOR_AUTH_DIALOG_ID).show();
    });
  
    $("#provision_change_password_form").submit(function() {
      var pw = $("#provision_new_password", this).val();
      var confirm_password = $("#provision_new_confirm_password", this).val();

      if (!pw.length) {
        Notifier.notifyError(Locale.tr("Fill in a new password"));
        return false;
      }

      if (pw !== confirm_password) {
        Notifier.notifyError(Locale.tr("Passwords do not match"));
        return false;
      }

      Sunstone.runAction("User.passwd", ["-1"], pw);

      Sunstone.runAction("Settings.refresh");
      return false;
    });

    $("#provision_add_ssh_key_form").submit(function() {
      var keypair = $("#provision_ssh_key", this).val();

      if (!keypair.length) {
        Notifier.notifyError(Locale.tr("You have to provide an SSH key"));
        return false;
      }

      var template_str = "SSH_PUBLIC_KEY = \""+TemplateUtils.escapeDoubleQuotes(keypair)+"\"";

      Sunstone.runAction("User.append_template", "-1", template_str);

      return false;
    });

    $("#provision_change_view_form").submit(function() {
      var sunstone_setting = {DEFAULT_VIEW : $("#provision_user_views_select", this).val()};
      Sunstone.runAction("User.append_sunstone_setting_refresh", that.element.ID, sunstone_setting);

      return false;
    });

    $("#provision_change_language_form").submit(function() {
      var sunstone_setting = {LANG : $("#provision_new_language", this).val()};
      Sunstone.runAction("User.append_sunstone_setting_refresh", that.element.ID, sunstone_setting);

      return false;
    });

    return false;
  }
});
