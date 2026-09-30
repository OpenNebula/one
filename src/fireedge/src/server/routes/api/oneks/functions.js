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

const { Commands, Actions } = require('server/routes/api/oneks/routes')
const { defaults, httpCodes } = require('server/utils/constants')
const { httpResponse, parsePostData } = require('server/utils/server')
const {
  oneKsSchema,
  oneKsDeploymentSchema,
  oneKsScaleNodeGroupSchema,
  oneKsCreateNodeGroupSchema,
} = require('server/routes/api/oneks/schemas')
const { Validator } = require('jsonschema')
const { defaultEmptyFunction } = defaults
const { ok, internalServerError, methodNotAllowed } = httpCodes

const {
  oneKsConnection,
  returnSchemaError,
} = require('server/routes/api/oneks/utils')

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
 * Get clusters list of oneks.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {any} _ - unused parameter
 * @param {object} userData - user data
 * @returns {Array} - List of oneks
 */
const clusters = (res = {}, next = defaultEmptyFunction, _, userData = {}) => {
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
    path: command.apiPath,
    user,
    password,
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Get the OneKS application catalogue.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {boolean} [params.all] - include internal components
 * @param {string|number} [params.cluster_id] - cluster for installability
 * @param {object} userData - user data
 * @returns {Array} - List of OneKS applications
 */
const applications = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.LIST_APPLICATIONS]

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
    path: command.apiPath,
    user,
    password,
  }

  const queryParams = {
    ...(params.all !== undefined && { all: params.all }),
    ...(params.cluster_id !== undefined && { cluster_id: params.cluster_id }),
  }

  if (Object.keys(queryParams).length > 0) config.query = queryParams

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Get a complete OneKS application definition.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {string} params.application_id - catalogue application ID
 * @param {string|number} [params.cluster_id] - cluster for installability
 * @param {object} userData - user data
 * @returns {object} - OneKS application definition
 */
const application = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.SHOW_APPLICATION]

  if (!user || !password) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'missing credentials'
    )

    return next()
  }

  if (!params.application_id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'missing application id'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: params.application_id,
  }

  if (params.cluster_id !== undefined) {
    config.query = { cluster_id: params.cluster_id }
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Get applications installed in a OneKS cluster.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {string|number} params.id - cluster ID
 * @param {boolean} [params.all] - include dependency applications
 * @param {object} userData - user data
 * @returns {Array} - Installed OneKS applications
 */
const clusterApplications = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.LIST_CLUSTER_APPLICATIONS]

  if (!user || !password || !params.id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'missing credentials or cluster id'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: params.id,
  }

  if (params.all === true || params.all === 'true') {
    config.query = { all: true }
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Get an installed application release in a OneKS cluster.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {string|number} params.id - cluster ID
 * @param {string} params.release_name - installed release name
 * @param {object} userData - user data
 * @returns {object} Installed application release
 */
const clusterApplication = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.SHOW_CLUSTER_APPLICATION]

  if (!user || !password || !params.id || !params.release_name) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'missing credentials, cluster id or release name'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: [params.id, params.release_name],
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Install a catalogue application in a OneKS cluster.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {string|number} params.id - cluster ID
 * @param {object|string} params.template - installation attributes
 * @param {object} userData - user data
 * @returns {void}
 */
const installApplication = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.INSTALL_APPLICATION]

  if (!user || !password || !params.id || !params.template) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'missing credentials, cluster id or application attributes'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: params.id,
    post: params.template,
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Delete an installed application release from a OneKS cluster.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {string|number} params.id - cluster ID
 * @param {string} params.release_name - installed release name
 * @param {object} userData - user data
 * @returns {void}
 */
const deleteClusterApplication = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.DELETE_CLUSTER_APPLICATION]

  if (!user || !password || !params.id || !params.release_name) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'missing credentials, cluster id or release name'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: [params.id, params.release_name],
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Get clusters families list of oneks.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {any} _ - unused parameter
 * @param {object} userData - user data
 * @returns {Array} - List of oneks
 */
const clustersFamilies = (
  res = {},
  next = defaultEmptyFunction,
  _,
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.LIST_FAMILIES]

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
    path: command.apiPath,
    user,
    password,
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Get a oneks cluster.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {string|number} params.id - cluster ID
 * @param {boolean} [params.expand] - expand cluster references
 * @param {object} userData - user data
 * @returns {object} - A oneks cluster
 */
