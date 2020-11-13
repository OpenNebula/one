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

const { Validator } = require('jsonschema')
const {
  ok,
  accepted,
  internalServerError
} = require('server/utils/constants/http-codes')
const { httpResponse, parsePostData } = require('server/utils/server')
const { tmpPath } = require('server/utils/constants/defaults')
const {
  executeCommand,
  executeCommandAsync,
  createTemporalFile,
  createYMLContent,
  removeFile,
  publish
} = require('./functions')
const { provision } = require('./schemas')

const httpInternalError = httpResponse(internalServerError, '', '')

const command = 'oneprovision'

const getList = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.resource && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const executedCommand = executeCommand(command, [`${params.resource}`.toLowerCase(), 'list', ...authCommand, '--json'])
    try {
      const response = executedCommand.success ? ok : internalServerError
      res.locals.httpCode = httpResponse(response, JSON.parse(executedCommand.data))
      next()
      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

const getListProvisions = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (user && password) {
    const authCommand = ['--user', user, '--password', password]
    let paramsCommand = ['list', ...authCommand, '--json']
    if (params && params.id) {
      paramsCommand = ['show', `${params.id}`.toLowerCase(), ...authCommand, '--json']
    }
    const executedCommand = executeCommand(command, paramsCommand)
    try {
      const response = executedCommand.success ? ok : internalServerError
      res.locals.httpCode = httpResponse(response, JSON.parse(executedCommand.data))
      next()
      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

const deleteResource = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.resource && params.id && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = [`${params.resource}`.toLowerCase(), 'delete', `${params.id}`.toLowerCase(), ...authCommand]
    const executedCommand = executeCommand(command, paramsCommand)
    try {
      const response = executedCommand.success ? ok : internalServerError
      res.locals.httpCode = httpResponse(response, JSON.parse(executedCommand.data))
      next()
      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

const deleteProvision = (res = {}, next = () => undefined, params = {}, userData = {}) => { // falta
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.id && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['delete', `${params.id}`.toLowerCase(), ...authCommand]
    const executedCommand = executeCommand(command, paramsCommand)
    try {
      const response = executedCommand.success ? ok : internalServerError
      res.locals.httpCode = httpResponse(response, JSON.parse(executedCommand.data))
      next()
      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

const hostCommand = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.action && params.id && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['host', `${params.action}`.toLowerCase(), `${params.id}`.toLowerCase(), ...authCommand]
    const executedCommand = executeCommand(command, paramsCommand)
    try {
      const response = executedCommand.success ? ok : internalServerError
      res.locals.httpCode = httpResponse(response, JSON.parse(executedCommand.data))
      next()
      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

const hostCommandSSH = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.action && params.id && params.command && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['host', `${params.action}`.toLowerCase(), `${params.id}`.toLowerCase(), `${params.command}`.toLowerCase(), ...authCommand]
    const executedCommand = executeCommand(command, paramsCommand)
    try {
      const response = executedCommand.success ? ok : internalServerError
      res.locals.httpCode = httpResponse(response, JSON.parse(executedCommand.data))
      next()
      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

const createProvision = (res = {}, next = () => undefined, params = {}, userData = {}) => { // falta
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.resource && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const schemaValidator = new Validator()
    const resource = parsePostData(params.resource)
    const valSchema = schemaValidator.validate(resource, provision)
    if (valSchema.valid) {
      const content = createYMLContent(resource)
      if (content) {
        const ext = '.yaml'
        const file = createTemporalFile(`${global.CPI}/provision/`, ext, content)
        if (file && file.name && file.path) {
          const paramsCommand = ['create', file.path, '--debug', '--skip-provision', ...authCommand]

          // esto tiene que estar vivo
          executeCommandAsync(
            command,
            paramsCommand,
            message => {
              publish(command, { id: file.name, message: message.toString() })
            }
          )

          res.locals.httpCode = httpResponse(accepted, file.name)
          next()
          return
        }
      }
    } else {
      const errors = []
      if (valSchema && valSchema.errors) {
        valSchema.errors.forEach(error => {
          errors.push(error.stack.replace(/^instance./, ''))
        })
        rtn = httpResponse(internalServerError, '', errors.toString())
      }
    }
  }
  res.locals.httpCode = rtn
  next()
}

const configureProvision = (res = {}, next = () => undefined, params = {}, userData = {}) => { // falta
  const { user, password } = userData
  const authCommand = ['--user', user, '--password', password]
  const rtn = httpInternalError
  res.locals.httpCode = rtn // debe de ser un websocket
  next()
}

const configureHost = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.id && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['host', 'configure', `${params.id}`.toLowerCase(), '--debug', '--fail_cleanup', '--batch', ...authCommand]
    const executedCommand = executeCommand(command, paramsCommand)
    try {
      const response = executedCommand.success ? ok : internalServerError
      res.locals.httpCode = httpResponse(response, JSON.parse(executedCommand.data))
      next()
      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

const validate = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.resource && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const schemaValidator = new Validator()
    const resource = parsePostData(params.resource)
    const valSchema = schemaValidator.validate(resource, provision)
    if (valSchema.valid) {
      const content = createYMLContent(resource)
      if (content) {
        const ext = '.yaml'
        const file = createTemporalFile(tmpPath, ext, content)
        if (file && file.name && file.path) {
          const paramsCommand = ['validate', file.path, ...authCommand]
          const executedCommand = executeCommand(command, paramsCommand)
          let response = internalServerError
          if (executedCommand && executedCommand.success) {
            response = ok
            removeFile(file)
          }
          res.locals.httpCode = httpResponse(response)
          next()
          return
        }
      }
    } else {
      const errors = []
      if (valSchema && valSchema.errors) {
        valSchema.errors.forEach(error => {
          errors.push(error.stack.replace(/^instance./, ''))
        })
        rtn = httpResponse(internalServerError, '', errors.toString())
      }
    }
  }
  res.locals.httpCode = rtn
  next()
}

const provisionFunctionsApi = {
  getList,
  getListProvisions,
  deleteResource,
  deleteProvision,
  hostCommand,
  hostCommandSSH,
  createProvision,
  configureProvision,
  configureHost,
  validate
}
module.exports = provisionFunctionsApi
