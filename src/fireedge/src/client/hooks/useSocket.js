import { useContext, useMemo } from 'react'

import { SocketContext } from 'client/providers/socketProvider'

const SOCKETS = {
  hooks: 'hooks',
  provision: 'provision'
}

export default function useSocket () {
  const { socket, isConnected } = useContext(SocketContext)

  const getHooks = useMemo(() => ({
    on: (func) => isConnected && socket.on(SOCKETS.hooks, func),
    off: () => isConnected && socket.off()
  }), [socket, isConnected])

  const getProvision = useMemo(() => ({
    on: (func) => isConnected && socket.on(SOCKETS.provision, func),
    off: () => isConnected && socket.off()
  }), [socket, isConnected])

  return { isConnected, getHooks, getProvision }
}
