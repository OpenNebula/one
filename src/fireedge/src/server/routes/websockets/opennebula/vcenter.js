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

const {
  middlewareValidateAuthWebsocket,
  subscriber,
} = require('server/utils/server')
const { messageTerminal } = require('server/utils/general')
const { defaults } = require('server/utils/constants')

const { defaultCommandVcenter } = defaults

/**
 * Object http error.
 *
 * @param {object} error - error message
 * @returns {object} param of terminalMessage function
 */
const configErrorProvision = (error = '') => ({
  color: 'red',
  error,
  message: '%s',
})

/**
 * Route of websocket Provisions.
 *
 * @param {object} app - express app
 * @param {string} type - type WS
 */
const main = (app = {}, type = '') => {
  try {
    app.use(middlewareValidateAuthWebsocket).on('connection', (server = {}) => {
      server.on('disconnect', () => {
        messageTerminal(configErrorProvision('disconnect'))
      })
      subscriber(defaultCommandVcenter, (data) => {
        app.emit(type, data)
      })
    })
  } catch (error) {
    messageTerminal(configErrorProvision(error))
  }
}

module.exports = main
