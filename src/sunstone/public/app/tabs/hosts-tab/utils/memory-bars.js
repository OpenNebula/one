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
    Generate an Object containing the html for the real and allocated MEMORY
   */

  var ProgressBar = require('utils/progress-bar');
  var Humanize = require('utils/humanize')

  /*
    @param {Object} info Object representing the Host as returned by OpenNebula
    @param {Boolean} hostShareFlag if true the info param is the HOST_SHARE element instead of HOSt
   */
  var _html = function(host, hostShareFlag) {
    var hostShare = hostShareFlag ? host : host.HOST_SHARE;
    var hostMonitoring = hostShareFlag ? host : host.MONITORING && host.MONITORING.CAPACITY
    var infoStr = "";
    var allocatedMemBar;
    if (hostShare.MEM_USAGE) {
      var maxMem = parseInt(hostShare.MAX_MEM||0);
      var allocatedMem = parseInt(hostShare.MEM_USAGE);
      if (maxMem > 0) {
        var ratioAllocatedMem = Math.round((allocatedMem / maxMem) * 100);
        infoStr = Humanize.size(allocatedMem) + ' / ' + Humanize.size(maxMem) + ' (' + ratioAllocatedMem + '%)';
      } else {
        infoStr = Humanize.size(allocatedMem) + ' / -';
      }
      allocatedMemBar = ProgressBar.html(allocatedMem, maxMem, infoStr);
    }
    var realMemBar;
    if (hostMonitoring && (hostMonitoring.USED_MEMORY || hostMonitoring.USED_MEM)) {
      var totalMem = hostShareFlag ? parseInt(hostShare.MAX_MEM||0) : parseInt(hostShare.TOTAL_MEM||0);
      var realMem = hostShareFlag ? parseInt(hostMonitoring.USED_MEM,10) : parseInt(hostMonitoring.USED_MEMORY,10);
      if (totalMem > 0) {
          var ratioRealMem = Math.round((realMem / totalMem) * 100);
          infoStr = Humanize.size(realMem) + ' / ' + Humanize.size(totalMem) + ' (' + ratioRealMem + '%)';
      } else {
          infoStr = Humanize.size(realMem) + ' / -';
      }
      realMemBar = ProgressBar.html(realMem, totalMem, infoStr);
    }
    return {
      real: realMemBar,
      allocated: allocatedMemBar
    }
  }
  return {
    'html': _html
  }
})
