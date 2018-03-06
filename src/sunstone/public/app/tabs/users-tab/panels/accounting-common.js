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

  var Locale = require('utils/locale');
  var Accounting = require('utils/accounting');

  /*
    CONSTANTS
   */

  var RESOURCE = "User";
  var XML_ROOT = "USER";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Accounting");
    this.icon = "fa-chart-bar";

    this.element = info[XML_ROOT];

    return this;
  }

  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return Accounting.html();
  }

  function _setup(context) {
    Accounting.setup(
      context,
      { fixed_user: this.element.ID,
        init_group_by: "vm"
      });
  }
});
