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

const {
  defaultEmptyFunction,
  defaultMessageInvalidZone,
  from: fromData,
} = require('server/utils/constants/defaults')
const {
  validateSession,
  getIdUserOpennebula,
  getUserOpennebula,
  getPassOpennebula,
  getZone,
} = require('server/routes/entrypoints/Api/middlawares')
const { httpResponse, validateHttpMethod } = require('server/utils/server')
const { opennebulaConnect } = require('server/utils/opennebula')
const { httpCodes } = require('server/utils/constants')
const routes = require('server/routes/api')
const { writeInLoggerInvalidRPC } = require('server/utils/logger')

const { resource, query, postBody } = fromData
const { internalServerError } = httpCodes

/**
 * Get routes functions.
 *
 * @param {object} config - config router
 * @param {object} config.expressRouter - express router
 * @param {function(object):object} config.jsonResponser - parse to json
 */
const functionsRoutes = ({
  expressRouter = {},
  jsonResponser = defaultEmptyFunction,
}) => {
  routes.forEach((route) => {
    const { path, httpMethod, action, auth } = route
    if (path && httpMethod) {
      const validHttpMethod = validateHttpMethod(httpMethod)
      if (
        validHttpMethod &&
        typeof action === 'function' &&
        typeof expressRouter[validHttpMethod] === 'function'
      ) {
        expressRouter[validHttpMethod](
          path,
          (req, res, next) => validateSession({ req, res, next, auth }),
          (req, res, next) => {
            res.locals.httpCode = httpResponse(internalServerError)
            const { zone } = req.query
            const zoneData = getZone(zone)
            if (zoneData) {
              const user = getUserOpennebula()
              const password = getPassOpennebula()
              const userId = getIdUserOpennebula()
              const { rpc } = zoneData
              writeInLoggerInvalidRPC(rpc)
              req.serverDataSource = {
                [resource]: req.params,
                [query]: req.query,
                [postBody]: req.body,
              }

              action(
                req,
                res,
                next,
                (ONEuser, ONEpass) => opennebulaConnect(ONEuser, ONEpass, rpc),
                {
                  id: userId,
                  user,
                  password,
                }
              )
            } else {
              res.locals.httpCode = httpResponse(
                internalServerError,
                '',
                `${internalServerError.message}: ${defaultMessageInvalidZone}`
              )
              next()
            }
          },
          jsonResponser
        )
      }
    }
  })
}

module.exports = functionsRoutes
