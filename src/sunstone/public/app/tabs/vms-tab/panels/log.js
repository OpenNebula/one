/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');
  var OpenNebulaVM = require('opennebula/vm');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./log/panelId');
  var RESOURCE = "VM"
  var XML_ROOT = "VM"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.panelId = PANEL_ID;
    this.title = Locale.tr("Log");
    this.icon = "fa-file-text";

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
    return '<div class="row">' +
      '<div class="large-12 columns vm_log_container">' +
        '<div class="text-center" style="height: 100px;">' +
          '<span id="provision_dashboard_total" style="font-size:80px">' +
            '<i class="fa fa-spinner fa-spin"></i>' +
          '</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function _setup(context) {
  }

  function _onShow(context) {
    var that = this;
    OpenNebulaVM.log({
      data: {id: that.element.ID},
      success: function(req, response) {
        var log_lines = response['vm_log'].split("\n");
        var colored_log = '';
        for (var i = 0; i < log_lines.length; i++) {
          var line = log_lines[i];
          if (line.match(/\[E\]/)) {
            line = '<span class="vm_log_error">' + line + '</span>';
          }
          colored_log += line + "<br>";
        }

        $('.vm_log_container', context).html(
          '<div class="row">' +
            '<div class="large-11 small-centered columns log-tab">' +
              colored_log +
            '</div>' +
          '</div>')

      },
      error: function(request, error_json) {
        $('.vm_log_container', context).html('');
        Notifier.onError(request, error_json);
      }
    });
  }
});
