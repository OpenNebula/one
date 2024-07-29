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
    Common functions for VM Groups
   */

  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var Navigation = require('utils/navigation');

  function _sgRoleToSt(role){
    var text = {};
    text["NAME"] = role.NAME;
    text["VIRTUAL_MACHINES"] = role.VIRTUAL_MACHINES;
    text["HOST_AFFINED"] = role.HOST_AFFINED;
    text["HOST_ANTI_AFFINED"] = role.HOST_ANTI_AFFINED;
    (role.POLICY)?text["POLICY"] = role.POLICY: text["POLICY"] = "NONE";
    return text;
  }

  function _sgGroupRoleToSt(group_role){
    var POLICY = Object.keys(group_role)[0];
    var text = {};
    text["POLICY"] = POLICY;
    text["ROLES"] = group_role[POLICY];
    return text;
  }

  function _getRoles(info){
    var roles = info.ROLES;

    if (!roles) //empty
      roles = [];
    return roles;
  }

  function _getGroupRoles(info){
    var roles = [];
    if(Array.isArray(info.TEMPLATE.AFFINED)){
      data = $.extend({}, info.TEMPLATE.AFFINED);
      for (d in data){
        roles.push({"AFFINED":data[d]});
      }
    }
    else{
      roles.push({"AFFINED":info.TEMPLATE.AFFINED});
    }
    if(Array.isArray(info.TEMPLATE.ANTI_AFFINED)){
      data = $.extend({}, info.TEMPLATE.ANTI_AFFINED);
      for (d in data){
        roles.push({"ANTI_AFFINED":data[d]});
      }
    }
    else{
      roles.push({"ANTI_AFFINED":info.TEMPLATE.ANTI_AFFINED});
    }

    if (!roles) //empty
      roles = [];
    return roles;
  }

  return {
    'sgRoleToSt': _sgRoleToSt,
    'getRoles': _getRoles,
    'getGroupRoles': _getGroupRoles,
    'sgGroupRoleToSt': _sgGroupRoleToSt
  };
});
