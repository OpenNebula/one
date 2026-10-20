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

const GuacamoleOpennebula = require('opennebula-guacamole')
const { createDecipheriv } = require('crypto')
const { URL } = require('url')
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
const allowedConnectionTypes = new Set(['vnc', 'ssh', 'rdp', 'telnet'])
const maxTokenLength = 64 * 1024
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

/**
 * Validate a Guacamole token before opennebula-guacamole creates its client.
 *
 * The dependency assumes the token and its connection record are valid while
 * handling early failures. Rejecting malformed handshakes here prevents those
 * failures from escaping its WebSocket connection handler and terminating
 * FireEdge.
 *
 * @param {object} info - WebSocket client information.
 * @param {object} info.req - HTTP upgrade request.
 * @returns {boolean} - True when the token can be safely processed.
 */
const verifyGuacamoleClient = ({ req } = {}) => {
  try {
    const token = new URL(req?.url ?? '', 'http://localhost').searchParams.get(
      'token'
    )

    if (typeof token !== 'string' || token.length > maxTokenLength) return false

    const envelope = JSON.parse(Buffer.from(token, 'base64').toString('ascii'))
    if (
      typeof envelope?.iv !== 'string' ||
      typeof envelope?.value !== 'string'
    ) {
      return false
    }

    const iv = Buffer.from(envelope.iv, 'base64')
    const encrypted = Buffer.from(envelope.value, 'base64')
    if (iv.length !== 16 || !encrypted.length || encrypted.length % 16 !== 0) {
      return false
    }

    const decipher = createDecipheriv(
      clientOptions.crypt.cypher,
      clientOptions.crypt.key,
      iv
    )
    let decrypted = decipher.update(encrypted, undefined, 'ascii')
    decrypted += decipher.final('ascii')

    const settings = JSON.parse(decrypted)
    const connectionType = settings?.connection?.type
    const connectionSettings = settings?.connection?.settings

    if (!allowedConnectionTypes.has(connectionType)) return false
    if (
      !connectionSettings ||
      typeof connectionSettings !== 'object' ||
      Array.isArray(connectionSettings)
    ) {
      return false
    }

    if (settings.expiration !== undefined) {
      const expiration = Number(settings.expiration)
      if (!Number.isFinite(expiration) || expiration < Date.now()) return false
    }

    return true
  } catch {
    return false
  }
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

    let rangePorts = [5900, 65535]
    if (settings?.connection?.rangeports) {
      rangePorts = settings?.connection?.rangeports.split(':').map(Number)

      try {
        const pidTunnel = await create({
          vmPort: settings?.connection?.port,
          hostAddr: settings?.connection?.hostname,
          targetAddr: settings?.tunnel?.host,
          settings,
          rangePorts,
        })
        const dataConnection = connections?.get?.(id)

        if (!dataConnection) {
          deleteTunnel(pidTunnel)

          return callback(new Error('Guacamole connection was closed'))
        }

        dataConnection.pidTunnel = pidTunnel
        writeInLogger([pidTunnel, id], {
          format: 'Tunnel SSH created with PID: %1$s to connection: %2$s ',
          level: 2,
        })
      } catch (err) {
        writeInLogger(err, {
          format: formatError,
        })

        return callback(err)
      }
    }

    return callback(null, settings)
  },

  processConnectionClose: (err, { id }) => {
    if (id) {
      writeInLogger(id, {
        format: 'Closing unused ssh connection: %s',
        level: 2,
      })

      deleteTunnel(id)
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
      {
        server: appServer,
        path: endpointGuacamole,
        verifyClient: verifyGuacamoleClient,
      },
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
