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
  defaultCommandVcenter,
} = require('server/utils/constants/defaults')

const {
  ok,
  internalServerError,
  badRequest,
} = require('server/utils/constants/http-codes')
const { httpResponse, executeCommand } = require('server/utils/server')
const {
  consoleParseToString,
  consoleParseToJSON,
} = require('server/utils/opennebula')
const { resources } = require('./command-flags')

const { getSunstoneConfig } = require('server/utils/yml')

const httpBadRequest = httpResponse(badRequest, '', '')
const appConfig = getSunstoneConfig()
const prependCommand = appConfig.vcenter_prepend_command || ''
const regexExclude = [
  /^Connecting to.*/gi,
  /^Exploring vCenter.*/gi,
  // eslint-disable-next-line no-control-regex
  /^\u001b\[.*?m\u001b\[.*?m# vCenter.*/gi,
]
const validObjects = Object.values(resources)

/**
 * Import the the desired vCenter object.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const importVcenter = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  let rtn = httpBadRequest
  // check params
  if (
    params &&
    params.vobject &&
    validObjects.includes(params.vobject) &&
    params.host
  ) {
    const vobject = `${params.vobject}`.toLowerCase()

    let paramsCommand = [params.answers ? 'import' : 'import_defaults']

    if (params.id) {
      paramsCommand.push(`${params.id}`)
    }

    let vobjectAndHost = ['-o', `${vobject}`, '-h', `${params.host}`]

    if (vobject === resources.IMAGES && params.datastore) {
      const datastoreParameter = ['-d', params.datastore]
      vobjectAndHost = [...vobjectAndHost, ...datastoreParameter]
    }

    // flags by questions import command
    /* if (params.answers && questions[vobject]) {
      const answers = params.answers.split(',')
    } */

    paramsCommand = [...paramsCommand, ...vobjectAndHost]
    const executedCommand = executeCommand(
      defaultCommandVcenter,
      paramsCommand,
      prependCommand
    )
    const response = executedCommand.success ? ok : internalServerError
    let message = ''
    if (executedCommand.data) {
      message = consoleParseToString(executedCommand.data, regexExclude)
    }
    rtn = httpResponse(response, message)
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Show a list with unimported vCenter objects excluding all filters.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const list = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  let rtn = httpBadRequest
  if (
    params &&
    params.vobject &&
    validObjects.includes(params.vobject) &&
    params.host
  ) {
    const vobject = `${params.vobject}`.toLowerCase()
    let paramsCommand = [
      'list',
      '-o',
      `${vobject}`,
      '-h',
      `${params.host}`,
      '--csv',
    ]
    if (vobject === resources.IMAGES && params.datastore) {
      const newParameters = ['-d', params.datastore]
      paramsCommand = [...paramsCommand, ...newParameters]
    }
    const executedCommand = executeCommand(
      defaultCommandVcenter,
      paramsCommand,
      prependCommand
    )

    const response = executedCommand.success ? ok : internalServerError
    let message = ''
    if (executedCommand.data) {
      message = consoleParseToJSON(
        consoleParseToString(executedCommand.data, regexExclude),
        /^IMID,.*/gi
      )
    }
    rtn = httpResponse(response, message)
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Show a list with unimported vCenter objects excluding all filters.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const listAll = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  let rtn = httpBadRequest
  if (
    params &&
    params.vobject &&
    validObjects.includes(params.vobject) &&
    params.host
  ) {
    const vobject = `${params.vobject}`.toLowerCase()
    let paramsCommand = [
      'list_all',
      '-o',
      `${vobject}`,
      '-h',
      `${params.host}`,
      '--csv',
    ]
    if (vobject === resources.IMAGES && params.datastore) {
      const newParameters = ['-d', params.datastore]
      paramsCommand = [...paramsCommand, ...newParameters]
    }
    const executedCommand = executeCommand(
      defaultCommandVcenter,
      paramsCommand,
      prependCommand
    )

    const response = executedCommand.success ? ok : internalServerError
    let message = ''
    if (executedCommand.data) {
      message = consoleParseToJSON(
        consoleParseToString(executedCommand.data, regexExclude),
        /^IMID,.*/gi
      )
    }
    rtn = httpResponse(response, message)
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Clear extraconfig tags from a vCenter VM, useful when a VM has been launched by OpenNebula and needs to be reimported.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const cleartags = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  let rtn = httpBadRequest
  // check params
  if (params && params.id) {
    const paramsCommand = ['cleartags', `${params.id}`]
    const executedCommand = executeCommand(
      defaultCommandVcenter,
      paramsCommand,
      prependCommand
    )
    const response = executedCommand.success ? ok : internalServerError
    let message = ''
    if (executedCommand.data) {
      message = consoleParseToString(executedCommand.data, regexExclude)
    }
    rtn = httpResponse(response, message)
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Import vCenter cluster as Opennebula host.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const hosts = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  let rtn = httpBadRequest
  // check params
  if (params && params.vcenter && params.user && params.pass) {
    const paramsCommand = [
      'hosts',
      '--vcenter',
      `${params.vcenter}`.toLowerCase(),
      '--vuser',
      `${params.user}`,
      '--vpass',
      `${params.pass}`,
      '--use-defaults',
    ]
    const executedCommand = executeCommand(
      defaultCommandVcenter,
      paramsCommand,
      prependCommand
    )
    const response = executedCommand.success ? ok : internalServerError
    let message = ''
    if (executedCommand.data) {
      message = consoleParseToString(executedCommand.data, regexExclude)
    }
    rtn = httpResponse(response, message)
  }
  res.locals.httpCode = rtn
  next()
}

const functionRoutes = {
  importVcenter,
  list,
  listAll,
  cleartags,
  hosts,
}
module.exports = functionRoutes
