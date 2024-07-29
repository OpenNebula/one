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
  var Buttons = require("./support-tab/buttons");
  var Actions = require("./support-tab/actions");
  var Table = require("./support-tab/datatable");
  var Notifier = require("utils/notifier");
  var SupportUtils = require("./support-tab/utils/common");
  var Sunstone = require("sunstone");
  var Locale = require("utils/locale");
  var TemplateTitle = require("hbs!./support-tab/title");
  var TemplateSubheader = require("hbs!./support-tab/subheader");

  var TAB_ID = require("./support-tab/tabId");
  var DATATABLE_ID = "dataTableSupport";

  var _dialogs = [
    require("./support-tab/dialogs/upload")
  ];

  var _panels = [
    require("./support-tab/panels/info")
  ];

  var _formPanels = [
    require("./support-tab/form-panels/create")
  ];

  var Tab = {
    tabId: TAB_ID,
    resource: "Support",
    title: TemplateTitle(),
    listHeader: "Commercial Support Requests",
    infoHeader: "Commercial Support Request",
    subheader: TemplateSubheader({
      "support_subscription": config["support"]["support_subscription"],
      "account": config["support"]["account"],
      "docs": config["support"]["docs"],
      "community": config["support"]["community"]
    }),
    buttons: Buttons,
    actions: Actions,
    dataTable: new Table(DATATABLE_ID, {actions: true, info: true, oneSelection: true}),
    panels: _panels,
    formPanels: _formPanels,
    dialogs: _dialogs,
    setup: _setup
  };

  return Tab;

  function _setup(context) {
    $("#li_support-tab > a").on("click", function(e){
      e.preventDefault();
    });
    if(config && config.user_config && config.user_config.default_view === "admin"){
      $("#support_credentials_form", context).on("submit", function(){
        $(".support_button").on("click", function(e){
          e.stopPropagation();
          $(".create_dialog_button", "#support-tab").trigger("click");
          return false;
        });

        $(".support_connect_button").on("click", function(e){
          window.location.assign("#support-tab");
        });

        $(".submit_support_credentials_button", context).attr("disabled", "disabled");
        $(".submit_support_credentials_button", context).html("<i class=\"fas fa-spinner fa-spin\"></i>");
        var data = {
          email : $("#support_email", this).val(),
          password : btoa($("#support_password", this).val())
        };
        $.ajax({
          url: "support/credentials",
          type: "POST",
          data: JSON.stringify(data),
          contentType: false,
          success: function(){
            $(".submit_support_credentials_button", context).removeAttr("disabled");
            $(".submit_support_credentials_button", context).html(Locale.tr("Sign in"));
            Sunstone.runAction("Support.refresh");
            SupportUtils.showSupportList();
            SupportUtils.startIntervalRefresh();
          },
          error: function(response){
            if (response && response.status && response.status == "401") {
              Notifier.notifyError("Support credentials are incorrect");
            } else {
              Notifier.notifyError(response.responseText);
            }
            $(".submit_support_credentials_button", context).removeAttr("disabled");
            $(".submit_support_credentials_button", context).html(Locale.tr("Sign in"));
          }
        });
        return false;
      });
    }else{
      $(".only_admin_view").remove();
      $("#li_support-tab > a").on("click", function(e){
        e.preventDefault();
        e.stopPropagation();
      });
    }
  }

});
