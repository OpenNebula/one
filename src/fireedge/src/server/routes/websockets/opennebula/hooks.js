/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

const { Subscriber } = require('zeromq')
const { messageTerminal, xml2json } = require('server/utils/general')
const {
  middlewareValidateAuthWebsocket,
  middlewareValidateResourceForHookConnection,
  getResourceDataForRequest,
  getDataZone,
} = require('server/utils/server')

const DEFAULT_ERROR_CONFIG = {
  color: 'red',
  message: 'Error: %s',
}

/**
 * Route of websocket HOOKS.
 *
 * @param {object} app - express app
 * @param {string} type - type WS
 */
const main = (app = {}, type = '') => {
  try {
    app
      .use(middlewareValidateAuthWebsocket)
      .use(middlewareValidateResourceForHookConnection)
      .on('connection', (server = {}) => {
        const { id, resource } = getResourceDataForRequest(server)
        const { zone: queryZone } = server?.handshake?.query ?? {}
        const zone = queryZone && queryZone !== 'undefined' ? queryZone : '0'
        const dataZone = getDataZone(zone)
        const zeromqData =
          dataZone && typeof dataZone.zeromq === 'string'
            ? dataZone.zeromq.trim()
            : undefined

        if (zeromqData) {
          const zeromqSock = new Subscriber()
          zeromqSock.connect(zeromqData)
          zeromqSock.subscribe(`EVENT ${resource.toUpperCase()} ${id}`)

          server.on('disconnect', () => {
            try {
              zeromqSock.close()
            } catch (error) {
              messageTerminal({ ...DEFAULT_ERROR_CONFIG, error })
            }
          })
          ;(async () => {
            try {
              for await (const [commandBuf, encodedMessageBuf] of zeromqSock) {
                const command = commandBuf.toString()
                const encodedMessage = encodedMessageBuf.toString()

                if (command && encodedMessage) {
                  const xmlMessage = Buffer.from(
                    encodedMessage,
                    'base64'
                  ).toString('utf8')

                  xml2json(xmlMessage, (error, data) => {
                    if (error) {
                      messageTerminal({ ...DEFAULT_ERROR_CONFIG, error })
                    } else {
                      server.emit(type, { command, data })
                    }
                  })
                }
              }
            } catch (err) {
              messageTerminal({ ...DEFAULT_ERROR_CONFIG, error: err })
            }
          })()
        }
      })
  } catch (error) {
    messageTerminal({ ...DEFAULT_ERROR_CONFIG, error })
  }
}

module.exports = main
