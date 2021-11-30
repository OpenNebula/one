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
} = require('./functions')

const {
  internalServerError,
  unauthorized,
} = require('server/utils/constants/http-codes')
const { Actions } = require('server/utils/constants/commands/user')
const {
  httpMethod,
  defaultEmptyFunction,
} = require('server/utils/constants/defaults')

const { GET } = httpMethod

const {
  getDefaultParamsOfOpennebulaCommand,
} = require('server/utils/opennebula')

const { writeInLogger } = require('server/utils/logger')

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
    error()
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
const auth = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const { user, token, type, token2fa, remember } = params
  setRes(res)
  setNext(next)
  setNodeConnect(oneConnection)
  updaterResponse(new Map(internalServerError).toObject())
  if (user && token) {
    const oneConnect = connectOpennebula(user, token)

    /**
     * Run if have information.
     *
     * @param {object} oneValue - opennebula value
     */
    const success = (oneValue) => {
      setUser(user || '')
      setPass(token || '')
      setType(type || '')
      setTfaToken(token2fa || '')
      setRemember(remember || false)
      login(oneValue)
    }

    /**
     * Run if no have information.
     */
    const error = () => {
      updaterResponse(new Map(unauthorized).toObject())
      writeInLogger(unauthorized)
      next()
    }

    oneConnect(
      Actions.USER_INFO,
      getDefaultParamsOfOpennebulaCommand(Actions.USER_INFO, GET),
      (err, value) => {
        loginUser(err, value, success, error)
      },
      false
    )
  } else {
    next()
  }
}

const authApi = {
  auth,
}
module.exports = authApi
