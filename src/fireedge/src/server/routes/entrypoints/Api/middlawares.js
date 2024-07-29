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
const { env } = require('process')
const { DateTime } = require('luxon')
const { httpCodes, defaults } = require('server/utils/constants')
const { getFireedgeConfig } = require('server/utils/yml')
const {
  defaultWebpackMode,
  defaultEmptyFunction,
  defaultOpennebulaZones,
  defaultSessionExpiration,
} = defaults
const { validateAuth } = require('server/utils/jwt')
const { getDataZone } = require('server/utils/server')
const { writeInLogger } = require('server/utils/logger')

let idUserOpennebula = ''
let userOpennebula = ''
let passOpennebula = ''

/**
 * Validate user in global state.
 *
 * @param {string} user - username
 * @param {string} token - token of user
 * @returns {boolean} user valid data
 */
const userValidation = (user = '', token = '') => {
  const nowUnix = DateTime.local().toSeconds()
  if (
    user &&
    token &&
    Array.isArray(global?.users?.[user]?.tokens) &&
    global?.users?.[user]?.tokens?.some?.(
      ({ token: internalToken, time }) =>
        time > nowUnix && internalToken === token
    )
  ) {
    return true
  }

  return false
}

/**
 * Get id opennebula user.
 *
 * @returns {number} id opennebula user
 */
const getIdUserOpennebula = () => idUserOpennebula

/**
 * Get user opennebula.
 *
 * @returns {string} opennebula username
 */
const getUserOpennebula = () => userOpennebula

/**
 * Get pass opennebula.
 *
 * @returns {string} opennebula user password
 */
const getPassOpennebula = () => passOpennebula

/**
 * MIDDLEWARE validate resource and session.
 *
 * @param {object} config - http request
 * @param {object} config.req - http request
 * @param {object} config.res - http response
 * @param {function():any} config.next - express stepper
 * @param {boolean} config.auth - check if the route need authentication
 */
const validateSession = ({
  req = {},
  res = {},
  next = defaultEmptyFunction,
  auth = true,
}) => {
  const { badRequest, unauthorized } = httpCodes
  let status = badRequest
  if (auth) {
    const session = validateAuth(req)
    status = unauthorized

    if (session) {
      const { iss, aud, jti } = session
      idUserOpennebula = iss
      userOpennebula = aud
      passOpennebula = jti
      const now = DateTime.local()
      if (env?.NODE_ENV === defaultWebpackMode) {
        const appConfig = getFireedgeConfig()
        const expirationSession =
          appConfig.session_expiration || defaultSessionExpiration

        /** Create global state for user when the enviroment is development */
        if (global && !global.users) {
          global.users = {}
        }
        if (!global.users[userOpennebula]) {
          global.users[userOpennebula] = {
            tokens: [
              {
                token: passOpennebula,
                time: now.plus({ minutes: expirationSession }).toSeconds(),
              },
            ],
          }
        }
      }
      if (userValidation(userOpennebula, passOpennebula)) {
        next()

        return
      } else {
        const logData = JSON.stringify({
          header: req?.headers?.authorization,
          now: now.toSeconds(),
          users: global.users,
        })
        writeInLogger(logData, {
          format: 'Error Login: %s',
          level: 2,
        })
      }
    }
  } else {
    next()

    return
  }
  res.status(status.id).json(status)
}
/**
 * Get Zone.
 *
 * @param {string} selectedZone - zone id
 * @returns {object} data zone
 */
const getZone = (selectedZone) => {
  // get fireedge config
  const appConfig = getFireedgeConfig()
  const zone = selectedZone || appConfig?.default_zone?.id || '0'
  // set first zone
  if (
    appConfig.one_xmlrpc &&
    Array.isArray(defaultOpennebulaZones) &&
    defaultOpennebulaZones[0]?.rpc
  ) {
    if (
      appConfig.default_zone?.id &&
      appConfig.default_zone?.name &&
      appConfig.default_zone?.endpoint
    ) {
      defaultOpennebulaZones[0] = appConfig.default_zone
    }
    defaultOpennebulaZones[0].rpc = appConfig.one_xmlrpc
    if (appConfig.subscriber_endpoint) {
      defaultOpennebulaZones[0].zeromq = appConfig.subscriber_endpoint
    }
  }

  return getDataZone(zone, defaultOpennebulaZones)
}

module.exports = {
  getIdUserOpennebula,
  getUserOpennebula,
  getPassOpennebula,
  getZone,
  validateSession,
}
