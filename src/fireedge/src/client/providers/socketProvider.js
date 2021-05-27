import React, { createContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

import io from 'socket.io-client'
import { WEBSOCKET_URL } from 'client/constants'

const websocket = query => io({ path: WEBSOCKET_URL, query })

const CONNECT = 'connect'
const DISCONNECT = 'disconnect'

export const SocketContext = createContext(null)

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState({})
  const [isConnected, setConnected] = useState(false)
  const { jwt, zone } = useSelector(state => ({
    zone: state?.general?.zone,
    jwt: state?.auth?.jwt
  }))

  useEffect(() => {
    if (!jwt) return

    const client = websocket({ token: jwt, zone })
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
