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
    Generate an Object containing the html for the real and allocated CPU
   */

  var ProgressBar = require('utils/progress-bar');
  var Humanize = require('utils/humanize')

  /*
    @param {Object} info Object representing the Host as returned by OpenNebula
    @param {Boolean} hostShareFlag if true the info param is the HOST_SHARE element instead of HOSt
   */
  var _html = function(host, hostShareFlag) {
    var hostShare = hostShareFlag ? host : host && host.HOST_SHARE;
    var hostMonitoring = hostShareFlag ? host : host.MONITORING && host.MONITORING.CAPACITY
    var infoStr;
    var allocatedCPUBar
    if (hostShare.CPU_USAGE) {
      var maxCPU = parseInt(hostShare.MAX_CPU||0);
      var allocatedCPU = parseInt(hostShare.CPU_USAGE,10);
      if (maxCPU > 0) {
        var ratioAllocatedCPU = Math.round((allocatedCPU / maxCPU) * 100);
        infoStr = allocatedCPU + ' / ' + maxCPU + ' (' + ratioAllocatedCPU + '%)';
      } else {
        infoStr = "";
      }
      allocatedCPUBar = ProgressBar.html(allocatedCPU, maxCPU, infoStr);
    }
    var realCPUBar;
    if (hostMonitoring && hostMonitoring.USED_CPU) {
      var totalCPU = hostShareFlag ? parseInt(hostShare.MAX_CPU||0) : parseInt(hostShare.TOTAL_CPU||0);
      var realCPU = parseInt(hostMonitoring.USED_CPU,10);
      if (totalCPU > 0) {
          var ratioRealCPU = Math.round((realCPU / totalCPU) * 100);
          infoStr = realCPU + ' / ' + totalCPU + ' (' + ratioRealCPU + '%)';
      } else {
          infoStr = "";
      }
      realCPUBar = ProgressBar.html(realCPU, totalCPU, infoStr);
    }
    return {
      real: realCPUBar,
      allocated: allocatedCPUBar
    }
  }
  return {
    'html': _html
  }
})
