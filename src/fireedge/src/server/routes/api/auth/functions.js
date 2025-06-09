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

const { Map } = require('immutable')
const {
  login,
  setUser,
  setPass,
  setType,
  setTfaToken,
  setRemember,
  setNext,
  setRes,
  setNodeConnect,
  connectOpennebula,
  updaterResponse,
  remoteLogin,
  x509Login,
} = require('server/routes/api/auth/utils')

const { defaults, httpCodes } = require('server/utils/constants')
const { Actions } = require('server/utils/constants/commands/user')
const { getFireedgeConfig } = require('server/utils/yml')
const {
  getDefaultParamsOfOpennebulaCommand,
} = require('server/utils/opennebula')

const { writeInLogger } = require('server/utils/logger')

const { internalServerError, unauthorized } = httpCodes

const { httpMethod, defaultEmptyFunction } = defaults

const { GET } = httpMethod

/**
 * Login user.
 *
 * @param {error} err - run if no have user data
 * @param {string} value - opennebula information
 * @param {Function} success - success
 * @param {Function} error - error
 */
const loginUser = (
  err = '',
  value = '',
  success = defaultEmptyFunction,
  error = defaultEmptyFunction
) => {
  if (value && value.USER && !err) {
    success(value)
  } else {
    error(err)
  }
}

/**
 * Fireedge user auth.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 * @param {Function} oneConnection - function of xmlrpc
 */
const coreAuth = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const { user, token, type, token2fa, remember } = params
  setNext(next)
  setNodeConnect(oneConnection)
  updaterResponse(new Map(internalServerError).toObject())
  if (user && token) {
    const oneConnect = connectOpennebula(user, token)

    /**
     * Run if have user data.
     *
     * @param {object} opennebulaUserData - opennebula user data
     */
    const success = (opennebulaUserData) => {
      setRes(res)
      setUser(user || '')
      setPass(token || '')
      setType(type || '')
      setTfaToken(token2fa || '')
      setRemember(remember || false)
      login(opennebulaUserData)
    }

    /**
     * Catch error login.
     *
     * @param {string} err - error.
     */
    const error = (err) => {
      setRes(res)
      const httpCodeError = err ? internalServerError : unauthorized
      updaterResponse(new Map(httpCodeError).toObject())

      const errorLogMessage = err
        ? [[err], { format: 'Login user: %s' }]
        : [httpCodeError?.message]

      writeInLogger(...errorLogMessage)
      next()
    }

    oneConnect({
      action: Actions.USER_INFO,
      parameters: getDefaultParamsOfOpennebulaCommand(Actions.USER_INFO, GET),
      callback: (err, value) => {
        loginUser(err, value, success, error)
      },
      fillHookResource: false,
    })
  } else {
    next()
  }
}

/**
 * Fireedge user remote auth.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} _ - user of http request
 * @param {Function} oneConnection - function of xmlrpc
 * @param {string} typeAuth - auth type
 */
const remoteAuth = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  _,
  oneConnection = defaultEmptyFunction,
  typeAuth
) => {
  const { user } = params
  setNext(next)
  setNodeConnect(oneConnection)
  updaterResponse(new Map(internalServerError).toObject())
  if (user) {
    switch (typeAuth) {
      case 'x509':
        x509Login(user, res)
        break
      default:
        remoteLogin(user, res)
        break
    }
  } else {
    next()
  }
}

/**
 * Fireedge select type auth.
 * (This is because the authentication methods have to be extended after that).
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 * @param {Function} oneConnection - function of xmlrpc
 * @returns {Function} - auth function
 */
const selectTypeAuth = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const appConfig = getFireedgeConfig()
  const typeAuth = {
    remote: () => remoteAuth(res, next, params, userData, oneConnection),
    x509: () => remoteAuth(res, next, params, userData, oneConnection, 'x509'),
    opennebula: () => coreAuth(res, next, params, userData, oneConnection),
  }
  const auth = typeAuth[appConfig?.auth] || typeAuth.opennebula

  return auth()
}

module.exports = {
  selectTypeAuth,
}
