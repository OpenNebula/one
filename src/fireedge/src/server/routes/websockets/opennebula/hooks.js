/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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

const atob = require('atob')
const { socket: socketZeroMQ } = require('zeromq')
const { messageTerminal, xml2json } = require('server/utils/general')
const {
  middlewareValidateAuthWebsocket,
  middlewareValidateResourceForHookConnection,
  getResourceDataForRequest,
  getDataZone,
  getQueryData,
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
        const { zone: queryZone } = getQueryData(server)
        const zone = queryZone && queryZone !== 'undefined' ? queryZone : '0'
        const dataZone = getDataZone(zone)

        if (dataZone && dataZone.zeromq) {
          const zeromqSock = socketZeroMQ('sub')

          zeromqSock.connect(dataZone.zeromq)
          zeromqSock.subscribe(`EVENT ${resource.toUpperCase()} ${id}/`) // state

          server.on('disconnect', () => zeromqSock.close())

          zeromqSock.on('message', (...args) => {
            const [command, encodedMessage] = Array.prototype.slice
              .call(args)
              .map((arg) => arg.toString())

            if (command && encodedMessage) {
              const xmlMessage = atob(encodedMessage)

              xml2json(xmlMessage, (error, data) => {
                error
                  ? messageTerminal({ ...DEFAULT_ERROR_CONFIG, error })
                  : server.emit(type, { command, data })
              })
            }
          })
        }
      })
  } catch (error) {
    messageTerminal({ ...DEFAULT_ERROR_CONFIG, error })
  }
}

module.exports = main
