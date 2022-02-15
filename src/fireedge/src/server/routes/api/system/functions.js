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
const { defaults, httpCodes } = require('server/utils/constants')
const { httpResponse, getSunstoneAuth } = require('server/utils/server')
const {
  getDefaultParamsOfOpennebulaCommand,
} = require('server/utils/opennebula')
const {
  Actions: ActionSystem,
} = require('server/utils/constants/commands/system')
const { createTokenServerAdmin } = require('server/routes/api/auth/utils')

const { defaultEmptyFunction, httpMethod } = defaults
const { ok, internalServerError, badRequest } = httpCodes
const { GET } = httpMethod

const ALLOWED_KEYS_ONED_CONF = [
  'DEFAULT_COST',
  'DS_MAD_CONF',
  'MARKET_MAD_CONF',
  'VM_MAD',
  'VN_MAD_CONF',
  'IM_MAD',
  'AUTH_MAD',
]

/**
 * Get system config.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 * @param {function(string, string): Function} oneConnection - One Connection
 */
const getConfig = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const rtn = httpResponse(badRequest, '', '')

  const { username, key, iv } = getSunstoneAuth()
  if (!(username && key && iv)) {
    res.locals.httpCode = rtn
    next()

    return
  }

  const tokenWithServerAdmin = createTokenServerAdmin({
    serverAdmin: username,
    username,
    key,
    iv,
  })
  if (!tokenWithServerAdmin.token) {
    res.locals.httpCode = rtn
    next()

    return
  }

  const connect = oneConnection(
    `${username}:${username}`,
    tokenWithServerAdmin.token
  )
  connect(
    ActionSystem.SYSTEM_CONFIG,
    getDefaultParamsOfOpennebulaCommand(ActionSystem.SYSTEM_CONFIG, GET),
    (err, value) => {
      if (err) {
        res.locals.httpCode = httpResponse(internalServerError, '', '')

        return
      }

      const filterData = {}
      Object.entries(value.OPENNEBULA_CONFIGURATION).forEach(
        ([keyOned, valueOned]) => {
          if (ALLOWED_KEYS_ONED_CONF.includes(keyOned)) {
            filterData[keyOned] = valueOned
          }
        }
      )
      res.locals.httpCode = httpResponse(ok, filterData)
      next()
    }
  )
}

module.exports = {
  getConfig,
}
