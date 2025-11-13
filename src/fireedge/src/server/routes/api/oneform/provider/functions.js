/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
  Commands,
  Actions,
} = require('server/routes/api/oneform/provider/routes')
const { providerSchema } = require('server/routes/api/oneform/schemas')
const { Validator } = require('jsonschema')

const { defaults, httpCodes } = require('server/utils/constants')
const { httpResponse, parsePostData } = require('server/utils/server')
const { defaultEmptyFunction } = defaults
const { ok, internalServerError, methodNotAllowed } = httpCodes

const {
  oneFormConnection,
  returnSchemaError,
} = require('server/routes/api/oneform/utils')

/**
 * Response http when have information.
 *
 * @param {Function} next - express stepper
 * @param {object} res - response http
 * @param {object} res.locals - response http vars locals
 * @param {object} res.locals.httpCode - response http vars locals http code
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
 * @param {object} res.locals - response http vars locals
 * @param {object} res.locals.httpCode - response http vars locals http code
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
      data && (data?.response?.data ? data.response.data : data?.message)
    )
    next()
  }
}

/**
 * Get a provider.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {object} - A provider
 */
const provider = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.SHOW]

  if (!user || !password) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'missing credentials'
    )

    return next()
  }

  if (!params.id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid provider ID'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.path,
    user,
    password,
    request: { id: params.id },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Get list of providers.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {Array} - List of providers
 */
const providers = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.LIST]

  if (!user || !password) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'missing credentials'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.path,
    user,
    password,
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Create a provider.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const providerCreate = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.CREATE]

  if (!user || !password || !params.template) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      'Invalid provider json',
      `Invalid provider json: received params: ${JSON.stringify(params)}`
    )

    return next()
  }

  // Validate schema
  const v = new Validator()
  const template = parsePostData(params.template)

  v.addSchema(providerSchema, '/Provider')
  const valSchema = v.validate(template, providerSchema)

  if (!valSchema.valid) {
    res.locals.httpCode = httpResponse(
      internalServerError,
      'Invalid schema',
      `Invalid schema: ${returnSchemaError(
        valSchema.errors
      )}, Received template: ${JSON.stringify(template)}`
    )

    return next()
  }

  // Try to create the provider
  try {
    const config = {
      method: command.httpMethod,
      path: command.path,
      user,
      password,
      post: template,
    }

    oneFormConnection(
      config,
      (data) => success(next, res, data),
      (data) => error(next, res, data)
    )
  } catch (err) {
    res.locals.httpCode = httpResponse(
      internalServerError,
      'Error in provider creation',
      `Unexpected error occurred: ${error.message}`
    )
  }
}

/**
 * Update a provider.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const providerUpdate = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.UPDATE]

  if (!user || !password || !params.template) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      'Invalid provider json',
      `Invalid provider json: received params: ${JSON.stringify(params)}`
    )

    return next()
  }

  try {
    const template = parsePostData(params.template)
    const config = {
      method: command.httpMethod,
      path: command.path,
      user,
      password,
      request: { id: params.id },
      post: template,
    }

    oneFormConnection(
      config,
      (data) => success(next, res, data),
      (data) => error(next, res, data)
    )
  } catch (err) {
    res.locals.httpCode = httpResponse(
      internalServerError,
      'Error in provider update',
      `Unexpected error occurred: ${error.message}`
    )
  }
}

/**
 * Delete a provider.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const providerDelete = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.DELETE]

  if (!user || !password || !params.id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid provider ID'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.path,
    user,
    password,
    request: { id: params.id },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Chmod a provider.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const providerChmod = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.CHMOD]

  if (!user || !password || !params.id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid provider ID'
    )

    return next()
  }

  if (!params.octet) {
    res.locals.httpCode = httpResponse(methodNotAllowed, '', 'invalid octet')

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.path,
    user,
    password,
    request: { id: params.id },
    post: { octet: params.octet },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Chown a provider.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const providerChown = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.CHOWN]

  if (!user || !password || !params.id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid provider ID'
    )

    return next()
  }

  if (
    params.owner_id == null ||
    isNaN(Number(params.owner_id)) ||
    Number(params.owner_id) < 0
  ) {
    res.locals.httpCode = httpResponse(methodNotAllowed, '', 'invalid owner ID')

    return next()
  }

  if (
    params.group_id !== null &&
    (isNaN(Number(params.group_id)) || Number(params.group_id) < 0)
  ) {
    res.locals.httpCode = httpResponse(methodNotAllowed, '', 'invalid group ID')

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.path,
    user,
    password,
    request: { id: params.id },
    post: {
      owner_id: params.owner_id,
      ...(params.group_id && { group_id: params.group_id }),
    },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Chgrp a provider.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const providerChgrp = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.CHGRP]

  if (!user || !password || !params.id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid provider ID'
    )

    return next()
  }

  if (
    params.group_id == null ||
    isNaN(Number(params.group_id)) ||
    Number(params.group_id) < 0
  ) {
    res.locals.httpCode = httpResponse(methodNotAllowed, '', 'invalid group ID')

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.path,
    user,
    password,
    request: { id: params.id },
    post: { group_id: params.group_id },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

const providerApi = {
  provider,
  providers,
  providerCreate,
  providerUpdate,
  providerDelete,
  providerChmod,
  providerChown,
  providerChgrp,
}

module.exports = providerApi
