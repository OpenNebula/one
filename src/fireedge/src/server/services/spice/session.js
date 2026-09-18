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

const { randomBytes } = require('crypto')

const TOKEN_TTL_MS = 60 * 1000
const sessions = new Map()

const removeExpiredSession = (token) => {
  const session = sessions.get(token)

  if (session && session.expiresAt <= Date.now()) sessions.delete(token)
}

/**
 * Creates a short-lived capability for the SPICE websocket proxy.
 *
 * @param {object} connection - Trusted VM connection data
 * @param {string} connection.host - KVM host
 * @param {number} connection.port - SPICE port
 * @param {string|number} connection.vmId - VM id, used only for logging
 * @returns {{token: string, expiresIn: number}} Public session data
 */
const createSpiceSession = ({ host, port, vmId }) => {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = Date.now() + TOKEN_TTL_MS

  sessions.set(token, { host, port, vmId, expiresAt })

  const cleanup = setTimeout(() => removeExpiredSession(token), TOKEN_TTL_MS)
  cleanup.unref?.()

  return { token, expiresIn: TOKEN_TTL_MS / 1000 }
}

/**
 * Resolves a websocket token to trusted connection data.
 * A token may be used more than once because spice-html5 opens one websocket
 * for every negotiated SPICE channel.
 *
 * @param {string} token - Session token
 * @returns {object|undefined} Trusted connection data
 */
const getSpiceSession = (token) => {
  const session = sessions.get(token)

  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token)

    return undefined
  }

  return session
}

/**
 * Clears all pending SPICE session capabilities.
 *
 * @returns {undefined} No return value
 */
const clearSpiceSessions = () => sessions.clear()

module.exports = {
  createSpiceSession,
  getSpiceSession,
  clearSpiceSessions,
}
