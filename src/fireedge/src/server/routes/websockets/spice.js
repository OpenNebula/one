/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */

const net = require('net')
const { WebSocket, WebSocketServer } = require('ws')
const { endpointSpice } = require('server/utils/constants/defaults')
const {
  clearSpiceSessions,
  getSpiceSession,
} = require('server/services/spice/session')
const { writeInLogger } = require('server/utils/logger')

const rejectUpgrade = (socket, status = '401 Unauthorized') => {
  socket.write(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`)
  socket.destroy()
}

const getToken = (requestUrl = '') => {
  try {
    const { pathname } = new URL(requestUrl, 'http://localhost')
    const prefix = `${endpointSpice}/`

    if (!pathname.startsWith(prefix)) return undefined

    const token = pathname.slice(prefix.length)

    return token && !token.includes('/') ? token : undefined
  } catch {
    return undefined
  }
}

/**
 * Adds the binary websocket to TCP bridge expected by spice-html5 to the
 * existing FireEdge HTTP server.
 *
 * @param {object} appServer - FireEdge HTTP server
 * @returns {{close: Function}|undefined} SPICE proxy
 */
const spice = (appServer = {}) => {
  if (appServer?.constructor?.name !== 'Server') return undefined

  const tcpSockets = new Set()
  const webSocketServer = new WebSocketServer({
    clientTracking: true,
    maxPayload: 64 * 1024 * 1024,
    noServer: true,
    handleProtocols: (protocols) =>
      protocols.has('binary') ? 'binary' : false,
  })

  const upgrade = (req, socket, head) => {
    if (!(req?.url ?? '').startsWith(endpointSpice + '/')) return

    const token = getToken(req?.url)
    const session = token && getSpiceSession(token)

    if (!session) {
      rejectUpgrade(socket)

      return
    }

    webSocketServer.handleUpgrade(req, socket, head, (webSocket) => {
      const tcpSocket = net.createConnection({
        host: session.host,
        port: session.port,
      })
      let finished = false
      const pendingMessages = []

      tcpSockets.add(tcpSocket)
      tcpSocket.setNoDelay(true)

      const connectTimeout = setTimeout(
        () => tcpSocket.destroy(new Error('SPICE server connection timed out')),
        10 * 1000
      )
      connectTimeout.unref?.()

      const finish = () => {
        if (finished) return
        finished = true
        clearTimeout(connectTimeout)
        tcpSockets.delete(tcpSocket)
        tcpSocket.destroy()
      }

      webSocket.on('message', (data) => {
        if (tcpSocket.readyState === 'open') {
          tcpSocket.write(data)
        } else if (tcpSocket.connecting) {
          pendingMessages.push(data)
        }
      })

      webSocket.on('close', finish)
      webSocket.on('error', finish)

      tcpSocket.on('connect', () => {
        clearTimeout(connectTimeout)
        pendingMessages.splice(0).forEach((message) => tcpSocket.write(message))
      })

      tcpSocket.on('data', (data) => {
        if (webSocket.readyState === WebSocket.OPEN) {
          webSocket.send(data, { binary: true })
        }
      })

      tcpSocket.on('close', () => {
        if (webSocket.readyState === WebSocket.OPEN) webSocket.close(1000)
        finish()
      })

      tcpSocket.on('error', (error) => {
        writeInLogger(
          [
            `SPICE proxy connection failed for VM ${session.vmId}`,
            error.message,
          ],
          { format: '%s: %s', level: 2 }
        )
        if (webSocket.readyState === WebSocket.OPEN) {
          webSocket.close(1011, 'SPICE server connection failed')
        }
        finish()
      })

      webSocketServer.emit('connection', webSocket, req)
    })
  }

  appServer.on('upgrade', upgrade)

  const close = () => {
    appServer.off('upgrade', upgrade)
    clearSpiceSessions()
    tcpSockets.forEach((socket) => socket.destroy())
    webSocketServer.clients.forEach((client) => client.terminate())
    webSocketServer.close()
  }

  return { close }
}

module.exports = spice
