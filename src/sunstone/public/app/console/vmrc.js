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
  var UtilsConnection = require("utils/info-connection/utils");

  var endpoint = new URL(window.location.href);
  var encoded_socket = endpoint.searchParams.get("socket");
  var socket_string = atob(encoded_socket);
  var socket_endpoint = new URL(socket_string);
  var info = socket_endpoint.searchParams.get("info");

  var info_decode = UtilsConnection.decodeInfoConnection(info);
  UtilsConnection.printInfoConnection($('.VMRC_info'), info_decode);
});
