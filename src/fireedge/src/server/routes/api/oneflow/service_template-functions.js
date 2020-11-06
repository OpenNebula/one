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
const { role, service, action } = require('./schemas')
const { oneFlowConection } = require('./functions')
const { httpMethod } = require('server/utils/constants/defaults')
const { httpResponse, parsePostData } = require('server/utils/server')
const {
  ok,
  internalServerError,
  methodNotAllowed
} = require('server/utils/constants/http-codes')
const { returnSchemaError } = require('./functions')
const { GET, POST, DELETE, PUT } = httpMethod

const serviceTemplate = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  const success = data => {
    res.locals.httpCode = httpResponse(ok, data)
    next()
  }
  const error = data => {
    res.locals.httpCode = httpResponse(internalServerError, data && data.message)
    next()
  }
  if (user && password) {
    const config = { method: GET, path: '/service_template', user, password }
    if (params && params.id) {
      config.path = '/service_template/{0}'
      config.request = params.id
      oneFlowConection(config, success, error)
    } else {
      oneFlowConection(config, success, error)
    }
  }
}

const serviceTemplateDelete = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  const success = data => {
    res.locals.httpCode = httpResponse(ok, data)
    next()
  }
  const error = data => {
    res.locals.httpCode = httpResponse(internalServerError, data && data.message)
    next()
  }
  if (params && params.id && user && password) {
    const config = { method: DELETE, path: '/service_template/{0}', user, password, request: params.id }
    oneFlowConection(config, success, error)
  } else {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid id service template'
    )
    next()
  }
}

const serviceTemplateCreate = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  const success = data => {
    res.locals.httpCode = httpResponse(ok, data)
    next()
  }
  const error = data => {
    res.locals.httpCode = httpResponse(internalServerError, data && data.message)
    next()
  }
  if (params && params.template && user && password) {
    const v = new Validator()
    const template = parsePostData(params.template)
    v.addSchema(role, '/Role')
    const valSchema = v.validate(template, service)
    if (valSchema.valid) {
      const config = {
        method: POST,
        path: '/service_template',
        user,
        password,
        post: template
      }
      oneFlowConection(config, success, error)
    } else {
      res.locals.httpCode = httpResponse(
        internalServerError,
        '',
        `invalid schema ${returnSchemaError(valSchema.errors)}`
      )
    }
  } else {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid service json'
    )
    next()
  }
}

const serviceTemplateUpdate = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  const success = data => {
    res.locals.httpCode = httpResponse(ok, data)
    next()
  }
  const error = data => {
    res.locals.httpCode = httpResponse(internalServerError, data && data.message)
    next()
  }
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
        post: template
      }
      oneFlowConection(config, success, error)
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

const serviceTemplateAction = (res = {}, next = () => undefined, params = {}, userData = {}) => {
  const { user, password } = userData
  const success = data => {
    res.locals.httpCode = httpResponse(ok, data)
    next()
  }
  const error = data => {
    res.locals.httpCode = httpResponse(internalServerError, data && data.message)
    next()
  }
  if (params && params.id && params.template && user && password) {
    const v = new Validator()
    const template = parsePostData(params.template)
    const valSchema = v.validate(template, action)
    if (valSchema.valid) {
      const config = {
        method: POST,
        path: '/service_template/{0}/action',
        user,
        password,
        request: params.id,
        post: template
      }
      oneFlowConection(config, success, error)
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
  serviceTemplateAction
}
module.exports = serviceTemplateApi
