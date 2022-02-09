/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { createContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import socketIO from 'socket.io-client'
import { useSelector, useDispatch } from 'react-redux'

import { WEBSOCKET_URL, SOCKETS } from 'client/constants'
import * as sockets from 'client/features/One/socket/actions'

const createProvisionWebsocket = (query) =>
  socketIO({
    path: `${WEBSOCKET_URL}/${SOCKETS.PROVISION}`,
    query,
  })

export const SocketContext = createContext(null)

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState({})

  const dispatch = useDispatch()
  const { jwt, zone } = useSelector((state) => ({
    zone: state?.general?.zone,
    jwt: state?.auth?.jwt,
  }))

  useEffect(() => {
    if (!jwt) return

    const client = createProvisionWebsocket({ token: jwt, zone })
    setSocket(client)

    client.on(SOCKETS.PROVISION, (data) => {
      dispatch(sockets.onCreateProvision(data))
    })

    return () => {
      setSocket(null)
      client?.disconnect()
    }
  }, [jwt, zone])

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}

SocketProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
}

SocketProvider.defaultProps = {
  children: undefined,
}

export default SocketProvider
