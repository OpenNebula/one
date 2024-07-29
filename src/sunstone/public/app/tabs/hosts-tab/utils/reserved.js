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

  function _updateHostTemplate(cache, element) {
    var elementAux = $.extend(true, {}, element);
    if (cache && (elementAux.TEMPLATE.RESERVED_CPU === "" || elementAux.TEMPLATE.RESERVED_MEM === "")) {
      $.each(cache.data, function(key, value){
        if (value.CLUSTER.ID === elementAux.CLUSTER_ID){
          if (elementAux.TEMPLATE.RESERVED_CPU === ""){
            var cpuPercentage = value.CLUSTER.TEMPLATE.RESERVED_CPU.split("%")[0];
            var cpu = cpuPercentage / 100 * elementAux.HOST_SHARE.TOTAL_CPU;
            elementAux.HOST_SHARE.MAX_CPU = (elementAux.HOST_SHARE.TOTAL_CPU - cpu).toString();
          }
          if (elementAux.TEMPLATE.RESERVED_MEM === ""){
            var memPercentage = value.CLUSTER.TEMPLATE.RESERVED_MEM.split("%")[0];
            var mem = memPercentage / 100 * elementAux.HOST_SHARE.TOTAL_MEM;
            elementAux.HOST_SHARE.MAX_MEM = (elementAux.HOST_SHARE.TOTAL_MEM - mem).toString();
          }
        }
      });
    }
		return elementAux;
	}

	return {
    "updateHostTemplate": _updateHostTemplate
	};

});