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
  var OpenNebulaVM = require("opennebula/vm");
  var OpenNebulaService = require("opennebula/service");

  var TemplateInfo = require("hbs!./info");

  function printInfoConnection(context, info) {
    context.empty();
    info && context.append(TemplateInfo(info));

    if (info && info.name) {
      document.title = info.name;
    }
  }

  function decodeInfoConnection(info_encode) {
    if (!info_encode) return undefined;

    try {
      var json = atob(info_encode);
      var info = JSON.parse(json);

      var stateId = OpenNebulaVM.STATES[info.state];
      var lcmStateId = OpenNebulaVM.LCM_STATES[info.state];
      var stateClass = OpenNebulaVM.stateClass(stateId) || OpenNebulaVM.lcmStateClass(lcmStateId);

      var service = OpenNebulaService.getService(info.service_id);

      return $.extend(info, { stateClass, service });

    } catch (err) {
      console.log(err);
    }
  }

  return {
    "printInfoConnection": printInfoConnection,
    "decodeInfoConnection": decodeInfoConnection
  };
});