const cluster = (
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
      'missing cluster id'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: params.id,
  }

  if (params.expand !== undefined) config.query = { expand: params.expand }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Get a oneks cluster family.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {object} - A oneks cluster family
 */
const clusterFamily = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.SHOW_FAMILY]

  if (!user || !password) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'missing credentials'
    )

    return next()
  }

  if (!params.name) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'missing cluster family name'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: params.name,
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Get nodegroup families list of oneks.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {any} _ - unused parameter
 * @param {object} userData - user data
 * @returns {Array} - List of oneks
 */
const nodegroupFamilies = (
  res = {},
  next = defaultEmptyFunction,
  _,
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.LIST_NODEGROUP_FAMILIES]

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
    path: command.apiPath,
    user,
    password,
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Validate a OneKS deployment placement.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const validateClusterDeployment = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.VALIDATE_DEPLOYMENT]

  if (!user || !password || !params.template) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      'Invalid OneKS deployment json',
      `Invalid OneKS deployment json: received params: ${JSON.stringify(
        params
      )}`
    )

    return next()
  }

  const v = new Validator()
  const template = parsePostData(params.template)

  v.addSchema(oneKsDeploymentSchema, '/OneKsDeployment')
  const valSchema = v.validate(template, oneKsDeploymentSchema)

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

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    post: params.template,
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Create a oneks cluster.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const create = (
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
      'Invalid OneKs json',
      `Invalid OneKs json: received params: ${JSON.stringify(params)}`
    )

    return next()
  }

  // Validate schema
  const v = new Validator()
  const template = parsePostData(params.template)

  v.addSchema(oneKsSchema, '/Oneks')
  v.addSchema(oneKsDeploymentSchema, '/OneKsDeployment')
  const valSchema = v.validate(template, oneKsSchema)

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
      path: command.apiPath,
      user,
      password,
      post: params.template,
    }

    oneKsConnection(
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
 * Delete a cluster.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const clusterDelete = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.DELETE]

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
      'missing cluster id'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: params?.force ? `${command.apiPath}?force=true` : command.apiPath,
    user,
    password,
    request: params.id,
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Get a oneks cluster kubernetes config.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {object} - A oneks cluster endpoint
 */
const clusterKubeconfig = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.KUBECONFIG]

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
      'missing cluster id'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: params.id,
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Get a oneks cluster endpoint.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {object} - A oneks cluster endpoint
 */
const clusterEndpoint = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.ENDPOINT]

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
      'missing cluster id'
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: params.id,
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Get the combined event history of a OneKS cluster and its node groups.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {Array} - Cluster events
 */
const clusterHistoric = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.HISTORIC]

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
      'missing cluster id'
    )

    return next()
  }

  oneKsConnection(
    {
      method: command.httpMethod,
      path: command.apiPath,
      user,
      password,
      request: params.id,
    },
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Update a node group.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {object} - A node group updated
 */
const updateNodeGroup = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.UPDATE_NODEGROUP]

  if (
    !user ||
    !password ||
    !params.id ||
    !params.nodegroup_id ||
    !params.template
  ) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      'invalid cluster ID, node group ID or invalid template',
      `invalid cluster ID, node group ID or invalid template: received params: ${JSON.stringify(
        params
      )}`
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: [params.id, params.nodegroup_id],
    post: parsePostData(params.template),
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Create a node group.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {object} - A node group creation response
 */
