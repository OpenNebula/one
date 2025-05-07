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

const GuacamoleOpennebula = require('opennebula-guacamole')
const { getFireedgeConfig } = require('server/utils/yml')
const { messageTerminal } = require('server/utils/general')
const { genFireedgeKey, genPathResources } = require('server/utils/server')
const { writeInLogger } = require('server/utils/logger')
const { endpointGuacamole } = require('server/utils/constants/defaults')
const { create, deleteTunnel } = require('server/utils/sshTunnel')

// set paths
genPathResources()

// set fireedge_key
genFireedgeKey()

const formatError = 'Error: %s'
/**
 * Object console error log.
 *
 * @param {object} error - error message
 * @returns {object} error for terminalMessage function
 */
const configError = (error) => ({
  color: 'red',
  message: formatError,
  error: error?.message,
})

// guacamole client options
const clientOptions = {
  crypt: {
    cypher: 'AES-256-CBC',
    key: global?.paths?.FIREEDGE_KEY || '',
  },
  allowedUnencryptedConnectionSettings: {
    rdp: ['width', 'height', 'dpi', 'rangeports'],
    vnc: ['width', 'height', 'dpi', 'rangeports'],
    ssh: [
      'color-scheme',
      'font-name',
      'font-size',
      'width',
      'height',
      'dpi',
      'rangeports',
    ],
    telnet: [
      'color-scheme',
      'font-name',
      'font-size',
      'width',
      'height',
      'dpi',
      'rangeports',
    ],
  },
  log: {
    level: 'ERRORS',
  },
}

const clientCallbacks = {
  processConnectionSettings: async (
    settings,
    callback,
    { connections, id }
  ) => {
    if (settings?.expiration < Date.now()) {
      return callback(new Error('Token expired'))
    }

    let rangePorts = [5900, 65536]
    if (settings?.connection?.rangeports) {
      rangePorts = settings?.connection?.rangeports.split(':').map(Number)

      await create(
        {
          vmPort: settings?.connection?.port,
          hostAddr: settings?.connection?.hostname,
          settings,
          rangePorts,
        },
        {
          connect: (pidTunnel) => {
            if (connections && id) {
              const dataConnection = connections?.get?.(id)
              dataConnection
                ? (dataConnection.pidTunnel = pidTunnel)
                : connections.set(id, { pidTunnel })

              writeInLogger([pidTunnel, id], {
                format:
                  'Tunnel SSH created with PID: %1$s to connection: %2$s ',
                level: 2,
              })
            }
          },
          error: (err) => {
            writeInLogger(err, {
              format: formatError,
            })
          },
        }
      )
    }

    return callback(null, settings)
  },

  processConnectionClose: (err, { connections, id }) => {
    if (id) {
      writeInLogger(id, {
        format: 'Closing unused ssh connection: %s',
        level: 2,
      })

      if (connections?.length) {
        const others = [...connections.values()].some(
          (value) => value.pidTunnel === id
        )
        !others && deleteTunnel(id)
      } else {
        deleteTunnel(id)
      }
    }

    writeInLogger(err, {
      format: 'WS connection closed: %s',
    })
    messageTerminal(configError(err))
  },
}

const appConfig = getFireedgeConfig()
const guacd = appConfig.guacd || {}
const guacdPort = guacd.port || 4822
const guacdHost = guacd.host || 'localhost'

/**
 * Add guacamole server to node app.
 *
 * @param {object} appServer - express app
 */
const guacamole = (appServer) => {
  if (appServer?.constructor?.name === 'Server') {
    const guacamoleServer = new GuacamoleOpennebula(
      { server: appServer, path: endpointGuacamole },
      { host: guacdHost, port: guacdPort },
      clientOptions,
      clientCallbacks
    )
    guacamoleServer.on('error', (_, error) => {
      writeInLogger(error, {
        format: formatError,
      })
      messageTerminal(configError(error))
    })
  }
}

module.exports = guacamole
