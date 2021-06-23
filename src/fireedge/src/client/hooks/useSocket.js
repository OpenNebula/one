import { useCallback } from 'react'
import socketIO from 'socket.io-client'
import { useDispatch } from 'react-redux'

import { WEBSOCKET_URL, SOCKETS } from 'client/constants'

import { useAuth } from 'client/features/Auth'
import { useGeneral } from 'client/features/General'
import { eventUpdateResourceState, getResourceFromEventState } from 'client/features/One/socket/actions'

const createWebsocket = (path, query) => socketIO({
  path: `${WEBSOCKET_URL}/${path}`,
  query,
  autoConnect: false,
  timeout: 10_000,
  reconnectionAttempts: 5
})

export default function useSocket () {
  const dispatch = useDispatch()
  const { jwt } = useAuth()
  const { zone } = useGeneral()

  const getHooksSocket = useCallback(query => {
    const socket = createWebsocket(SOCKETS.hooks, { token: jwt, zone, ...query })

    return {
      connect: callback => {
        socket.on(SOCKETS.hooks, data => {
          // update the list on redux state
          dispatch(eventUpdateResourceState(data))
          // return data from event
          callback(getResourceFromEventState(data).value)
        })

        socket.connect()
      },
      disconnect: () => {
        socket.connected && socket.disconnect()
      }
    }
  }, [jwt, zone])

  const getProvisionSocket = useCallback(func => {
    const socket = createWebsocket(SOCKETS.provision, { token: jwt, zone })

    socket.on(SOCKETS.provision, func)

    return {
      on: () => socket.connect(),
      off: () => socket.disconnect()
    }
  }, [])

  return {
    getHooksSocket,
    getProvisionSocket
  }
}
