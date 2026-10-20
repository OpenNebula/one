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

const { readFile } = require('fs').promises
const net = require('net')
const { global } = require('window-or-global')
const yaml = require('yaml')

const DEFAULT_LDAP_PORT = 389
const DEFAULT_LDAP_TIMEOUT = 3000
const MAX_LDAP_TIMEOUT = 5000

const flattenServerNames = (servers) => {
  if (Array.isArray(servers)) return servers.flatMap(flattenServerNames)

  if (servers && typeof servers === 'object') {
    const groups = Object.values(servers)

    return groups.length === 1 ? flattenServerNames(groups[0]) : []
  }

  return typeof servers === 'string' && servers.length ? [servers] : []
}

const getMatchedServerNames = (config, user) => {
  const matches = config?.[':match_user_regex']

  if (!matches || typeof matches !== 'object' || Array.isArray(matches)) {
    return []
  }

  for (const [pattern, servers] of Object.entries(matches)) {
    try {
      if (new RegExp(pattern, 'i').test(user)) {
        return flattenServerNames(servers)
      }
    } catch {}
  }

  return []
}

/**
 * Get the LDAP endpoints which the authentication driver may query.
 *
 * @param {string} source - ldap_auth.conf contents
 * @param {string} user - User being authenticated
 * @returns {Array<{host: string, port: number, timeout: number}>} endpoints
 */
const parseLdapEndpoints = (source = '', user = '') => {
  const config = yaml.parse(source) ?? {}
  if (config[':order'] && config[':match_user_regex']) return []
  if (config[':order'] && !Array.isArray(config[':order'])) return []

  const matchedServers = getMatchedServerNames(config, user)
  const orderedServers = flattenServerNames(config[':order'])
  const serverNames = config[':match_user_regex']
    ? matchedServers
    : orderedServers

  return [...new Set(serverNames)]
    .map((name) => config[name])
    .filter((server) => server && typeof server === 'object')
    .map((server) => {
      const configuredTimeout = Number(server[':timeout']) * 1000

      return {
        host: String(server[':host'] || 'localhost'),
        port: Number(server[':port']) || DEFAULT_LDAP_PORT,
        timeout:
          Number.isFinite(configuredTimeout) && configuredTimeout > 0
            ? Math.min(configuredTimeout, MAX_LDAP_TIMEOUT)
            : DEFAULT_LDAP_TIMEOUT,
      }
    })
}

const canConnect = ({ host, port, timeout }) =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host, port })
    let settled = false

    const finish = (reachable) => {
      if (settled) return

      settled = true
      socket.destroy()
      resolve(reachable)
    }

    socket.setTimeout(timeout)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
  })

/**
 * Check whether every LDAP endpoint selected for a user is unreachable.
 * Configuration and parsing errors are ignored so they do not mask the
 * original authentication failure.
 *
 * @param {string} user - User being authenticated
 * @returns {Promise<Array<{host: string, port: number}>>} unreachable endpoints
 */
const getUnavailableLdapEndpoints = async (user) => {
  try {
    const configPath = global?.paths?.LDAP_AUTH_CONFIG
    if (!configPath) return []

    const endpoints = parseLdapEndpoints(
      await readFile(configPath, 'utf8'),
      user
    )
    if (!endpoints.length) return []

    const results = await Promise.all(endpoints.map(canConnect))

    return results.some(Boolean) ? [] : endpoints
  } catch {
    return []
  }
}

module.exports = {
  getUnavailableLdapEndpoints,
  parseLdapEndpoints,
}
