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

const { sprintf } = require('sprintf-js')
const { request: axios } = require('axios')
const {
  defaultEmptyFunction,
  dockerUrl,
} = require('server/utils/constants/defaults')

const {
  Actions: ActionsMarket,
} = require('server/utils/constants/commands/market')

const {
  ok,
  internalServerError,
  notFound,
} = require('server/utils/constants/http-codes')
const { httpResponse } = require('server/utils/server')

const httpNotFoundRequest = httpResponse(notFound, '', '')
const httpInternalError = httpResponse(internalServerError, '', '')

/**
 * Response http request.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} httpCode - object http code
 * @param {number} httpCode.id - http code number
 * @param {string} httpCode.message - http message
 * @param {object} [httpCode.data] - http data
 * @param {string} [httpCode.file] - file path
 */
const responseHttp = (res = {}, next = defaultEmptyFunction, httpCode) => {
  if (res && res.locals && res.locals.httpCode && httpCode) {
    res.locals.httpCode = httpCode
    next()
  }
}

/**
 * Request tags docker.
 *
 * @param {string} url - url docker
 * @param {string[]} tags - tags
 * @param {Function} error - error callback
 */
const getTagsDocker = (url = '', tags = [], error = defaultEmptyFunction) => {
  axios({
    method: 'GET',
    url,
    headers: {
      'User-Agent': 'OpenNebula',
    },
    validateStatus: (status) => status,
  })
    .then(({ statusText, status, data }) => {
      if (status >= 200 && status < 400 && data) {
        return data
      } else if (data) {
        throw Error(data)
      }
      throw Error(statusText)
    })
    .then((data) => {
      const { next: dockerNext, results } = data
      if (results) {
        const result = Array.isArray(results) ? results : [results]
        result.forEach(({ name, last_updated: lastUpdated }) => {
          if (name && lastUpdated) {
            tags.push({ name, last_updated: lastUpdated })
          }
        })
      }
      if (dockerNext) {
        getTagsDocker(dockerNext, tags)
      }
    })
    .catch((e) => {
      error(e)
    })
}

/**
 * Get Docker Hub Tags.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {number} params.id - market id
 * @param {object} userData - user data.
 * @param {string} userData.user - ONE username
 * @param {string} userData.password - ONE password
 * @param {Function} oneConnection - xmlrpc function
 */
const getDockerTags = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const { id } = params
  const { user, password } = userData
  if (id && user && password) {
    const connect = oneConnection(user, password)
    connect(
      ActionsMarket.MARKET_INFO,
      [parseInt(id)],
      (err = {}, marketAppData = {}) => {
        if (
          marketAppData &&
          marketAppData.MARKETPLACE &&
          marketAppData.MARKETPLACE.NAME
        ) {
          const tags = []
          getTagsDocker(
            sprintf(dockerUrl, marketAppData.MARKETPLACE.NAME),
            tags,
            () => responseHttp(res, next, httpInternalError)
          )
          responseHttp(res, next, httpResponse(ok, tags))
        } else {
          responseHttp(res, next, httpInternalError)
        }
      }
    )
  } else {
    responseHttp(res, next, httpNotFoundRequest)
  }
}

const functionRoutes = {
  getDockerTags,
}
module.exports = functionRoutes
