/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { ThunkDispatch } from 'redux-thunk'
import socketIO, { Socket } from 'socket.io-client'

import { SOCKETS, WEBSOCKET_URL } from '@ConstantsModule'
import { updateResourceOnPool } from '@modules/features/OneApi/common'
import { oneApi } from '@modules/features/OneApi/oneApi'

const poolConnections = new Map()

/**
 * @typedef {'VM'|'HOST'|'IMAGE'|'NET'|'VNET'} HookObjectName
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
 * Updates every cached pool query that contains the resource.
 *
 * @param {object} params - Parameters
 * @param {HookObjectName} params.resource - Resource type
 * @param {string|number} params.id - Resource ID
 * @param {Function} params.updateRecipe - RTK Query cache update recipe
 * @param {object} params.state - Redux state
 * @param {ThunkDispatch} params.dispatch - Redux dispatch
 */
const updateResourcePoolQueries = ({
  resource,
  id,
  updateRecipe,
  state,
  dispatch,
}) => {
  const poolTag = { type: `${resource}_POOL`, id: `${id}` }

  oneApi.util
    .selectInvalidatedBy(state, [poolTag])
    .forEach(({ endpointName, originalArgs }) =>
      dispatch(
        oneApi.util.updateQueryData(endpointName, originalArgs, updateRecipe)
      )
    )
}

/**
 * Creates one shared socket per resource pool and zone.
 *
 * @param {object} params - Parameters
 * @param {HookObjectName} params.resource - Resource name to subscribe
 * @returns {function(
 * object,
 * { dispatch: ThunkDispatch }
 * ):Promise} Function to update pool data from the socket
 */
const UpdatePoolFromSocket =
  ({ resource }) =>
  async (_, { cacheEntryRemoved, cacheDataLoaded, getState, dispatch }) => {
    let connection
    let connectionKey
    let acquired = false

    try {
      await cacheDataLoaded

      const { zone } = getState().general
      connectionKey = `${zone}:${resource}`
      connection = poolConnections.get(connectionKey)

      if (!connection) {
        const socket = createWebsocket(SOCKETS.HOOKS, {
          zone,
          resource,
          pool: true,
        })

        const listener = ({ data } = {}) => {
          const value = getResourceValueFromEventState(data)
          const id = data?.HOOK_MESSAGE?.RESOURCE_ID ?? value?.ID
          if (!value || id === undefined || id === null) return

          updateResourcePoolQueries({
            resource,
            id,
            updateRecipe: updateResourceOnPool({
              id,
              resourceFromQuery: value,
            }),
            state: getState(),
            dispatch,
          })
        }

        socket.on(SOCKETS.HOOKS, listener)
        socket.open()

        connection = { socket, references: 0 }
        poolConnections.set(connectionKey, connection)
      }

      connection.references += 1
      acquired = true
      await cacheEntryRemoved
    } catch {
      // The query cache can be removed before its initial request completes.
    } finally {
      if (acquired) {
        connection.references -= 1
        if (
          connection.references === 0 &&
          poolConnections.get(connectionKey) === connection
        ) {
          connection.socket.close()
          poolConnections.delete(connectionKey)
        }
      }
    }
  }

/**
 * Creates a function to update the data from socket.
 *
 * @param {object} params - Parameters
 * @param {HookObjectName} params.resource - Resource name to subscribe
 * @returns {function(
 * { id: string },
 * { dispatch: ThunkDispatch }
 * ):Promise} Function to update data from socket
 */
const UpdateFromSocket =
  ({ resource }) =>
  async (
    { id },
    { cacheEntryRemoved, cacheDataLoaded, updateCachedData, getState, dispatch }
  ) => {
    const { zone } = getState().general

    const query = { zone, resource, id }
    const socket = createWebsocket(SOCKETS.HOOKS, query)

    try {
      await cacheDataLoaded

      const listener = ({ data } = {}) => {
        const value = getResourceValueFromEventState(data)
        if (!value) return

        const update = updateResourceOnPool({ id, resourceFromQuery: value })
        updateResourcePoolQueries({
          resource,
          id,
          updateRecipe: update,
          state: getState(),
          dispatch,
        })

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

export {
  createWebsocket,
  updateResourcePoolQueries,
  UpdateFromSocket,
  UpdatePoolFromSocket,
}
