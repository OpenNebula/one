/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
    path: '/provisions/{0}',
    user,
    password,
    request: params.id,
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
  const { extended: includedProvider } = params
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

  if (includedProvider) {
    config.query = { include_provider: includedProvider }
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
    path: '/provisions/{0}/logs' + (params?.all && '?all={1}'),
    user,
    password,
    request: [params.id, params?.all],
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
      path: '/provisions/{0}',
      user,
      password,
      request: params.id,
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
  const force = params.force === true || params.force === 'true'

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
    path: '/provisions/{0}',
    user,
    password,
    request: params.id,
    query: {
      ...(force && { force: true }),
    },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Recover a provision from a failed state.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionRecover = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.RECOVER]
  const force = params.force === true || params.force === 'true'

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
    path: '/provisions/{0}/recover',
    user,
    password,
    request: params.id,
    query: {
      ...(force && { force: true }),
    },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Add hosts to a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionAddHosts = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.ADD_HOSTS]

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
    path: '/provisions/{0}/hosts',
    user,
    password,
    request: params.id,
    post: {
      ...(params.amount != null && { amount: params.amount }),
      ...(params.hosts != null && { hosts: params.hosts }),
    },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Delete hosts from a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionDeleteHosts = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.DELETE_HOSTS]

  if (!user || !password || !params.id || !params.ids) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid provision or host IDs'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: '/provisions/{0}/hosts',
    user,
    password,
    request: params.id,
    query: { ids: params.ids },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Add public IPs to a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionAddPublicIps = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.ADD_PUBLIC_IPS]

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
    path: '/provisions/{0}/public-network/ips',
    user,
    password,
    request: params.id,
    post: {
      ...(params.amount != null && { amount: params.amount }),
    },
  }

  oneFormConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Delete a public IP from a provision.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const provisionDeletePublicIp = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.DELETE_PUBLIC_IP]

  if (!user || !password || !params.id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid provision ID'
    )

    return next()
  }

  if (params.ar_id == null || params.ar_id === '') {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid address range ID'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: '/provisions/{0}/public-network/ips/{1}',
    user,
    password,
    request: [params.id, params.ar_id],
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
    path: '/provisions/{0}/chmod',
    user,
    password,
    request: params.id,
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

  if (params.owner_id == null || isNaN(Number(params.owner_id))) {
    res.locals.httpCode = httpResponse(methodNotAllowed, '', 'invalid owner ID')

    return next()
  }

  if (params.group_id !== null && isNaN(Number(params.group_id))) {
    res.locals.httpCode = httpResponse(methodNotAllowed, '', 'invalid group ID')

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: '/provisions/{0}/chown',
    user,
    password,
    request: params.id,
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

  if (params.group_id == null || isNaN(Number(params.group_id))) {
    res.locals.httpCode = httpResponse(methodNotAllowed, '', 'invalid group ID')

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: '/provisions/{0}/chgrp',
    user,
    password,
    request: params.id,
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
  provisionRecover,
  provisionAddHosts,
  provisionDeleteHosts,
  provisionAddPublicIps,
  provisionDeletePublicIp,
  provisionChmod,
  provisionChown,
  provisionChgrp,
}

module.exports = provisionApi
