import { useContext, useCallback } from 'react'

import { SOCKETS } from 'client/constants'
import { SocketContext } from 'client/providers/socketProvider'

export default function useSocket () {
  const { socket, isConnected } = useContext(SocketContext)

  const getHooksSocket = useCallback(func => ({
    on: () => isConnected && socket.on(SOCKETS.hooks, func),
    off: () => isConnected && socket.off(SOCKETS.hooks, func)
  }), [socket, isConnected])

  const getProvisionSocket = useCallback(func => ({
    on: () => isConnected && socket.on(SOCKETS.provision, func),
    off: () => isConnected && socket.off(SOCKETS.provision, func)
  }), [socket, isConnected])

  return { isConnected, getHooksSocket, getProvisionSocket }
}
