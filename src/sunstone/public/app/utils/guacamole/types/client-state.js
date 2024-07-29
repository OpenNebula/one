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

  require("guacamole-common-js")
  
  /**
   * Object which represents the state of a Guacamole client and its tunnel,
   * including any error conditions.
   * 
   * @constructor
   * @param {ManagedClientState|Object} [template = {}]
   *     The object whose properties should be copied within the new
   *     ManagedClientState.
   */
  function ManagedClientState(template = {}) {
    /**
     * The current connection state. Valid values are described by
     * ManagedClientState.ConnectionState.
     *
     * @type {String}
     * @default ManagedClientState.ConnectionState.IDLE
     */
    this.connectionState = template.connectionState || ManagedClientState.ConnectionState.IDLE;

    /**
     * Whether the network connection used by the tunnel seems unstable. If
     * the network connection is unstable, the remote desktop connection
     * may perform poorly or disconnect.
     *
     * @type {Boolean}
     * @default false
     */
    this.tunnelUnstable = template.tunnelUnstable || false;

    /**
     * The status code of the current error condition, if connectionState
     * is CLIENT_ERROR or TUNNEL_ERROR. For all other connectionState
     * values, this will be @link{Guacamole.Status.Code.SUCCESS}.
     *
     * @type {Number}
     * @default Guacamole.Status.Code.SUCCESS
     */
    this.statusCode = template.statusCode || Guacamole.Status.Code.SUCCESS;
  };

  /**
   * Valid connection state strings. Each state string is associated with a
   * specific state of a Guacamole connection.
   */
  ManagedClientState.ConnectionState = {
    IDLE : "IDLE",
    CONNECTING : "CONNECTING",
    WAITING : "WAITING",
    CONNECTED : "CONNECTED",
    DISCONNECTED : "DISCONNECTED",
    CLIENT_ERROR : "CLIENT_ERROR",
    TUNNEL_ERROR : "TUNNEL_ERROR"
  };

  /**
   * Sets the current client state and, if given, the associated status code.
   * If an error is already represented, this function has no effect. If the
   * client state was previously marked as unstable, that flag is implicitly
   * cleared.
   *
   * @param {ManagedClientState} clientState The ManagedClientState to update.
   *
   * @param {String} connectionState
   *     The connection state to assign to the given ManagedClientState, as
   *     listed within ManagedClientState.ConnectionState.
   * 
   * @param {Number} [statusCode]
   *     The status code to assign to the given ManagedClientState, if any,
   *     as listed within Guacamole.Status.Code. If no status code is
   *     specified, the status code of the ManagedClientState is not touched.
   */
  ManagedClientState.setConnectionState = function(clientState, connectionState, statusCode) {
    // Do not set state after an error is registered
    if (
      clientState.connectionState === ManagedClientState.ConnectionState.TUNNEL_ERROR ||
      clientState.connectionState === ManagedClientState.ConnectionState.CLIENT_ERROR
    ) {
      return;
    }

    // Update connection state
    clientState.connectionState = connectionState;
    clientState.tunnelUnstable = false;

    // Set status code, if given
    if (statusCode) {
      clientState.statusCode = statusCode;
    }
  };

  /**
   * Updates the given client state, setting whether the underlying tunnel
   * is currently unstable. An unstable tunnel is not necessarily
   * disconnected, but appears to be misbehaving and may be disconnected.
   *
   * @param {ManagedClientState} clientState The ManagedClientState to update.
   *
   * @param {Boolean} unstable
   *     Whether the underlying tunnel of the connection currently appears unstable.
   */
  ManagedClientState.setTunnelUnstable = function(clientState, unstable) {
    clientState.tunnelUnstable = unstable;
  };

  return ManagedClientState;

});