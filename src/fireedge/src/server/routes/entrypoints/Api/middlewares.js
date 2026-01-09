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
const { DateTime } = require('luxon')
const { httpCodes, defaults } = require('server/utils/constants')
const { ensureSessionStore } = require('server/utils/sessions')
const { getFireedgeConfig } = require('server/utils/yml')
const { defaultEmptyFunction, defaultOpennebulaZones } = defaults
const { validateAuth } = require('server/utils/jwt')
const { httpResponse, getDataZone } = require('server/utils/server')

/**
 * Validate user in global state.
 *
 * @param {string} user - username
 * @param {string} token - token of user
 * @returns {boolean} user valid data
 */
const validateUser = (user = '', token = '') => {
  ensureSessionStore()
  const now = DateTime.local().toSeconds()
  const tokens = global.sessionStore?.[user]?.tokens

  return (
    user &&
    token &&
    Array.isArray(tokens) &&
    tokens.some(
      ({ token: internalToken, expires }) =>
        expires > now && internalToken === token
    )
  )
}

/**
 * MIDDLEWARE validate resource and session.
 *
 * @param {object} config - http request
 * @param {object} config.req - http request
 * @param {object} config.res - http response
 * @param {function():any} config.next - express stepper
 * @param {boolean} config.auth - check if the route need authentication
 * @returns {object} - Response
 */
const validateSession = ({
  req = {},
  res = {},
  next = defaultEmptyFunction,
  auth = true,
}) => {
  if (!auth) {
    next()

    return
  }

  const session = validateAuth(req)
  if (!session) {
    return res
      .status(httpCodes.unauthorized.id)
      .json(httpResponse(httpCodes.unauthorized))
  }

  const { iss, aud, jti } = session

  const id = iss
  const user = aud
  const password = jti

  req.auth = {
    id,
    user,
    password,
  }

  if (!validateUser(user, password)) {
    return res.status(httpCodes.unauthorized.id).json({ data: 'expired' })
  }

  next()
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
  getZone,
  validateSession,
}
