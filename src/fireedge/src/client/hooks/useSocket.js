import { useContext, useCallback } from 'react'
import socketIO from 'socket.io-client'

import { APP_URL, SOCKETS } from 'client/constants'
import { SocketContext } from 'client/providers/socketProvider'

import { useAuth } from 'client/features/Auth'
import { useGeneral } from 'client/features/General'

const createWebsocket = (path, query) => socketIO({ path: `${APP_URL}/${path}`, query })

export default function useSocket () {
  const { jwt } = useAuth()
  const { zone } = useGeneral()

  const { socket, isConnected } = useContext(SocketContext)

  const getHooksSocketTemporal = useCallback(({ resource, id }) => {
    const socket = createWebsocket(
      SOCKETS.hooks,
      { token: jwt, zone, resource, id }
    )

    return {
      connect: callback => {
        socket.on(SOCKETS.hooks, callback)
      },
      disconnect: () => {
        socket.disconnect()
      }
    }
  }, [jwt, zone])

  const getHooksSocket = useCallback(func => ({
    on: () => isConnected && socket.on(SOCKETS.hooks, func),
    off: () => isConnected && socket.off(SOCKETS.hooks, func)
  }), [socket, isConnected])

  const getProvisionSocket = useCallback(func => ({
    on: () => isConnected && socket.on(SOCKETS.provision, func),
    off: () => isConnected && socket.off(SOCKETS.provision, func)
  }), [socket, isConnected])

  return {
    isConnected,
    getHooksSocket,
    getProvisionSocket,
    getHooksSocketTemporal
  }
}
