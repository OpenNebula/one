/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
const { httpCodes, defaults } = require('server/utils/constants')
const { getFireedgeConfig } = require('server/utils/yml')
const { defaultWebpackMode, defaultEmptyFunction, defaultOpennebulaZones } =
  defaults
const { validateAuth } = require('server/utils/jwt')
const { getDataZone } = require('server/utils/server')

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
  let rtn = false
  if (
    user &&
    token &&
    global &&
    global.users &&
    global.users[user] &&
    global.users[user].tokens &&
    Array.isArray(global.users[user].tokens) &&
    global.users[user].tokens.some((x) => x && x.token === token)
  ) {
    rtn = true
  }

  return rtn
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
    if (session) {
      const { iss, aud, jti, exp } = session
      idUserOpennebula = iss
      userOpennebula = aud
      passOpennebula = jti
      if (env && (!env.NODE_ENV || env.NODE_ENV !== defaultWebpackMode)) {
        /** Validate User in production */
        if (userValidation(userOpennebula, passOpennebula)) {
          next()

          return
        } else {
          status = unauthorized
        }
      } else {
        /** Validate user in development mode */
        if (global && !global.users) {
          global.users = {}
        }
        if (!global.users[userOpennebula]) {
          global.users[userOpennebula] = {
            tokens: [{ token: passOpennebula, time: exp }],
          }
        }
        if (userValidation(userOpennebula, passOpennebula)) {
          next()

          return
        } else {
          status = unauthorized
        }
      }
    } else {
      status = unauthorized
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
 * @param {string} zone - zone id
 * @returns {object} data zone
 */
const getZone = (zone = '0') => {
  // get fireedge config
  const appConfig = getFireedgeConfig()
  // set first zone
  if (
    appConfig.one_xmlrpc &&
    Array.isArray(defaultOpennebulaZones) &&
    defaultOpennebulaZones[0] &&
    defaultOpennebulaZones[0].rpc
  ) {
    defaultOpennebulaZones[0].rpc = appConfig.one_xmlrpc
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
