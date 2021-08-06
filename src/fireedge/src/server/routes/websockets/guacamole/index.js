/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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

const GuacamoleOpennebula = require('opennebula-guacamole')
const { getConfig } = require('server/utils/yml')
const { messageTerminal } = require('server/utils/general')
const { genFireedgeKey } = require('server/utils/server')
const { writeInLogger } = require('server/utils/logger')
const { endpointGuacamole } = require('server/utils/constants/defaults')

// set fireedge_key
genFireedgeKey()

const formatError = 'Error: %s'
/**
 * Object http error.
 *
 * @param {object} error - error message
 * @returns {object} error for terminalMessage function
 */
const configError = (error) => ({
  color: 'red',
  message: formatError,
  error: error && error.message
})

// guacamole client options
const clientOptions = {
  crypt: {
    cypher: 'AES-256-CBC',
    key: (global && global.path && global.paths.FIREEDGE_KEY) || ''
  },
  allowedUnencryptedConnectionSettings: {
    rdp: ['width', 'height', 'dpi'],
    vnc: ['width', 'height', 'dpi'],
    ssh: ['color-scheme', 'font-name', 'font-size', 'width', 'height', 'dpi'],
    telnet: ['color-scheme', 'font-name', 'font-size', 'width', 'height', 'dpi']
  },
  log: {
    level: 'ERRORS'
  }
}

const clientCallbacks = {
  processConnectionSettings: (settings, callback) => {
    if (settings.expiration && settings.expiration < Date.now()) {
      return callback(new Error('Token expired'))
    }
    return callback(null, settings)
  }
}

const appConfig = getConfig()
const guacd = appConfig.guacd || {}
const guacdPort = guacd.port || 4822
const guacdHost = guacd.host || 'localhost'

/**
 * Add guacamole server to node app.
 *
 * @param {object} appServer - express app
 */
const guacamole = appServer => {
  if (
    appServer &&
    appServer.constructor &&
    appServer.constructor.name &&
    appServer.constructor.name === 'Server'
  ) {
    const guacamoleServer = new GuacamoleOpennebula(
      { server: appServer, path: endpointGuacamole },
      { host: guacdHost, port: guacdPort },
      clientOptions,
      clientCallbacks
    )
    guacamoleServer.on('error', (clientConnection, error) => {
      writeInLogger(error, formatError)
      messageTerminal(configError(error))
    })
  }
}

module.exports = {
  endpointGuacamole,
  guacamole
}
