import React, { createContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'

import * as serviceSocket from 'client/services/socket'

const CONNECT = 'connect'
const DISCONNECT = 'disconnect'

export const SocketContext = createContext(null)

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState({})
  const [isConnected, setConnected] = useState(false)
  const { jwt, zone } = useSelector(state => ({
    zone: state?.General?.zone,
    jwt: state?.Authenticated?.jwt
  }))

  useEffect(() => {
    if (!jwt) return

    const client = serviceSocket.websocket({ token: jwt, zone })
    client.on(CONNECT, () => setConnected(true))
    client.on(DISCONNECT, () => setConnected(false))
    setSocket(client)

    return () => {
      setSocket(null)
      return client.disconnect()
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
