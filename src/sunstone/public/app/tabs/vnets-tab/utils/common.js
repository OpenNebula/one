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
    Common functions for VNets
   */


  /*
    @param {Object} info Object representing the VNet as returned by OpenNebula
   */
   function _getARList(info){
    var ar_list = info.AR_POOL.AR;

    if (!ar_list){ //empty
      ar_list = [];
    } else if (ar_list.constructor != Array) { //>1 lease
      ar_list = [ar_list];
    }

    return ar_list;
  }

  return {
    'getARList': _getARList
  }
})
