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

  var BasePanel = require('tabs/templates-tab/panels/template-common');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./template/panelId');
  var RESOURCE = "VirtualRouterTemplate"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.tabId = TAB_ID;
    this.resource = RESOURCE;

    return BasePanel.call(this, info);
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype = Object.create(BasePanel.prototype);
  Panel.prototype.constructor = Panel;

  return Panel;
});
