/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { ThunkDispatch, ThunkAction } from 'redux-thunk'
import socketIO, { Socket } from 'socket.io-client'

import { updateResourceOnPool } from 'client/features/OneApi/common'
import { WEBSOCKET_URL, SOCKETS } from 'client/constants'

/**
 * @typedef {'VM'|'HOST'|'IMAGE'|'NET'} HookObjectName
 * - Hook object name to update from socket
 */

/**
 * @typedef HookStateData - Event data from hook event STATE
 * @property {HookStateMessage} HOOK_MESSAGE - Hook message from OpenNebula API
 */

/**
 * @typedef HookStateMessage - Hook message from OpenNebula API
 * @property {'STATE'} HOOK_TYPE - Type of event API
 * @property {HookObjectName} HOOK_OBJECT - Type name of the resource
 * @property {string} STATE - The state that triggers the hook.
 * @property {string} [LCM_STATE]
 * - The LCM state that triggers the hook (Only for VM hooks)
 * @property {string} [REMOTE_HOST]
 * - If ``yes`` the hook will be executed in the host that triggered
 * the hook (for Host hooks) or in the host where the VM is running (for VM hooks).
 * Not used for Image hooks.
 * @property {string} RESOURCE_ID - ID of resource
 * @property {object} [VM] - New data of the VM
 * @property {object} [HOST] - New data of the HOST
 * @property {object} [IMAGE] - New data of the IMAGE
 * @property {object} [NET] - New data of the VNET
 */

/**
 * Creates a socket.
 *
 * @param {Socket} path - The path to get our client file from
 * @param {Socket} query - Any query parameters in our uri
 * @returns {Socket} Socket
 */
const createWebsocket = (path, query) =>
  socketIO({
    path: `${WEBSOCKET_URL}/${path}`,
    query,
    autoConnect: false,
    timeout: 10_000,
    reconnectionAttempts: 5,
  })

/**
 * @param {HookStateData} data - Event data from hook event STATE
 * @returns {object} - New value of resource from socket
 */
const getResourceValueFromEventState = (data) => {
  const hookMessage = data?.HOOK_MESSAGE || {}

  const {
    HOOK_OBJECT: name,
    [name]: valueFromObjectName,
    /**
     * Virtual Network object Type is NET,
     * but in the `HOOK_OBJECT` (object XML) is VNET
     */
    NET,
  } = hookMessage

  return valueFromObjectName ?? NET
}

/**
 * Creates a function to update the data from socket.
 *
 * @param {object} params - Parameters
 * @param {function(Function):ThunkAction} params.updateQueryData - Api
 * @param {HookObjectName} params.resource - Resource name to subscribe
 * @returns {function(
 * { id: string },
 * { dispatch: ThunkDispatch }
 * ):Promise} Function to update data from socket
 */
const UpdateFromSocket =
  ({ updateQueryData, resource }) =>
  async (
    { id },
    { cacheEntryRemoved, cacheDataLoaded, updateCachedData, getState, dispatch }
  ) => {
    const { zone } = getState().general
    const { jwt: token } = getState().auth

    const query = { token, zone, resource, id }
    const socket = createWebsocket(SOCKETS.HOOKS, query)

    try {
      await cacheDataLoaded

      const listener = ({ data } = {}) => {
        const value = getResourceValueFromEventState(data)

        if (!value) return

        const update = updateResourceOnPool({ id, resourceFromQuery: value })
        dispatch(updateQueryData(update))

        updateCachedData((draft) => {
          Object.assign(draft, value)
        })
      }

      socket.on(SOCKETS.HOOKS, listener)
      socket.open()
    } catch {}
    await cacheEntryRemoved
    socket.close()
  }

export { createWebsocket, UpdateFromSocket }
