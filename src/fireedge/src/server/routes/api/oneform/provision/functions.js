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
} = require('server/routes/api/oneform/provision/routes')
const { provisionSchema } = require('server/routes/api/oneform/schemas')
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
 * Get a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {object} - A provision
 */
const provision = (
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
      'invalid provision ID'
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
 * Get list of provisions.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {Array} - List of provisions
 */
const provisions = (
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
 * Get logs from a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {object} - Logs from provision
 */
const provisionLogs = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.LOGS]

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
      'invalid provision ID'
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
 * Create a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionCreate = (
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
      'Invalid provision json',
      `Invalid provision json: received params: ${JSON.stringify(params)}`
    )

    return next()
  }

  // Validate schema
  const v = new Validator()
  const template = parsePostData(params.template)

  v.addSchema(provisionSchema, '/Provision')
  const valSchema = v.validate(template, provisionSchema)

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

  // Try to create the provision
  try {
    const config = {
      method: command.httpMethod,
      path: command.path,
      user,
      password,
      post: params.template,
    }

    oneFormConnection(
      config,
      (data) => success(next, res, data),
      (data) => error(next, res, data)
    )
  } catch (err) {
    res.locals.httpCode = httpResponse(
      internalServerError,
      'Error in provision creation',
      `Unexpected error occurred: ${error.message}`
    )
  }
}

/**
 * Update a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionUpdate = (
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
      'Invalid provision json',
      `Invalid provision json: received params: ${JSON.stringify(params)}`
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
      'Error in provision update',
      `Unexpected error occurred: ${error.message}`
    )
  }
}

/**
 * Delete a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionDelete = (
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
      'invalid provision ID'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.path,
    user,
    password,
    request: { id: params.id },
    post: {
      ...(params.force !== undefined && { force: params.force }),
    },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Undeploy a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionUndeploy = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.UNDEPLOY]

  if (!user || !password || !params.id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid provision ID'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.path,
    user,
    password,
    request: { id: params.id },
    post: {
      ...(params.force !== undefined && { force: params.force }),
    },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Retry a provision from a failed state.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionRetry = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.RETRY]

  if (!user || !password || !params.id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid provision ID'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.path,
    user,
    password,
    request: { id: params.id },
    post: {
      ...(params.force !== undefined && { force: params.force }),
    },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Scale up or down a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {number} params.nodes - number of nodes to up or scale
 * @param {string} params.direction - up or down string
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionScaleHost = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.SCALE]

  if (!user || !password || !params.id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid provision ID'
    )

    return next()
  }

  if (params.nodes == null || isNaN(params.nodes) || Number(params.nodes) < 0) {
    res.locals.httpCode = httpResponse(methodNotAllowed, '', 'invalid nodes')

    return next()
  }

  if (params.direction == null || !['up', 'down'].includes(params.direction)) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid direction'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.path,
    user,
    password,
    request: { id: params.id },
    post: {
      direction: params.direction,
      nodes: params.nodes,
    },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Add IP to a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionAddIp = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.ADD_IP]

  if (!user || !password || !params.id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid provision ID'
    )

    return next()
  }

  if (!params.amount) {
    res.locals.httpCode = httpResponse(methodNotAllowed, '', 'invalid amount')

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.path,
    user,
    password,
    request: { id: params.id },
    post: {
      amount: params.amount,
    },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Remove IP from a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionRemoveIp = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.REMOVE_IP]

  if (!user || !password || !params.id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid provision ID'
    )

    return next()
  }

  if (!params.ar_id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid address range ID'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.path,
    user,
    password,
    request: { id: params.id },
    post: {
      ar_id: params.ar_id,
    },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Chmod a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionChmod = (
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
      'invalid provision ID'
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
 * Chown a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionChown = (
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
      'invalid provision ID'
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
 * Chgrp a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionChgrp = (
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
      'invalid provision ID'
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

const provisionApi = {
  provision,
  provisionLogs,
  provisions,
  provisionCreate,
  provisionUpdate,
  provisionDelete,
  provisionUndeploy,
  provisionRetry,
  provisionScaleHost,
  provisionAddIp,
  provisionRemoveIp,
  provisionChmod,
  provisionChown,
  provisionChgrp,
}

module.exports = provisionApi
