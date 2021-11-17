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

const {
  defaultEmptyFunction,
  defaultCommandVM
} = require('server/utils/constants/defaults')

const {
  ok,
  internalServerError,
  badRequest
} = require('server/utils/constants/http-codes')
const { httpResponse, executeCommand } = require('server/utils/server')

const { getSunstoneConfig } = require('server/utils/yml')

const httpBadRequest = httpResponse(badRequest, '', '')
const appConfig = getSunstoneConfig()
const prependCommand = appConfig.sunstone_prepend || ''
const regexpSplitLine = /\r|\n/

/**
 * Save as template.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const saveAsTemplate = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  let rtn = httpBadRequest
  const { id, name, persistent } = params
  if (id && name) {
    let message = ''
    const paramsCommand = ['save', `${id}`, `${name}`]

    if (persistent && persistent === 'true') {
      paramsCommand.push('--persistent')
    }

    const executedCommand = executeCommand(defaultCommandVM, paramsCommand, prependCommand)

    const response = executedCommand.success ? ok : internalServerError

    if (executedCommand.data) {
      message = executedCommand.data.replace(regexpSplitLine, '')
    }
    rtn = httpResponse(response, message)
  }
  res.locals.httpCode = rtn
  next()
}

const functionRoutes = {
  saveAsTemplate
}
module.exports = functionRoutes
