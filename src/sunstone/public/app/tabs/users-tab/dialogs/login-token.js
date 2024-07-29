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

  var BaseDialog = require("utils/dialogs/dialog");
  var TemplateHTML = require("hbs!./login-token/html");
  var Sunstone = require("sunstone");
  var Notifier = require("utils/notifier");
  var Locale = require("utils/locale");
  var OpenNebula = require("opennebula");
  var ResourceSelect = require("utils/resource-select");

  /*
    CONSTANTS
   */

  var DIALOG_ID = require("./login-token/dialogId");
  var USERS_TAB_ID = require("../tabId");

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
  Dialog.prototype.loginSuccess = _loginSuccess;

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
    var tokens = [];

    if (this.element != undefined && this.element.LOGIN_TOKEN != undefined){
      if (Array.isArray(this.element.LOGIN_TOKEN)){
        tokens = this.element.LOGIN_TOKEN;
      } else {
        tokens = [this.element.LOGIN_TOKEN];
      }
    }

    $.each(tokens, function(){
      if (this.EGID == -1){
        this.EGROUP = Locale.tr("None");
      } else {
        this.EGROUP = OpenNebula.Group.getName(this.EGID);
      }
    });

    return TemplateHTML({
      "dialogId": this.dialogId,
      "tokens": tokens
    });
  }

  function _setup(context) {
    var that = this;
    if(that && !that.element){
      var jqueryDta = $(".sunstone-list", $("#" + Sunstone.getTab()));
      if(jqueryDta && jqueryDta.data("element")){
        that.element = jqueryDta.data("element");
      }
    }

    ResourceSelect.insert({
      context: $(".token-group-selector", context),
      resourceName: "Group",
      initValue: "-1",
      extraOptions: "<option value=\"-1\">" + Locale.tr("None") + "</option>"
    });

    context.on("click", "i.remove-tab", function(){
      var tr = $(this).closest("tr");

      $(this).closest("td").html("<i class=\"fas fa-spinner fa-spin\"/>");

      var token = $(".token-text", tr).text();

      OpenNebula.User.login({
        data : {
          id: "-1",
          "username": that.element.NAME,
          "token": token,
          "expire": 0
        },
        success: function(req, response){
          OpenNebula.User.show({
            data : {
              id: that.element.ID
            },
            success: that.loginSuccess.bind(that),
            error: function(request, error_json){
              Sunstone.getDialog(DIALOG_ID).hide();
              Notifier.onError(request, error_json);
            }
          });
        },
        error: function(request, error_json){
          Sunstone.getDialog(DIALOG_ID).hide();
          Notifier.onError(request, error_json);
        }
      });
    });

    $("#token_btn", context).click(function(){
      $("#token_btn", context).html("<i class=\"fas fa-spinner fa-spin\"/>");

      var expire = $(".token-expiration", context).val();
      var egid   = $(".token-group-selector .resource_list_select").val();

      OpenNebula.User.login({
        data : {
          id: "-1",
          "username": that.element.NAME,
          "expire": expire,
          "egid": egid
        },
        success: function(req, response){
          OpenNebula.User.show({
            data : {
              id: that.element.ID
            },
            success: that.loginSuccess.bind(that),
            error: function(request, error_json){
              Sunstone.getDialog(DIALOG_ID).hide();
              Notifier.onError(request, error_json);
            }
          });
        },
        error: function(request, error_json){
          Sunstone.getDialog(DIALOG_ID).hide();
          Notifier.onError(request, error_json);
        }
      });
    });

    return false;
  }

  function _loginSuccess(req, response){
    var that = this;
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
          Sunstone.runAction("User.refresh");
        } else {
          Sunstone.runAction("Settings.refresh");
        }
      },
      error: function(request, error_json){
        Sunstone.getDialog(DIALOG_ID).hide();
        Notifier.onError(request, error_json);
      }
    });
  }

  function _onShow(context) {
    var tabId = Sunstone.getTab();
    if (tabId == USERS_TAB_ID){
      this.setNames( Sunstone.getDataTable(USERS_TAB_ID).elements({names: true}) );
    }

    return false;
  }
});
