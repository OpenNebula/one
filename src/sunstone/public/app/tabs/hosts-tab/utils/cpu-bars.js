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
    Generate an Object containing the html for the real and allocated CPU
   */

  var ProgressBar = require('utils/progress-bar');
  var Humanize = require('utils/humanize')

  /*
    @param {Object} info Object representing the Host as returned by OpenNebula
    @param {Boolean} hostShareFlag if true the info param is the HOST_SHARE element instead of HOSt
   */
  var _html = function(host, hostShareFlag) {
    var hostShare = hostShareFlag ? host : host.HOST_SHARE;
    var maxCPU = parseInt(hostShare.MAX_CPU);
    var infoStr;

    var allocatedCPUBar
    if (hostShare.CPU_USAGE) {
      var allocatedCPU = parseInt(hostShare.CPU_USAGE);

      if (maxCPU > 0) {
          var ratioAllocatedCPU = Math.round((allocatedCPU / maxCPU) * 100);
          infoStr = allocatedCPU + ' / ' + maxCPU + ' (' + ratioAllocatedCPU + '%)';
      } else {
          infoStr = "";
      }

      allocatedCPUBar = ProgressBar.html(allocatedCPU, maxCPU, infoStr);
    }

    var realCPUBar
    if (hostShare.USED_CPU) {
      var realCPU = parseInt(hostShare.USED_CPU);

      if (maxCPU > 0) {
          var ratioRealCPU = Math.round((realCPU / maxCPU) * 100);
          infoStr = realCPU + ' / ' + maxCPU + ' (' + ratioRealCPU + '%)';
      } else {
          infoStr = "";
      }

      realCPUBar = ProgressBar.html(realCPU, maxCPU, infoStr);
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
