import io from 'socket.io-client'
import { WEBSOCKET_URL } from 'client/constants'

export const websocket = query => io({
  path: WEBSOCKET_URL,
  query
})

export default { websocket }
