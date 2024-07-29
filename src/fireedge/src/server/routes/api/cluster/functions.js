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
const { httpResponse, getSunstoneAuth } = require('server/utils/server')
const { createTokenServerAdmin } = require('server/routes/api/auth/utils')
const {
  Actions: clusterActions,
} = require('server/utils/constants/commands/cluster')

const { defaultEmptyFunction } = defaults
const { CLUSTER_INFO } = clusterActions
const { ok, badRequest, unauthorized } = httpCodes

/**
 * Show cluster with server admin credentials.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} params - data response http
 * @param {object} userData - user of http request
 * @param {Function} xmlrpc - XML-RPC function
 */
const show = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  xmlrpc = defaultEmptyFunction
) => {
  const { id: clusterId } = params

  const serverAdmin = getSunstoneAuth() ?? {}
  const { token: authToken } = createTokenServerAdmin(serverAdmin) ?? {}

  if (!authToken) {
    res.locals.httpCode = httpResponse(badRequest, '')
    next()

    return
  }

  const { username } = serverAdmin
  const oneClientServerAdmin = xmlrpc(`${username}:${username}`, authToken)

  // get CLUSTER information by id
  oneClientServerAdmin({
    action: CLUSTER_INFO,
    parameters: [parseInt(clusterId, 10), true],
    callback: (clusterInfoErr, data = {}) => {
      const { CLUSTER } = data
      if (clusterInfoErr || !CLUSTER) {
        res.locals.httpCode = httpResponse(unauthorized, clusterInfoErr)
        next()

        return
      }

      res.locals.httpCode = httpResponse(ok, CLUSTER)
      next()
    },
  })
}

const functionRoutes = {
  show,
}
module.exports = functionRoutes
