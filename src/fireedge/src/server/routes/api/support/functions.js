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
const btoa = require('btoa')
const { defaults, httpCodes } = require('server/utils/constants')
const { httpResponse, executeRequest } = require('server/utils/server')
const { getSunstoneConfig } = require('server/utils/yml')
const { writeInLogger } = require('server/utils/logger')
const { defaultEmptyFunction, httpMethod, defaultEnterpriseRepo } = defaults
const { ok, badRequest } = httpCodes
const { GET } = httpMethod

const appConfig = getSunstoneConfig()

const headerUserAgent = {
  'User-Agent': 'OpenNebula Subscription Validation',
}

/**
 * Check if the instance has enterprise support.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 */
const checkSupport = (res = {}, next = defaultEmptyFunction) => {
  const responser = (data = '', code = badRequest) => {
    res.locals.httpCode = httpResponse(code, data, '')
    next()
  }

  if (!(appConfig && appConfig.token_remote_support)) {
    responser('empty/null token')

    return
  }

  executeRequest(
    {
      params: {
        url: defaultEnterpriseRepo,
        method: GET,
        headers: {
          Authorization: `Basic ${btoa(appConfig.token_remote_support)}`,
          ...headerUserAgent,
        },
      },
    },
    {
      success: (data) => {
        writeInLogger(data, {
          format: 'Subscription validation response: %s',
          level: 2,
        })
        data ? responser('', ok) : responser('')
      },
      error: (error) => {
        writeInLogger(error.message)

        return responser(error && error.message)
      },
    }
  )
}

module.exports = {
  checkSupport,
}
