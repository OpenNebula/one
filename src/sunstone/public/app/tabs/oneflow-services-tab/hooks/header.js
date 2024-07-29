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

  var OpenNebulaService = require('opennebula/service');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var XML_ROOT = "DOCUMENT";
  var RESOURCE = "Service";
  /*
    FUNCTION DEFINITIONS
   */

  function _pre(info, contextTabId) {
    var element = info[XML_ROOT];

    var state = OpenNebulaService.stateStr(element.TEMPLATE.BODY.state);

    $('.resource-info-header', '#' + TAB_ID).text(element.NAME);
    $('.resource-info-header-small', '#' + TAB_ID).text(state);
  }

  function _post(info, contextTabId) {
  }

  return {
    'pre': _pre,
    'post': _post
  };
});
