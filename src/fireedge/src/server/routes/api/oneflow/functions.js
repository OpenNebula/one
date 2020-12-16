/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */
const { request: axios } = require('axios')
const btoa = require('btoa')

const { defaultOneFlowServer } = require('server/utils/constants/defaults')
const { getConfig } = require('server/utils/yml')
const { httpMethod } = require('server/utils/constants/defaults')
const { addPrintf } = require('server/utils/general')

const { GET, DELETE } = httpMethod

const appConfig = getConfig()

const returnSchemaError = (error = []) =>
  error
    .map(element => (element && element.stack ? element.stack : ''))
    .toString()

const parseToNumber = validate =>
  isNaN(parseInt(validate, 10))
    ? validate
    : parseInt(validate, 10)

const oneFlowConection = (requestData = {}, success = () => undefined, error = () => undefined) => {
  const { method, path, user, password, request, post } = requestData
  const optionMethod = method || GET
  const optionPath = path || '/'
  const optionAuth = btoa(`${user || ''}:${password || ''}`)
  const options = {
    method: optionMethod,
    baseURL: appConfig.oneflow_server || defaultOneFlowServer,
    url: request ? addPrintf(optionPath, request || '') : optionPath,
    headers: {
      Authorization: `Basic ${optionAuth}`
    },
    validateStatus: status => status
  }

  if (post) {
    options.data = post
  }
  axios(options)
    .then(response => {
      if (response && response.statusText) {
        if (response.status >= 200 && response.status < 400) {
          if (response.data) {
            return response.data
          }
          if (
            response.config.method &&
              response.config.method.toUpperCase() === DELETE
          ) {
            return Array.isArray(request)
              ? parseToNumber(request[0])
              : parseToNumber(request)
          }
        } else if (response.data) {
          throw Error(response.data)
        }
      }
      throw Error(response.statusText)
    })
    .then(data => {
      success(data)
    })
    .catch(e => {
      error(e)
    })
}

const functionRoutes = {
  oneFlowConection,
  returnSchemaError
}

module.exports = functionRoutes
