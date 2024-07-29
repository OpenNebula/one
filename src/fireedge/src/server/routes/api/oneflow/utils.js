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

const { request: axios } = require('axios')
const btoa = require('btoa')

const { defaultOneFlowServer } = require('server/utils/constants/defaults')
const { getFireedgeConfig } = require('server/utils/yml')
const { httpMethod } = require('server/utils/constants/defaults')
const { addPrintf } = require('server/utils/general')

const { GET, DELETE } = httpMethod

const appConfig = getFireedgeConfig()

/**
 * Return schema error.
 *
 * @param {string} error - get error for schema
 * @returns {string} schema
 */
const returnSchemaError = (error = []) =>
  error
    .map((element) => (element && element.stack ? element.stack : ''))
    .toString()

/**
 * Parse number to int.
 *
 * @param {string} validate - number to validate
 * @returns {number}number to int
 */
const parseToNumber = (validate) =>
  isNaN(parseInt(validate, 10)) ? validate : parseInt(validate, 10)

/**
 * Connection to one flow server.
 *
 * @param {object} requestData - data for request
 * @param {Function} success - callback success function
 * @param {Function} error - callback error function
 */
const oneFlowConnection = (
  requestData = {},
  success = () => undefined,
  error = () => undefined
) => {
  const { method, path, user, password, request, post } = requestData
  const optionMethod = method || GET
  const optionPath = path || '/'
  const optionAuth = btoa(`${user || ''}:${password || ''}`)

  const options = {
    method: optionMethod,
    baseURL: appConfig.oneflow_server || defaultOneFlowServer,
    url: request ? addPrintf(optionPath, request || '') : optionPath,
    headers: {
      Authorization: `Basic ${optionAuth}`,
    },
    validateStatus: (status) => status >= 200 && status < 400,
  }

  if (post) options.data = post

  axios(options)
    .then((response) => {
      if (!response.statusText) throw Error(response.statusText)

      if (`${response.config.method}`.toUpperCase() === DELETE) {
        return Array.isArray(request)
          ? parseToNumber(request[0])
          : parseToNumber(request)
      }

      return response.data
    })
    .then(success)
    .catch(error)
}

const functionRoutes = {
  oneFlowConnection,
  returnSchemaError,
}

module.exports = functionRoutes
