import { useCallback } from 'react'
import socketIO from 'socket.io-client'
import { useDispatch } from 'react-redux'

import { WEBSOCKET_URL, SOCKETS } from 'client/constants'

import { useAuth } from 'client/features/Auth'
import { useGeneral } from 'client/features/General'
import { eventUpdateResourceState, getResourceFromEventState } from 'client/features/One/socket/actions'
import { updateResourceFromFetch } from 'client/features/One/actions'

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

  const getHooksSocket = useCallback(({ resource, id }) => {
    const socket = createWebsocket(
      SOCKETS.HOOKS,
      { token: jwt, zone, resource, id }
    )

    return {
      connect: ({ dataFromFetch, callback }) => {
        dataFromFetch && socket.on(SOCKETS.CONNECT, () => {
          // update from data fetched
          dispatch(updateResourceFromFetch({ data: dataFromFetch, resource }))
        })

        socket.on(SOCKETS.HOOKS, data => {
          // update the list on redux state
          dispatch(eventUpdateResourceState(data))
          // return data from event
          callback(getResourceFromEventState(data).value)
        })

        socket.connect()
      },
      disconnect: () => socket.connected && socket.disconnect()
    }
  }, [jwt, zone])

  const getProvisionSocket = useCallback(func => {
    const socket = createWebsocket(SOCKETS.PROVISION, { token: jwt, zone })

    socket.on(SOCKETS.PROVISION, func)

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
