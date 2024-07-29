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

  var Locale = require("utils/locale");
  var Notifier = require("utils/notifier");
  var OpenNebulaVM = require("opennebula/vm");
  var SunstoneConfig = require("sunstone-config");

  /*
    CONSTANTS
   */

  var TAB_ID = require("../tabId");
  var PANEL_ID = require("./log/panelId");
  var RESOURCE = "VM";
  var XML_ROOT = "VM";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.panelId = PANEL_ID;
    this.title = Locale.tr("Log");
    this.icon = "fa-file-alt";

    this.element = info[XML_ROOT];

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;
  Panel.prototype.onShow = _onShow;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    if (SunstoneConfig.isLogEnabled) {
      return "<div class=\"row\">" +
        "<div class=\"large-12 columns vm_log_container monospace\" style=\"overflow: auto; height: 500px\">" +
          "<div class=\"text-center\" style=\"height: 100px;\">" +
            "<span style=\"font-size:80px\">" +
              "<i class=\"fas fa-spinner fa-spin\"></i>" +
            "</span>" +
          "</div>" +
        "</div>" +
      "</div>";
    }
  }

  function _setup(context) {
  }

  function _onShow(context) {
    var that = this;
    OpenNebulaVM.log({
      data: {id: that.element.ID},
      success: function(req, response) {
        // When log is empty
        if (response.vm_log === "") {
          $(".vm_log_container", context).html(secondaryCenterLabel(Locale.tr("Log file is empty")));
          return;
        }

        var log_lines = response["vm_log"].split("\n");
        var colored_log = "";
        for (var i = 0; i < log_lines.length; i++) {
          var line = escapeHtml(log_lines[i]);
          if (line.match(/\[E\]/)) {
            line = "<span class='vm_log_error'>" + line + "</span>";
          }
          colored_log += line + "<br>";
        }

        $(".vm_log_container", context).html(
          "<div class=\"row\">" +
            "<div class=\"large-11 small-centered columns log-tab\">" +
              colored_log +
            "</div>" +
          "</div>");
        $(".vm_log_container", context).animate({scrollTop: $(".vm_log_container", context).prop("scrollHeight")}, "slow");

      },
      error: function(request, error_json) {
        $(".vm_log_container", context).html(secondaryCenterLabel(Locale.tr("Some ad-block extensions are known to filter the '/log?id=' URL")));

        Notifier.onError(request, error_json);
      }
    });
  }

  function secondaryCenterLabel(text) {
    return "<div class=\"row\">" +
      "<div class=\"large-12 columns monospace\">" +
        "<div class=\"text-center\" style=\"height: 100px;\">" +
          "<span class=\"radius secondary label\"><i class=\"fas fa-exclamation-triangle\"></i> " + text + "</span>" +
        "</div>" +
      "</div>" +
    "</div>";
  }

  function escapeHtml(log_line) {
    return log_line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
