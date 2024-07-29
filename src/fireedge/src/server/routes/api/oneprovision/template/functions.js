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

const { Validator } = require('jsonschema')
const { defaults, httpCodes } = require('server/utils/constants')
const {
  httpResponse,
  parsePostData,
  executeCommand,
  removeFile,
} = require('server/utils/server')
const {
  createYMLContent,
  createTemporalFile,
  getEndpoint,
  getSpecificConfig,
} = require('server/routes/api/oneprovision/utils')
const { provider } = require('server/routes/api/oneprovision/schemas')

const { defaultFolderTmpProvision, defaultCommandProvisionTemplate } = defaults
const { ok, internalServerError } = httpCodes
const httpInternalError = httpResponse(internalServerError, '', '')

/**
 * Get provision list template.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const getListProvisionTemplates = (
  res = {},
  next = () => undefined,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (user && password) {
    const endpoint = getEndpoint()
    const authCommand = ['--user', user, '--password', password]
    let paramsCommand = ['list', ...authCommand, '--json']
    if (params && params.id) {
      paramsCommand = [
        'show',
        `${params.id}`.toLowerCase(),
        ...authCommand,
        ...endpoint,
        '--json',
      ]
    }
    const executedCommand = executeCommand(
      defaultCommandProvisionTemplate,
      paramsCommand,
      getSpecificConfig('oneprovision_prepend_command')
    )
    try {
      const response = executedCommand.success ? ok : internalServerError
      res.locals.httpCode = httpResponse(
        response,
        JSON.parse(executedCommand.data)
      )
      next()

      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Create provision template.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const createProvisionTemplate = (
  res = {},
  next = () => undefined,
  params = {},
  userData = {}
) => {
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
        const file = createTemporalFile(
          `${global.paths.CPI}/${defaultFolderTmpProvision}`,
          'yaml',
          content
        )
        if (file && file.name && file.path) {
          const paramsCommand = [
            'create',
            file.path,
            ...authCommand,
            ...endpoint,
          ]
          const executedCommand = executeCommand(
            defaultCommandProvisionTemplate,
            paramsCommand,
            getSpecificConfig('oneprovision_prepend_command')
          )
          res.locals.httpCode = httpResponse(internalServerError)
          if (
            executedCommand &&
            executedCommand.success &&
            executedCommand.data
          ) {
            res.locals.httpCode = httpResponse(ok, executedCommand.data)
          }
          removeFile(file.path)
          next()

          return
        }
      }
    } else {
      const errors = []
      if (valSchema && valSchema.errors) {
        valSchema.errors.forEach((error) => {
          errors.push(error.stack.replace(/^instance./, ''))
        })
        rtn = httpResponse(internalServerError, '', errors.toString())
      }
    }
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Instantiate provision template.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const instantiateProvisionTemplate = (
  res = {},
  next = () => undefined,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.id && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const endpoint = getEndpoint()
    const paramsCommand = [
      'instantiate',
      `${params.id}`.toLowerCase(),
      ...authCommand,
      ...endpoint,
    ]
    const executedCommand = executeCommand(
      defaultCommandProvisionTemplate,
      paramsCommand,
      getSpecificConfig('oneprovision_prepend_command')
    )
    try {
      const response = executedCommand.success ? ok : internalServerError
      res.locals.httpCode = httpResponse(
        response,
        JSON.parse(executedCommand.data)
      )
      next()

      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Update provision template.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const updateProvisionTemplate = (
  res = {},
  next = () => undefined,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.resource && params.id && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const endpoint = getEndpoint()
    const schemaValidator = new Validator()
    const resource = parsePostData(params.resource)
    const valSchema = schemaValidator.validate(resource, provider)
    if (valSchema.valid) {
      const content = createYMLContent(resource)
      if (content) {
        const file = createTemporalFile(
          `${global.paths.CPI}/${defaultFolderTmpProvision}`,
          'yaml',
          content
        )
        if (file && file.name && file.path) {
          const paramsCommand = [
            'update',
            params.id,
            file.path,
            ...authCommand,
            ...endpoint,
          ]
          const executedCommand = executeCommand(
            defaultCommandProvisionTemplate,
            paramsCommand,
            getSpecificConfig('oneprovision_prepend_command')
          )
          res.locals.httpCode = httpResponse(internalServerError)
          if (
            executedCommand &&
            executedCommand.success &&
            executedCommand.data
          ) {
            res.locals.httpCode = httpResponse(ok, executedCommand.data)
          }
          removeFile(file.path)
          next()

          return
        }
      }
    } else {
      const errors = []
      if (valSchema && valSchema.errors) {
        valSchema.errors.forEach((error) => {
          errors.push(error.stack.replace(/^instance./, ''))
        })
        rtn = httpResponse(internalServerError, '', errors.toString())
      }
    }
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Delete provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const deleteProvisionTemplate = (
  res = {},
  next = () => undefined,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  let rtn = httpInternalError
  if (params && params.id && user && password) {
    const authCommand = ['--user', user, '--password', password]
    const endpoint = getEndpoint()
    const paramsCommand = [
      'delete',
      `${params.id}`.toLowerCase(),
      ...authCommand,
      ...endpoint,
    ]
    const executedCommand = executeCommand(
      defaultCommandProvisionTemplate,
      paramsCommand,
      getSpecificConfig('oneprovision_prepend_command')
    )
    try {
      const response = executedCommand.success ? ok : internalServerError
      res.locals.httpCode = httpResponse(
        response,
        JSON.parse(executedCommand.data)
      )
      next()

      return
    } catch (error) {
      rtn = httpResponse(internalServerError, '', executedCommand.data)
    }
  }
  res.locals.httpCode = rtn
  next()
}

const provisionTemplateFunctionsApi = {
  getListProvisionTemplates,
  createProvisionTemplate,
  instantiateProvisionTemplate,
  updateProvisionTemplate,
  deleteProvisionTemplate,
}
module.exports = provisionTemplateFunctionsApi
