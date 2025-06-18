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
const { Actions: vmActions } = require('server/utils/constants/commands/vm')

const {
  VM_POOL_ACCOUNTING,
  VM_POOL_SHOWBACK,
  VM_POOL_INFO,
  VM_POOL_INFO_EXTENDED,
} = vmActions

const { ok, internalServerError } = httpCodes
const { defaultEmptyFunction } = defaults

/**
 * Get the accouting info for an user or a group. User uses the XML API parameter to filter by users. Group gets all the for an interval of time and filter by the group id before return it.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - Parameters of the request
 * @param {object} userData - Data about the user
 * @param {Function} oneConnection - Function to connect to the XML API
 */
const accounting = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  // Get the params
  const {
    user: userId,
    group: groupId,
    start: startTime,
    end: endTime,
  } = params

  // Get user data
  const { user, password } = userData

  // Get connection to ONE
  const oneConnect = oneConnection(user, password)

  // If there is an userId, sent to the XML API the id of the user. If not, send -2 to get all the data
  const filterParameter = userId ?? '-2'

  /**
   * Response http request.
   *
   * @param {object} httpRes - http response
   * @param {Function} next - express stepper
   * @param {object} httpCode - object http code
   */
  const responseHttp = (
    httpRes = {},
    next = defaultEmptyFunction,
    httpCode
  ) => {
    if (httpRes && httpRes.locals && httpRes.locals.httpCode && httpCode) {
      httpRes.locals.httpCode = httpCode
      next()
    }
  }

  // Connect to XML API
  oneConnect({
    action: VM_POOL_ACCOUNTING,
    parameters: [
      parseInt(filterParameter, 10),
      parseInt(startTime, 10),
      parseInt(endTime, 10),
    ],
    callback: (error, value) => {
      // Get the response
      const responseData = value

      // Filter if there is not userId and there is a groupId
      if (responseData && responseData.HISTORY_RECORDS) {
        // Filter data by group id
        const history = Array.isArray(responseData.HISTORY_RECORDS.HISTORY)
          ? responseData.HISTORY_RECORDS.HISTORY
          : [responseData.HISTORY_RECORDS.HISTORY]

        if (!userId && groupId) {
          responseData.HISTORY_RECORDS.HISTORY = history.filter(
            (item) => item.VM.GID === groupId
          )
        } else {
          responseData.HISTORY_RECORDS.HISTORY = history
        }
      }

      // Return response
      responseHttp(
        res,
        next,
        error
          ? httpResponse(internalServerError, error)
          : httpResponse(ok, responseData)
      )
    },
  })
}

/**
 * Get the showback info for an user or a group. User uses the XML API parameter to filter by users. Group gets all the for an interval of time and filter by the group id before return it.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - Parameters of the request
 * @param {object} userData - Data about the user
 * @param {Function} oneConnection - Function to connect to the XML API
 */
const showback = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  // Get the params
  const {
    user: userId,
    group: groupId,
    startMonth,
    startYear,
    endMonth,
    endYear,
  } = params

  // Get user data
  const { user, password } = userData

  // Get connection to ONE
  const oneConnect = oneConnection(user, password)

  // If there is an userId, sent to the XML API the id of the user. If not, send -2 to get all the data
  const filterParameter = userId ?? '-2'

  /**
   * Response http request.
   *
   * @param {object} httpRes - http response
   * @param {Function} next - express stepper
   * @param {object} httpCode - object http code
   */
  const responseHttp = (
    httpRes = {},
    next = defaultEmptyFunction,
    httpCode
  ) => {
    if (httpRes && httpRes.locals && httpRes.locals.httpCode && httpCode) {
      httpRes.locals.httpCode = httpCode
      next()
    }
  }

  // Connect to XML API
  oneConnect({
    action: VM_POOL_SHOWBACK,
    parameters: [
      parseInt(filterParameter, 10),
      startMonth ? parseInt(startMonth, 10) : -1,
      startYear ? parseInt(startYear, 10) : -1,
      endMonth ? parseInt(endMonth, 10) : -1,
      endYear ? parseInt(endYear, 10) : -1,
    ],
    callback: (error, value) => {
      // Get the response
      const responseData = value

      // Filter if there is not userId and there is a groupId
      if (responseData && responseData.SHOWBACK_RECORDS) {
        // Filter data by group id
        const showbackHistory = Array.isArray(
          responseData.SHOWBACK_RECORDS.SHOWBACK
        )
          ? responseData.SHOWBACK_RECORDS.SHOWBACK
          : [responseData.SHOWBACK_RECORDS.SHOWBACK]

        if (!userId && groupId) {
          responseData.SHOWBACK_RECORDS.SHOWBACK = showbackHistory.filter(
            (item) => item.GID === groupId
          )
        } else {
          responseData.SHOWBACK_RECORDS.SHOWBACK = showbackHistory
        }
      }

      // Return response
      responseHttp(
        res,
        next,
        error
          ? httpResponse(internalServerError, error)
          : httpResponse(ok, responseData)
      )
    },
  })
}

/**
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - Parameters of the request
 * @param {object} userData - Data about the user
 * @param {Function} oneConnection - Function to connect to the XML API
 */
const fetchPaginatedPool = async (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const {
    extended = 0,
    filter = -2,
    offset: initialOffset = 0,
    pageSize: rawPageSize = -200,
    state = -1,
    filterByKey = '',
  } = params

  const { user, password } = userData
  const oneConnect = oneConnection(user, password)

  const absPageSize = Math.abs(parseInt(rawPageSize, 10))
  const baseParams = [parseInt(filter, 10), parseInt(state, 10), filterByKey]
  const actionType = extended === '1' ? VM_POOL_INFO_EXTENDED : VM_POOL_INFO
  const maxConcurrency = 5

  const oneConnectAsync = (args) =>
    new Promise((resolve, reject) => {
      oneConnect({
        ...args,
        callback: (err, value) => {
          err ? reject(err) : resolve(value)
        },
      })
    })

  const fetchPage = async (offset) => {
    const fParams = [
      baseParams[0],
      offset,
      -absPageSize,
      baseParams[1],
      baseParams[2],
    ]
    const { VM_POOL: { VM: data = [] } = {} } = await oneConnectAsync({
      action: actionType,
      parameters: fParams,
    })

    return data || []
  }

  const runBatches = async () => {
    const results = []
    let offset = parseInt(initialOffset, 10)

    for (;;) {
      const jobs = Array.from({ length: maxConcurrency }, (_, i) =>
        fetchPage(offset + i * absPageSize)
      )

      const pages = await Promise.all(jobs)

      let hitEnd = false

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        if (page.length < absPageSize) hitEnd = true
        for (let j = 0; j < page.length; j++) {
          results.push(page[j])
        }
      }

      if (hitEnd) break

      offset += absPageSize * maxConcurrency
    }

    return results
  }

  const responseHttp = (
    httpRes = {},
    next = defaultEmptyFunction,
    httpCode
  ) => {
    if (httpRes?.locals?.httpCode && httpCode) {
      httpRes.locals.httpCode = httpCode
      next()
    }
  }

  try {
    const results = await runBatches()
    responseHttp(res, next, httpResponse(ok, results))
  } catch (error) {
    responseHttp(res, next, httpResponse(internalServerError, error))
  }
}

const functionRoutes = {
  accounting,
  showback,
  fetchPaginatedPool,
}

module.exports = functionRoutes
