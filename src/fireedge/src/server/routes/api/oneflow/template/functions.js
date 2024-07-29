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
const { role, service } = require('server/routes/api/oneflow/schemas')
const {
  oneFlowConnection,
  returnSchemaError,
} = require('server/routes/api/oneflow/utils')
const { defaults, httpCodes } = require('server/utils/constants')
const { httpResponse, parsePostData } = require('server/utils/server')

const { httpMethod, defaultEmptyFunction } = defaults
const { ok, internalServerError, methodNotAllowed } = httpCodes
const { GET, POST, DELETE, PUT } = httpMethod

/**
 * Response http when have information.
 *
 * @param {Function} next - express stepper
 * @param {object} res - response http
 * @param {string} data - data response http
 */
const success = (next = defaultEmptyFunction, res = {}, data = '') => {
  if (
    next &&
    typeof next === 'function' &&
    res &&
    res.locals &&
    res.locals.httpCode
  ) {
    res.locals.httpCode = httpResponse(ok, data)
    next()
  }
}

/**
 * Response http when no have information.
 *
 * @param {Function} next - express stepper
 * @param {object} res - response http
 * @param {string} data - data response http
 */
const error = (next = defaultEmptyFunction, res = {}, data = '') => {
  if (
    next &&
    typeof next === 'function' &&
    res &&
    res.locals &&
    res.locals.httpCode
  ) {
    res.locals.httpCode = httpResponse(
      internalServerError,
      data && data?.response?.data
    )
    next()
  }
}

/**
 * Get service template.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 */
const serviceTemplate = (
  res = {},
  next = () => undefined,
  params = {},
  userData = {}
) => {
  const { user, password } = userData

  if (user && password) {
    const config = { method: GET, path: '/service_template', user, password }
    if (params && params.id) {
      config.path = '/service_template/{0}'
      config.request = params.id
      oneFlowConnection(
        config,
        (data) => success(next, res, data),
        (data) => error(next, res, data)
      )
    } else {
      oneFlowConnection(
        config,
        (data) => success(next, res, data),
        (data) => error(next, res, data)
      )
    }
  }
}

/**
 * Delete service template.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 */
const serviceTemplateDelete = (
  res = {},
  next = () => undefined,
  params = {},
  userData = {}
) => {
  const { user, password } = userData

  if (params && params.id && user && password) {
    const config = {
      method: DELETE,
      path: '/service_template/{0}',
      user,
      password,
      request: params.id,
    }
    oneFlowConnection(
      config,
      (data) => success(next, res, data),
      (data) => error(next, res, data)
    )
  } else {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid id service template'
    )
    next()
  }
}

/**
 * Create service template.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 */
const serviceTemplateCreate = (
  res = {},
  next = () => undefined,
  params = {},
  userData = {}
) => {
  try {
    const { user, password } = userData

    if (params && params.template && user && password) {
      const v = new Validator()
      const template = parsePostData(params.template)

      v.addSchema(role, '/Role')
      const valSchema = v.validate(template, service)

      if (valSchema.valid) {
        try {
          const config = {
            method: POST,
            path: '/service_template',
            user,
            password,
            post: template,
          }
          oneFlowConnection(
            config,
            (data) => success(next, res, data),
            (data) => error(next, res, data)
          )
        } catch (err) {
          res.locals.httpCode = httpResponse(
            internalServerError,
            'Error in service template creation',
            `Unexpected error occurred: ${error.message}`
          )
        }
      } else {
        res.locals.httpCode = httpResponse(
          internalServerError,
          'Invalid schema',
          `Invalid schema: ${returnSchemaError(
            valSchema.errors
          )}, Received template: ${JSON.stringify(template)}`
        )
        next()
      }
    } else {
      res.locals.httpCode = httpResponse(
        methodNotAllowed,
        'Invalid service json',
        `Invalid service json: Received params: ${JSON.stringify(params)}`
      )
      next()
    }
  } catch (error) {
    res.locals.httpCode = httpResponse(
      internalServerError,
      'Error in service template creation',
      `Unexpected error occurred: ${error.message}`
    )
    next()
  }
}

/**
 * Update service template.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 */
const serviceTemplateUpdate = (
  res = {},
  next = () => undefined,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  if (params && params.id && params.template && user && password) {
    const v = new Validator()
    v.addSchema(role, '/Role')
    const template = parsePostData(params.template)
    const valSchema = v.validate(template, service)
    if (valSchema.valid) {
      const config = {
        method: PUT,
        path: '/service_template/{0}',
        user,
        password,
        request: params.id,
        post: template,
      }
      oneFlowConnection(
        config,
        (data) => success(next, res, data),
        (data) => error(next, res, data)
      )
    } else {
      res.locals.httpCode = httpResponse(
        internalServerError,
        '',
        `invalid schema ${returnSchemaError(valSchema.errors)}`
      )
      next()
    }
  } else {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid service json or id'
    )
    next()
  }
}

/**
 * Add service action.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 */
const serviceTemplateAction = (
  res = {},
  next = () => undefined,
  params = {},
  userData = {}
) => {
  const { user, password } = userData

  if (params && params.id && params.action && user && password) {
    const config = {
      method: POST,
      path: '/service_template/{0}/action',
      user,
      password,
      request: params.id,
      post: { action: parsePostData(params.action) },
    }

    oneFlowConnection(
      config,
      (data) => success(next, res, data),
      (data) => error(next, res, data)
    )
  } else {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid action or id'
    )
    next()
  }
}

const serviceTemplateApi = {
  serviceTemplate,
  serviceTemplateDelete,
  serviceTemplateCreate,
  serviceTemplateUpdate,
  serviceTemplateAction,
}
module.exports = serviceTemplateApi
