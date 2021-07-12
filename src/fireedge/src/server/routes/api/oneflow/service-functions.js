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

const { Validator } = require('jsonschema')
const { action } = require('./schemas')
const { oneFlowConection } = require('./functions')
const { httpMethod, defaultEmptyFunction } = require('server/utils/constants/defaults')
const { httpResponse, parsePostData } = require('server/utils/server')
const {
  ok,
  internalServerError,
  methodNotAllowed
} = require('server/utils/constants/http-codes')
const { returnSchemaError } = require('./functions')
const { GET, POST, DELETE } = httpMethod

/**
 * Response http when have information.
 *
 * @param {Function} next - express stepper
 * @param {object} res - response http
 * @param {string} data - data response http
 */
const success = (next = defaultEmptyFunction, res = {}, data = '') => {
  if ((next && typeof next === 'function') && (res && res.locals && res.locals.httpCode)) {
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
  if ((next && typeof next === 'function') && (res && res.locals && res.locals.httpCode)) {
    res.locals.httpCode = httpResponse(internalServerError, data && data.message)
    next()
  }
}

/**
 * Get service.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 */
const service = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const { user, password } = userData
  if (user && password) {
    const config = { method: GET, path: '/service', user, password }
    if (params && params.id) {
      config.path = '/service/{0}'
      config.request = params.id
      oneFlowConection(config, data => success(next, res, data), data => error(next, res, data))
    } else {
      oneFlowConection(config, data => success(next, res, data), data => error(next, res, data))
    }
  }
}

/**
 * Delete service.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 */
const serviceDelete = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const { user, password } = userData
  if (params && params.id && user && password) {
    const config = { method: DELETE, path: '/service/{0}', user, password, request: params.id }
    oneFlowConection(config, data => success(next, res, data), data => error(next, res, data))
  } else {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid id service'
    )
    next()
  }
}

/**
 * Add action service.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 */
const serviceAddAction = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const { user, password } = userData
  if (params && params.id && params.action && user && password) {
    const v = new Validator()
    const postAction = parsePostData(params.action)
    const valSchema = v.validate(postAction, action)
    if (valSchema.valid) { // validate if "action" is required
      const config = {
        method: POST,
        path: '/service/{0}/action',
        user,
        password,
        request: params.id,
        post: postAction
      }
      oneFlowConection(config, data => success(next, res, data), data => error(next, res, data))
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
      'invalid id service'
    )
    next()
  }
}

/**
 * Add scale service.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 */
const serviceAddScale = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const { user, password } = userData
  if (params && params.id && params.action && user && password) {
    const v = new Validator()
    const postAction = parsePostData(params.action)
    const valSchema = v.validate(postAction, action)
    if (valSchema.valid) { // validate if "action" is required
      const config = {
        method: POST,
        path: '/service/{0}/scale',
        user,
        password,
        request: params.id,
        post: postAction
      }
      oneFlowConection(config, data => success(next, res, data), data => error(next, res, data))
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
      'invalid id service'
    )
    next()
  }
}

/**
 * Add service role action.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 */
const serviceAddRoleAction = (res = {}, next = defaultEmptyFunction, params = {}, userData = {}) => {
  const { user, password } = userData
  if (params && params.role && params.id && params.action && user && password) {
    const v = new Validator()
    const postAction = parsePostData(params.action)
    const valSchema = v.validate(postAction, action)
    if (valSchema.valid) { // validate if "action" is required
      const config = {
        method: POST,
        path: '/service/{0}/role/{1}',
        user,
        password,
        request: [params.role, params.id],
        post: postAction
      }
      oneFlowConection(config, data => success(next, res, data), data => error(next, res, data))
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
      'invalid action, id service or role'
    )
    next()
  }
}

const serviceApi = {
  service,
  serviceDelete,
  serviceAddAction,
  serviceAddScale,
  serviceAddRoleAction
}
module.exports = serviceApi
