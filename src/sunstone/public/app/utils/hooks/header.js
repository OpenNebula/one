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
    FUNCTION DEFINITIONS
   */
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');

  function _pre(info, contextTabId) {
    var element = info[Object.keys(info)[0]];

    $('.resource-info-header', '#' + contextTabId).text(element.NAME);

    if (element.LOCK){
      $('.resource-lock-header-small', '#' + contextTabId).html("<span data-tooltip aria-haspopup='true' class='has-tip' data-disable-hover='false' tabindex='1' title="+Locale.tr(Humanize.lock_to_str(element.LOCK.LOCKED))+"><i class='fas fa-lock fa-2x'/></span>");
    } else {
      $('.resource-lock-header-small', '#' + contextTabId).html("<i style='color: #cacedd;' class='fas fa-unlock-alt fa-2x'/>");
    }
  }

  function _post(info, contextTabId) {
  }

  return {
    'pre': _pre,
    'post': _post
  };
});
