import React, { createContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import socketIO from 'socket.io-client'
import { useSelector, useDispatch } from 'react-redux'

import { WEBSOCKET_URL, SOCKETS } from 'client/constants'
import * as sockets from 'client/features/One/socket/actions'

const createWebsocket = query => socketIO({ path: WEBSOCKET_URL, query })

const CONNECT = 'connect'
const DISCONNECT = 'disconnect'

export const SocketContext = createContext(null)

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState({})
  const [isConnected, setConnected] = useState(false)

  const dispatch = useDispatch()
  const { jwt, zone } = useSelector(state => ({
    zone: state?.general?.zone,
    jwt: state?.auth?.jwt
  }))

  useEffect(() => {
    if (!jwt) return

    const client = createWebsocket({ token: jwt, zone })
    setSocket(client)

    client.on(CONNECT, () => setConnected(true))
    client.on(DISCONNECT, () => setConnected(false))

    client.on(SOCKETS.hooks, data => {
      dispatch(sockets.socketEventState(data))
    })

    client.on(SOCKETS.provision, data => {
      dispatch(sockets.socketCreateProvision(data))
    })

    return () => {
      setSocket(null)
      client?.disconnect()
    }
  }, [jwt, zone])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

SocketProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
}

SocketProvider.defaultProps = {
  children: undefined
}

export default SocketProvider
