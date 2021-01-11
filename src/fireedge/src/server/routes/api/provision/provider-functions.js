/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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

const { parse } = require('yaml')
const { Validator } = require('jsonschema')
const { tmpPath, defaultCommandProvider } = require('server/utils/constants/defaults')

const {
  ok,
  notFound,
  internalServerError
} = require('server/utils/constants/http-codes')
const { httpResponse, existsFile, parsePostData } = require('server/utils/server')
const { executeCommand, getFiles, createTemporalFile, createYMLContent, removeFile, getEndpoint } = require('./functions')
const { provider, providerUpdate } = require('./schemas')

const httpInternalError = httpResponse(internalServerError, '', '')

const getListProviders = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (user && password) {
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    let paramsCommand = ['list', ...authCommand, ...endpoint, '--json']
    if (params && params.id) {
      paramsCommand = ['show', `${params.id}`.toLowerCase(), ...authCommand, '--json']
    }
    const executedCommand = executeCommand(defaultCommandProvider, paramsCommand)
    try {
      const response = executedCommand.success ? ok : internalServerError
      const data = JSON.parse(executedCommand.data)
      if (data && data.DOCUMENT_POOL && data.DOCUMENT_POOL.DOCUMENT && Array.isArray(data.DOCUMENT_POOL.DOCUMENT)) {
        data.DOCUMENT_POOL.DOCUMENT = data.DOCUMENT_POOL.DOCUMENT.map(provision => {
          if (provision && provision.TEMPLATE && provision.TEMPLATE.PLAIN) {
            provision.TEMPLATE.PLAIN = JSON.parse(provision.TEMPLATE.PLAIN)
          }
          return provision
        })
      }
      res.locals.httpCode = httpResponse(response, data)
      next()
      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

const createProviders = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.resource && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const endpoint = getEndpoint()
    const schemaValidator = new Validator()
    const resource = parsePostData(params.resource)
    const valSchema = schemaValidator.validate(resource, provider)
    if (valSchema.valid) {
      const content = createYMLContent(resource)
      if (content) {
        const file = createTemporalFile(tmpPath, 'yaml', content)
        if (file && file.name && file.path) {
          const paramsCommand = ['create', file.path, ...authCommand, ...endpoint]
          const executedCommand = executeCommand(defaultCommandProvider, paramsCommand)
          res.locals.httpCode = httpResponse(internalServerError)
          if (executedCommand && executedCommand.data) {
            if (executedCommand.success) {
              const data = executedCommand.data
              const dataInternal = data && Array.isArray(data.match('\\d+')) ? data.match('\\d+').join() : data
              res.locals.httpCode = httpResponse(ok, dataInternal)
              removeFile(file.path)
            } else {
              res.locals.httpCode = httpResponse(internalServerError, '', executedCommand.data)
            }
          }
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

const updateProviders = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.resource && params.id && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const endpoint = getEndpoint()
    const schemaValidator = new Validator()
    const resource = parsePostData(params.resource)
    const valSchema = schemaValidator.validate(resource, providerUpdate)
    if (valSchema.valid) {
      const file = createTemporalFile(tmpPath, 'json', JSON.stringify(resource))
      if (file && file.name && file.path) {
        const paramsCommand = ['update', params.id, file.path, ...authCommand, ...endpoint]
        const executedCommand = executeCommand(defaultCommandProvider, paramsCommand)
        res.locals.httpCode = httpResponse(internalServerError)
        if (executedCommand && executedCommand.success) {
          res.locals.httpCode = httpResponse(ok)
          removeFile(file.path)
        }
        next()
        return
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

const deleteProvider = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.id && user && password) {
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    const paramsCommand = ['delete', `${params.id}`.toLowerCase(), ...authCommand, ...endpoint]
    const executedCommand = executeCommand(defaultCommandProvider, paramsCommand)
    const data = executedCommand.data || ''
    try {
      if (executedCommand) {
        res.locals.httpCode = httpResponse(ok)
      } else {
        res.locals.httpCode = httpResponse(internalServerError, data)
      }
      next()
      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

const providerFunctionsApi = {
  getListProviders,
  createProviders,
  updateProviders,
  deleteProvider
}
module.exports = providerFunctionsApi
