import io from 'socket.io-client'

export const websocket = query => io({
  path: '/websocket',
  query
})

export default { websocket }
