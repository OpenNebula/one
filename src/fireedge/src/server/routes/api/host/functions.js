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

const { defaults, httpCodes } = require('server/utils/constants')
const { httpResponse } = require('server/utils/server')
const { defaultEmptyFunction, httpMethod } = defaults
const { GET } = httpMethod
const { getServerAdmin } = require('server/routes/api/auth/utils')
const {
  getDefaultParamsOfOpennebulaCommand,
} = require('server/utils/opennebula')
const { Actions: hostActions } = require('server/utils/constants/commands/host')

const { HOST_POOL_INFO } = hostActions
const { ok, badRequest, unauthorized } = httpCodes

/**
 * Show cluster with server admin credentials.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} params - data response http
 * @param {object} userData - user of http request
 * @param {Function} oneConnection - XML-RPC function
 */
const show = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const serverAdmin = getServerAdmin()
  const { token: authToken } = serverAdmin

  if (!authToken) {
    res.locals.httpCode = httpResponse(badRequest, '')
    next()

    return
  }

  const { username } = serverAdmin
  const oneConnect = oneConnection(`${username}:${username}`, authToken?.token)

  // get HOSTS information
  oneConnect({
    action: HOST_POOL_INFO,
    parameters: getDefaultParamsOfOpennebulaCommand(HOST_POOL_INFO, GET),
    callback: (err, value = {}) => {
      const { HOST_POOL = [] } = value
      if (err) {
        res.locals.httpCode = httpResponse(unauthorized, err)
        next()

        return
      }

      res.locals.httpCode = httpResponse(ok, { HOST_POOL })
      next()
    },
  })
}

const functionRoutes = {
  show,
}
module.exports = functionRoutes
