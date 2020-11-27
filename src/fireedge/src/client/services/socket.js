import io from 'socket.io-client'
import { defaultAppName } from 'server/utils/constants/defaults'

const appName = defaultAppName? `/${defaultAppName}` : ''

export const websocket = query => io({
  path: `${appName}/websocket`,
  query
})

export default { websocket }
