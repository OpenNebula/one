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
  /*
    DEPENDENCIES
   */

  var TemplateInfo = require('hbs!./auth/html');
  var ResourceSelect = require('utils/resource-select');
  var TemplateUtils = require('utils/template-utils');
  var Locale = require('utils/locale');
  var OpenNebulaUser = require('opennebula/user');
  var Sunstone = require('sunstone');
  var UserCreation = require('tabs/users-tab/utils/user-creation');

  /*
    TEMPLATES
   */

  var TemplateTable = require('utils/panel/template-table');

  /*
    CONSTANTS
   */

  var RESOURCE = "User";
  var XML_ROOT = "USER";
  var PASSWORD_DIALOG_ID = require('tabs/users-tab/dialogs/password/dialogId');
  var LOGIN_TOKEN_DIALOG_ID = require('tabs/users-tab/dialogs/login-token/dialogId');
  var CONFIRM_DIALOG_ID = require('utils/dialogs/generic-confirm/dialogId');

  /*
    CONSTRUCTOR
   */

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

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {

    // TODO: simplify interface?
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["SSH_PUBLIC_KEY"];
    delete strippedTemplate["SUNSTONE"];

     var templateTableHTML = TemplateTable.html(strippedTemplate, RESOURCE,
                                              Locale.tr("Attributes"));
    //====


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
    // Template update
    // TODO: simplify interface?
    var strippedTemplate = $.extend({}, this.element.TEMPLATE);
    delete strippedTemplate["SSH_PUBLIC_KEY"];
    delete strippedTemplate["SUNSTONE"];

    var hiddenValues = {};

    if (this.element.TEMPLATE.SSH_PUBLIC_KEY != undefined) {
      hiddenValues.SSH_PUBLIC_KEY = this.element.TEMPLATE.SSH_PUBLIC_KEY;
    }
    if (this.element.TEMPLATE.SUNSTONE != undefined) {
      hiddenValues.SUNSTONE = this.element.TEMPLATE.SUNSTONE;
    }

    TemplateTable.setup(strippedTemplate, RESOURCE, this.element.ID, context, hiddenValues);
    //===

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

    // SSH input

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
    return false;
  }
});
