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

const socketIO = require('socket.io')
const { messageTerminal, checkEmptyObject } = require('server/utils/general')
const {
  defaultFilesWebsockets,
  defaultConfigErrorMessage,
} = require('server/utils/constants/defaults')

/**
 * Add websockets to express app.
 *
 * @param {object} appServer - express app
 * @returns {Array} sockets
 */
const websockets = (appServer = {}) => {
  const sockets = []
  if (
    appServer &&
    appServer.constructor &&
    appServer.constructor.name &&
    appServer.constructor.name === 'Server'
  ) {
    Object.entries(defaultFilesWebsockets).forEach(
      ([filename = '', info = {}]) => {
        if (filename && info && !checkEmptyObject(info)) {
          const path = info && info.path
          const methods = info && info.methods
          if (path && methods) {
            const io = socketIO({
              path,
              cors: {
                origin: '*',
                methods,
                credentials: true,
              },
            }).listen(appServer)
            try {
              // eslint-disable-next-line global-require
              const file = require(`./${filename}`)
              if (typeof file === 'function') {
                sockets.push(io)
                file(io, filename)
              }
            } catch (error) {
              if (error instanceof Error) {
                const config = defaultConfigErrorMessage
                config.error = error.message
                messageTerminal(config)
              }
            }
          }
        }
      }
    )
  }

  return sockets
}

module.exports = websockets
