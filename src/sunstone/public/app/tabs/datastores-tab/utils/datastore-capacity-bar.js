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
    Generate the HTML representing the capacity of the Datastore
   */

  var ProgressBar = require('utils/progress-bar');
  var Humanize = require('utils/humanize')

  /*
    @param {Object} info Object representing the Datastore as returned by OpenNebula
   */
  var _html = function(info) {
    var total = parseInt(info.TOTAL_MB);
    var used = parseInt(info.USED_MB);

    if (total > 0) {
      var ratio = Math.round((used / total) * 100);
      info_str = Humanize.sizeFromMB(used) + ' / ' + Humanize.sizeFromMB(total) + ' (' + ratio + '%)';
    } else {
      if (info.TYPE == 1) {
        info_str = '- / -';
      } else {
        info_str = Humanize.size(used) + ' / -';
      }
    }

    return ProgressBar.html(used, total, info_str);
  }

  return {
    'html': _html
  }
})
