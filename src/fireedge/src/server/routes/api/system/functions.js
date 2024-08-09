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
const {
  getDefaultParamsOfOpennebulaCommand,
} = require('server/utils/opennebula')
const {
  Actions: ActionSystem,
} = require('server/utils/constants/commands/system')
const { createTokenServerAdmin } = require('server/routes/api/auth/utils')
const { getVmmConfig } = require('server/utils/vmm')

const { defaultEmptyFunction, httpMethod } = defaults
const { ok, internalServerError, badRequest, notFound } = httpCodes
const { GET } = httpMethod
const { writeInLogger } = require('server/utils/logger')

const ALLOWED_KEYS_ONED_CONF = [
  'DEFAULT_COST',
  'DS_MAD_CONF',
  'MARKET_MAD_CONF',
  'VM_MAD',
  'VN_MAD_CONF',
  'IM_MAD',
  'AUTH_MAD',
  'FEDERATION',
  'VM_RESTRICTED_ATTR',
  'IMAGE_RESTRICTED_ATTR',
  'VNET_RESTRICTED_ATTR',
  'QUOTA_VM_ATTRIBUTE',
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

  const oneConnect = oneConnection(
    `${username}:${username}`,
    tokenWithServerAdmin.token
  )
  oneConnect({
    action: ActionSystem.SYSTEM_CONFIG,
    parameters: getDefaultParamsOfOpennebulaCommand(
      ActionSystem.SYSTEM_CONFIG,
      GET
    ),
    callback: (err, value) => {
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
    },
  })
}

/**
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} [params.hypervisor="kvm"] - fetch vmm_exec_[hypervisor].conf
 * @returns {void}
 */
const getVmmConfigHandler = async (
  res = {},
  next = defaultEmptyFunction,
  params = {}
) => {
  try {
    const { hypervisor } = params
    const vmmConfig = (await getVmmConfig(hypervisor)) ?? {}

    if (!vmmConfig) {
      res.locals.httpCode = httpResponse(
        notFound,
        'No vmm_exec config found',
        ''
      )

      return next()
    }

    if (Object.keys(vmmConfig)?.length === 0) {
      res.locals.httpCode = httpResponse(
        notFound,
        'No valid vmm_exec config found',
        ''
      )
    } else {
      res.locals.httpCode = httpResponse(ok, vmmConfig)
    }
  } catch (error) {
    const httpError = httpResponse(
      internalServerError,
      'Failed to load vmm_exec config',
      ''
    )
    writeInLogger(httpError)
    res.locals.httpCode = httpError
  }

  next()
}

module.exports = {
  getConfig,
  getVmmConfigHandler,
}
