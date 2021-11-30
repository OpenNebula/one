/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { useCallback } from 'react'
import socketIO from 'socket.io-client'
import { useDispatch } from 'react-redux'

import { WEBSOCKET_URL, SOCKETS } from 'client/constants'

import { useAuth } from 'client/features/Auth'
import { useGeneral } from 'client/features/General'
import {
  eventUpdateResourceState,
  getResourceFromEventState,
} from 'client/features/One/socket/actions'
import { updateResourceFromFetch } from 'client/features/One/actions'

const createWebsocket = (path, query) =>
  socketIO({
    path: `${WEBSOCKET_URL}/${path}`,
    query,
    autoConnect: false,
    timeout: 10_000,
    reconnectionAttempts: 5,
  })

/**
 * Hook to manage the OpenNebula sockets.
 *
 * @returns {{
 * getHooksSocket: Function,
 * getProvisionSocket: Function
 * }} - List of functions to interactive with FireEdge sockets
 */
const useSocket = () => {
  const dispatch = useDispatch()
  const { jwt } = useAuth()
  const { zone } = useGeneral()

  /**
   * @param {('vm'|'host'|'image')} resource - Resource name
   * @param {string} id - Resource id
   * @returns {{ connect: Function, disconnect: Function }}
   * - Functions to manage the socket connections
   */
  const getHooksSocket = useCallback(
    ({ resource, id }) => {
      const socket = createWebsocket(SOCKETS.HOOKS, {
        token: jwt,
        zone,
        resource,
        id,
      })

      return {
        connect: ({ dataFromFetch, callback }) => {
          dataFromFetch &&
            socket.on(SOCKETS.CONNECT, () => {
              // update redux state from data fetched
              dispatch(
                updateResourceFromFetch({ data: dataFromFetch, resource })
              )
            })

          socket.on(SOCKETS.HOOKS, ({ data } = {}) => {
            // update the list on redux state
            dispatch(eventUpdateResourceState(data))
            // return data from event
            callback(getResourceFromEventState(data).value)
          })

          socket.connect()
        },
        disconnect: () => socket.connected && socket.disconnect(),
      }
    },
    [jwt, zone]
  )

  /**
   * @param {Function} callback - Callback from socket
   * @returns {{ on: Function, off: Function }}
   * - Functions to manage the socket connections
   */
  const getProvisionSocket = useCallback((callback) => {
    const socket = createWebsocket(SOCKETS.PROVISION, { token: jwt, zone })

    socket.on(SOCKETS.PROVISION, callback)

    return {
      on: () => socket.connect(),
      off: () => socket.disconnect(),
    }
  }, [])

  return {
    getHooksSocket,
    getProvisionSocket,
  }
}

export default useSocket
