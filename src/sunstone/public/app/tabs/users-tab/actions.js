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
  var CommonActions = require("utils/common-actions");
  var Locale = require("utils/locale");
  var Notifier = require("utils/notifier");
  var OpenNebulaResource = require("opennebula/user");
  var Sunstone = require("sunstone");
  var TemplateUtils = require("utils/template-utils");

  var TAB_ID = require("./tabId");
  var CREATE_DIALOG_ID = require("./form-panels/create/formPanelId");
  var PASSWORD_DIALOG_ID = require("./dialogs/password/dialogId");
  var AUTH_DRIVER_DIALOG_ID = require("./dialogs/auth-driver/dialogId");
  var QUOTAS_DIALOG_ID = require("./dialogs/quotas/dialogId");
  var GROUPS_DIALOG_ID = require("./dialogs/groups/dialogId");
  var TWO_FACTOR_AUTH_DIALOG_ID = require('tabs/users-tab/dialogs/two-factor-auth/dialogId');

  var RESOURCE = "User";
  var XML_ROOT = "USER";

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("User created"));

  var _actions = {
    "User.create" : _commonActions.create(CREATE_DIALOG_ID),
    "User.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "User.list" : _commonActions.list(),
    "User.show" : _commonActions.show(),
    "User.refresh" : _commonActions.refresh(),
    "User.delete" : _commonActions.del(),
    "User.chgrp": _commonActions.multipleAction("chgrp"),
    "User.addgroup": _commonActions.multipleAction("addgroup"),
    "User.delgroup": _commonActions.multipleAction("delgroup"),
    "User.groups_dialog" : _commonActions.checkAndShow("groups"),
    "User.enable" : _commonActions.multipleAction("enable"),
    "User.disable": _commonActions.multipleAction("disable"),

    "User.groups" : {
      type: "single",
      call: OpenNebulaResource.show,
      callback: function(request, response) {
        Sunstone.getDialog(GROUPS_DIALOG_ID).setParams({element: response[XML_ROOT]});
        Sunstone.getDialog(GROUPS_DIALOG_ID).reset();
        Sunstone.getDialog(GROUPS_DIALOG_ID).show();
      },
      error: Notifier.onError
    },

    "User.update_password" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(PASSWORD_DIALOG_ID).setParams(
          {selectedElements: Sunstone.getDataTable(TAB_ID).elements()});
        Sunstone.getDialog(PASSWORD_DIALOG_ID).reset();
        Sunstone.getDialog(PASSWORD_DIALOG_ID).show();
      }
    },

    "User.passwd" : {
      type: "multiple",
      call: OpenNebulaResource.passwd,
      error: Notifier.onError
    },


    "User.change_authentication" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(AUTH_DRIVER_DIALOG_ID).show();
      }
    },

    "User.chauth" : {
      type: "multiple",
      call: OpenNebulaResource.chauth,
      error: Notifier.onError,
    },

    "User.update_template" : {
      type: "single",
      call: OpenNebulaResource.update,
      callback: function(request) {
        var reqId = request.request.data[0];

        Sunstone.runAction(RESOURCE+".show",reqId);

        if (reqId == config["user_id"] || reqId == "-1") {
          Sunstone.runAction("Settings.refresh");

          $.ajax({
            url: "config",
            type: "POST",
            dataType: "json",
            success: function() {
              return false;
            },
            error: function() {}
          });
        }
      },
      error: Notifier.onError
    },

    "User.append_template" : {
      type: "single",
      call: OpenNebulaResource.append,
      callback: function(request) {
        var reqId = request.request.data[0];

        Sunstone.runAction(RESOURCE+".show",reqId);

        if (reqId == config["user_id"] || reqId == "-1") {
          Sunstone.runAction("Settings.refresh");

          $.ajax({
            url: "config",
            type: "POST",
            dataType: "json",
            success: function() {
              return false;
            },
            error: function() {}
          });
        }
      },
      error: Notifier.onError
    },

    "User.append_template_refresh" : {
      type: "single",
      call: OpenNebulaResource.append,
      callback: function(request) {
        var reqId = request.request.data[0];

        if (reqId == config["user_id"] || reqId == "-1") {

          $.ajax({
            url: "config",
            type: "POST",
            dataType: "json",
            success: function() {
              window.location.href = ".";
            },
            error: function() {}
          });
        } else {
          Sunstone.runAction(RESOURCE+".show",reqId);
        }
      },
      error: Notifier.onError
    },

    "User.enable_sunstone_two_factor_auth" : {
      type: "single",
      call: OpenNebulaResource.enable_sunstone_two_factor_auth,
      callback: function(request) {
        var reqId = request.request.data[0];
        if (reqId == config['user_id'] || reqId == "-1") {
            window.location.href = ".";
        } else {
          Sunstone.runAction(RESOURCE+'.show',reqId);
        }
      },
      error: Notifier.onError
    },

    "User.disable_sunstone_two_factor_auth" : {
      type: "single",
      call: OpenNebulaResource.disable_sunstone_two_factor_auth,
      callback: function(request) {
        var reqId = request.request.data[0];
        if (reqId == config['user_id'] || reqId == "-1") {
            window.location.href = ".";
        } else {
          Sunstone.runAction(RESOURCE+'.show',reqId);
        }
      },
      error: Notifier.onError
    },

    "User.enable_sunstone_security_key" : {
      type: "single",
      call: OpenNebulaResource.enable_sunstone_security_key,
      callback: function(request, response) {
        OpenNebulaResource.show({
          data : {
            id: request.request.data[0]
          },
          success: function(request, response) {
            var sunstone_template = {};
            if (response[XML_ROOT].TEMPLATE.SUNSTONE) {
              $.extend(sunstone_template, response[XML_ROOT].TEMPLATE.SUNSTONE);
            }
            Sunstone.getDialog(TWO_FACTOR_AUTH_DIALOG_ID).hide();
            Sunstone.getDialog(TWO_FACTOR_AUTH_DIALOG_ID).setParams({
              element: response[XML_ROOT],
              sunstone_setting: sunstone_template
            });
            Sunstone.getDialog(TWO_FACTOR_AUTH_DIALOG_ID).reset();
            Sunstone.getDialog(TWO_FACTOR_AUTH_DIALOG_ID).show();
          },
          error: Notifier.onError
        });
        Sunstone.runAction("Settings.refresh");
      },
      error: Notifier.onError
    },

    "User.disable_sunstone_security_key" : {
      type: "single",
      call: OpenNebulaResource.disable_sunstone_security_key,
      callback: function(request) {
        OpenNebulaResource.show({
          data : {
            id: request.request.data[0]
          },
          success: function(_, response) {
            var sunstone_template = {};
            if (response[XML_ROOT].TEMPLATE.SUNSTONE) {
              $.extend(sunstone_template, response[XML_ROOT].TEMPLATE.SUNSTONE);
            }
            Sunstone.getDialog(TWO_FACTOR_AUTH_DIALOG_ID).hide();
            Sunstone.getDialog(TWO_FACTOR_AUTH_DIALOG_ID).setParams({
              element: response[XML_ROOT],
              sunstone_setting: sunstone_template
            });
            Sunstone.getDialog(TWO_FACTOR_AUTH_DIALOG_ID).reset();
            Sunstone.getDialog(TWO_FACTOR_AUTH_DIALOG_ID).show();
          },
          error: Notifier.onError
        });
        Sunstone.runAction("Settings.refresh");
      },
      error: Notifier.onError
    },

    "User.append_sunstone_setting_refresh" : {
      type: "single",
      call: function(params){
        OpenNebulaResource.show({
          data : {
            id: params.data.id
          },
          success: function(_, response) {
            var sunstone_template = {};
            if (response[XML_ROOT].TEMPLATE.SUNSTONE) {
              $.extend(sunstone_template, response[XML_ROOT].TEMPLATE.SUNSTONE);
            }

            $.extend(sunstone_template, params.data.extra_param);
            var template_str = TemplateUtils.templateToString({"SUNSTONE": sunstone_template});
            Sunstone.runAction("User.append_template_refresh", params.data.id, template_str);
          },
          error: Notifier.onError
        });
      }
    },

    "User.append_sunstone_setting" : {
      type: "single",
      call: function(params){
        OpenNebulaResource.show({
          data : {
            id: params.data.id
          },
          success: function(_, response) {
            var sunstone_template = {};
            if (response[XML_ROOT].TEMPLATE.SUNSTONE) {
              $.extend(sunstone_template, response[XML_ROOT].TEMPLATE.SUNSTONE);
            }

            $.extend(sunstone_template, params.data.extra_param);
            var template_str = TemplateUtils.templateToString({"SUNSTONE": sunstone_template});
            Sunstone.runAction("User.append_template", params.data.id, template_str);
          },
          error: Notifier.onError
        });
      }
    },

    "User.fetch_quotas" : {
      type: "single",
      call: OpenNebulaResource.show,
      callback: function (_,response) {
        Sunstone.getDialog(QUOTAS_DIALOG_ID).setParams({element: response[XML_ROOT]});
        Sunstone.getDialog(QUOTAS_DIALOG_ID).reset();
        Sunstone.getDialog(QUOTAS_DIALOG_ID).show();
      },
      error: Notifier.onError
    },

    "User.quotas_dialog" : {
      type: "custom",
      call: function() {
        var tab = $("#" + TAB_ID);
        if (Sunstone.rightInfoVisible(tab)) {
          $("a[href=\"#user_quotas_tab\"]", tab).click();
          $("#edit_quotas_button", tab).click();
        } else {
          var sel_elems = Sunstone.getDataTable(TAB_ID).elements();
          //If only one user is selected we fecth the user's quotas
          if (sel_elems.length == 1){
            Sunstone.runAction(RESOURCE+".fetch_quotas",sel_elems[0]);
          } else {
            // More than one, shows '0' usage
            Sunstone.getDialog(QUOTAS_DIALOG_ID).setParams({element: {}});
            Sunstone.getDialog(QUOTAS_DIALOG_ID).reset();
            Sunstone.getDialog(QUOTAS_DIALOG_ID).show();
          }
        }
      }
    },

    "User.set_quota" : {
      type: "multiple",
      call: OpenNebulaResource.set_quota,
      elements: function(opts) {
        return Sunstone.getDataTable(TAB_ID).elements(opts);
      },
      callback: function(request) {
        Sunstone.getDialog(QUOTAS_DIALOG_ID).hide();

        Sunstone.runAction(RESOURCE+".show",request.request.data[0]);
      },
      error: Notifier.onError
    }
  };

  return _actions;
});
