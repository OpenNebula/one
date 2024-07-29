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
import { useCallback } from 'react'
import { Socket } from 'socket.io-client'

import { useAuth } from 'client/features/Auth'
import { useGeneral } from 'client/features/General'
import { createWebsocket } from 'client/features/OneApi/socket'
import { SOCKETS } from 'client/constants'

/**
 * Hook to manage the OpenNebula sockets.
 *
 * @returns {{ getProvisionSocket: Function }} - List of functions to interactive with FireEdge sockets
 */
const useSocket = () => {
  const { jwt } = useAuth()
  const { zone } = useGeneral()

  /**
   * @param {Function} callback - Callback from socket
   * @returns {Socket} - Socket
   */
  const getProvisionSocket = useCallback(
    (callback) => {
      const socket = createWebsocket(SOCKETS.PROVISION, { token: jwt, zone })

      socket.on(SOCKETS.PROVISION, callback)

      return {
        on: () => socket.connect(),
        off: () => socket.disconnect(),
      }
    },
    [jwt, zone]
  )

  return { getProvisionSocket }
}

export default useSocket
