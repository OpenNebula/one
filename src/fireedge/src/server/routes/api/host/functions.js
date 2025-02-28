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

const { defaults, httpCodes } = require('server/utils/constants')
const { httpResponse } = require('server/utils/server')
const { defaultEmptyFunction, httpMethod } = defaults
const { GET } = httpMethod
const { getServerAdmin } = require('server/routes/api/auth/utils')
const {
  getDefaultParamsOfOpennebulaCommand,
} = require('server/utils/opennebula')
const { Actions: hostActions } = require('server/utils/constants/commands/host')
const { Actions: vmsAction } = require('server/utils/constants/commands/vm')

const { VM_ACTION } = vmsAction
const { HOST_POOL_INFO, HOST_INFO, HOST_STATUS } = hostActions
const { ok, badRequest, unauthorized, conflict } = httpCodes

/**
 * Show cluster with server admin credentials.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} _params - data response http
 * @param {object} _userData - user of http request
 * @param {Function} oneConnection - XML-RPC function
 */
const show = (
  res = {},
  next = defaultEmptyFunction,
  _params = {},
  _userData = {}, // credenciales del usuario authenticado!
  oneConnection = defaultEmptyFunction
) => {
  const serverAdmin = getServerAdmin()
  const { token: authToken } = serverAdmin

  if (!authToken) {
    res.locals.httpCode = httpResponse(badRequest, '')
    next()

    return
  }

  const { username } = serverAdmin // credenciales de server admin
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

/**
 * Reschedule vm.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {number} id - data response http
 * @param {object} userData - user of http request
 * @param {Function} oneConnect - XML-RPC function
 */
const reschedVM = (
  res = {},
  next = defaultEmptyFunction,
  id,
  userData = {},
  oneConnect
) => {
  oneConnect({
    action: VM_ACTION,
    parameters: ['resched', parseInt(id, 10)],
    callback: (err, _value = {}) => {
      if (err) {
        res.locals.httpCode = httpResponse(unauthorized, err)
        next()
      }
    },
  })
}

/**
 * Get host of specific id.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} params - data response http
 * @param {object} _userData - user of http request
 * @param {Function} oneConnect - XML-RPC function
 */
const disableHost = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  _userData = {},
  oneConnect
) => {
  const { id } = params
  oneConnect({
    action: HOST_STATUS,
    parameters: [parseInt(id, 10), 1],
    callback: (err, _ = {}) => {
      if (err) {
        res.locals.httpCode = httpResponse(unauthorized, err)
        next()
      }
    },
  })
}

/**
 * Get host of specific id.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} params - data response http
 * @param {object} userData - user of http request
 * @param {Function} oneConnect - XML-RPC function
 */
const flushHost = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnect
) => {
  const { id } = params
  oneConnect({
    action: HOST_INFO,
    parameters: [parseInt(id, 10), false],
    callback: (err, value = {}) => {
      const { HOST = [] } = value
      if (err) {
        res.locals.httpCode = httpResponse(unauthorized, err)
        next()

        return
      }

      if (!HOST.VMS.ID) {
        res.locals.httpCode = httpResponse(badRequest, {
          type: 'err_host_is_empty',
        })
        next()

        return
      }

      disableHost(res, next, params, userData, oneConnect)

      const vmsIds = Array.isArray(HOST.VMS?.ID) ? HOST.VMS?.ID : [HOST.VMS?.ID]

      vmsIds?.map((vmId) => reschedVM(res, next, vmId, userData, oneConnect))

      res.locals.httpCode = httpResponse(ok, { HOST })
      next()
    },
  })
}

/**
 * Flush a host.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} params - data response http
 * @param {object} userData - user of http request
 * @param {Function} oneConnection - XML-RPC function
 */
const flush = (
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

      const hostList = HOST_POOL.HOST
      if (Array.isArray(hostList) && hostList.length > 1) {
        const hostEnabledCount = hostList?.filter(
          (obj) => obj?.STATE === '2' // Enabled
        )?.length

        if (hostEnabledCount < 2) {
          res.locals.httpCode = httpResponse(conflict, { type: 'err_one_host' })
          next()

          return
        }

        flushHost(res, next, params, userData, oneConnect)
      } else {
        res.locals.httpCode = httpResponse(conflict, { type: 'err_one_host' })
        next()
      }
    },
  })
}

const functionRoutes = {
  show,
  flush,
}
module.exports = functionRoutes