const createNodeGroup = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.CREATE_NODEGROUP]

  if (!user || !password || !params.id || !params.template) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      'invalid cluster ID, or invalid template',
      `invalid cluster ID, or invalid template: received params: ${JSON.stringify(
        params
      )}`
    )

    return next()
  }

  // Validate schema
  const v = new Validator()
  const template = parsePostData(params.template)

  v.addSchema(oneKsCreateNodeGroupSchema, '/OneKsCreateNodeGroup')
  const valSchema = v.validate(template, oneKsCreateNodeGroupSchema)

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

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: params.id,
    post: params.template,
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Delete a node group.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const deleteNodeGroup = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.DELETE_NODEGROUP]

  if (!user || !password || !params.id || !params.nodegroup_id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      'invalid cluster ID or invalid Node group ID',
      `invalid cluster ID or invalid Node group ID: ${JSON.stringify(params)}`
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: [params.id, params.nodegroup_id],
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Get logs from a oneks.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {object} - Logs from oneks
 */
const oneksLogs = (
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
    path: command.apiPath,
    user,
    password,
    request: params.id,
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Scale a node group.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {object} - A node group scaling response
 */
const scaleNodeGroup = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.SCALE_NODEGROUP]

  if (
    !user ||
    !password ||
    !params.id ||
    !params.nodegroup_id ||
    !params.template
  ) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      'invalid cluster ID, node group ID or invalid template',
      `invalid cluster ID, node group ID or invalid template: ${JSON.stringify(
        params
      )}`
    )

    return next()
  }

  // Validate schema
  const v = new Validator()
  const template = parsePostData(params.template)

  v.addSchema(oneKsScaleNodeGroupSchema, '/OneKsScaleNodeGroup')
  const valSchema = v.validate(template, oneKsScaleNodeGroupSchema)

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

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: [params.id, params.nodegroup_id],
    post: params.template,
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Recover a oneks cluster.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {object} - A node group scaling response
 */
const recover = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.RECOVER]

  if (!user || !password || !params.id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      'invalid cluster ID',
      `invalid cluster ID: ${JSON.stringify(params)}`
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: [params.id],
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Recover a node group.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {object} - A node group scaling response
 */
const recoverNodeGroup = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.RECOVER_NODEGROUP]

  if (!user || !password || !params.id || !params.nodegroup_id) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      'invalid cluster ID or node group ID',
      `invalid cluster ID or node group ID: ${JSON.stringify(params)}`
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: [params.id, params.nodegroup_id],
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Chmod a oneks cluster.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {void}
 */
const oneksChmod = (
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
    path: command.apiPath,
    user,
    password,
    request: params.id,
    post: { octet: params.octet },
  }

  oneKsConnection(
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
const oneksChown = (
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
    path: command.apiPath,
    user,
    password,
    request: params.id,
    post: {
      owner_id: params.owner_id,
      ...(params.group_id && { group_id: params.group_id }),
    },
  }

  oneKsConnection(
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
const oneksChgrp = (
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
    path: command.apiPath,
    user,
    password,
    request: params.id,
    post: { group_id: params.group_id },
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

/**
 * Update a oneKs document.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {object} - A oneKs document updated
 */
const updateDocumentOneKs = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.UPDATE_DOCUMENT]

  if (!user || !password || !params.id || !params.template) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      'invalid cluster ID, node group ID or invalid template',
      `invalid cluster ID, node group ID or invalid template: received params: ${JSON.stringify(
        params
      )}`
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: params.id,
    post: params.template,
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}
/**
 * Upgrade Kubernetes version for a oneKs cluster.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @returns {object} - A oneKs document updated
 */
const upgradeKubernetesVersion = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  const command = Commands[Actions.UPGRADE_KUBERNETES_VERSION]

  if (!user || !password || !params.id || !params.template) {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      'invalid cluster ID, node group ID or invalid template',
      `invalid cluster ID, node group ID or invalid template: received params: ${JSON.stringify(
        params
      )}`
    )

    return next()
  }

  const config = {
    method: command.httpMethod,
    path: command.apiPath,
    user,
    password,
    request: params.id,
    post: params.template,
  }

  oneKsConnection(
    config,
    (data) => success(next, res, data),
    (data) => error(next, res, data)
  )
}

const oneksApi = {
  clusters,
  applications,
  application,
  clusterApplications,
  clusterApplication,
  installApplication,
  deleteClusterApplication,
  clustersFamilies,
  nodegroupFamilies,
  cluster,
  clusterFamily,
  validateClusterDeployment,
  create,
  clusterDelete,
  clusterKubeconfig,
  clusterEndpoint,
  clusterHistoric,
  createNodeGroup,
  updateNodeGroup,
  deleteNodeGroup,
  scaleNodeGroup,
  oneksLogs,
  recover,
  recoverNodeGroup,
  oneksChmod,
  oneksChown,
  oneksChgrp,
  updateDocumentOneKs,
  upgradeKubernetesVersion,
}

module.exports = oneksApi
