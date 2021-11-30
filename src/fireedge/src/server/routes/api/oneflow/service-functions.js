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
const { oneFlowConnection } = require('./functions')
const {
  httpMethod,
  defaultEmptyFunction,
} = require('server/utils/constants/defaults')
const { httpResponse, parsePostData } = require('server/utils/server')
const {
  ok,
  internalServerError,
  methodNotAllowed,
} = require('server/utils/constants/http-codes')
const { returnSchemaError } = require('./functions')
const { generateNewResourceTemplate } = require('server/utils/opennebula')
const { Actions: ActionVM } = require('server/utils/constants/commands/vm')
const { GET, POST, DELETE } = httpMethod

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
      data && data.message
    )
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
const service = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  if (user && password) {
    const config = { method: GET, path: '/service', user, password }
    if (params && params.id) {
      config.path = '/service/{0}'
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
 * Delete service.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 */
const serviceDelete = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  if (params && params.id && user && password) {
    const config = {
      method: DELETE,
      path: '/service/{0}',
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
const serviceAddAction = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  if (params && params.id && params.action && user && password) {
    const v = new Validator()
    const postAction = parsePostData(params.action)
    const valSchema = v.validate(postAction, action)
    if (valSchema.valid) {
      // validate if "action" is required
      const config = {
        method: POST,
        path: '/service/{0}/action',
        user,
        password,
        request: params.id,
        post: postAction,
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
const serviceAddScale = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  if (params && params.id && params.action && user && password) {
    const v = new Validator()
    const postAction = parsePostData(params.action)
    const valSchema = v.validate(postAction, action)
    if (valSchema.valid) {
      // validate if "action" is required
      const config = {
        method: POST,
        path: '/service/{0}/scale',
        user,
        password,
        request: params.id,
        post: postAction,
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
const serviceAddRoleAction = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { user, password } = userData
  if (params && params.role && params.id && params.action && user && password) {
    const v = new Validator()
    const postAction = parsePostData(params.action)
    const valSchema = v.validate(postAction, action)
    if (valSchema.valid) {
      // validate if "action" is required
      const config = {
        method: POST,
        path: '/service/{0}/role/{1}',
        user,
        password,
        request: [params.role, params.id],
        post: postAction,
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
      'invalid action, id service or role'
    )
    next()
  }
}

/**
 * Get service info.
 *
 * @param {string} user - username
 * @param {string} password - password
 * @param {string} serviceID - service ID
 * @param {Function} success - callback when have service info data
 * @param {Function} error - callback when no have service info data
 */
const getNodesService = (
  user = '',
  password = '',
  serviceID = 0,
  success = defaultEmptyFunction,
  error = defaultEmptyFunction
) => {
  if (user && password && serviceID) {
    const config = {
      method: GET,
      path: '/service/{0}',
      user,
      password,
      request: serviceID,
    }
    oneFlowConnection(
      config,
      (serviceData = {}) => {
        const vms = []
        if (
          serviceData &&
          serviceData.DOCUMENT &&
          serviceData.DOCUMENT.TEMPLATE &&
          serviceData.DOCUMENT.TEMPLATE.BODY &&
          serviceData.DOCUMENT.TEMPLATE.BODY.roles
        ) {
          let roles = serviceData.DOCUMENT.TEMPLATE.BODY.roles
          roles = Array.isArray(roles) ? roles : [roles]
          roles.forEach((role) => {
            if (role && role.nodes) {
              let nodes = role.nodes
              nodes = Array.isArray(nodes) ? nodes : [nodes]
              const filteredNodes = nodes.filter(
                (node) => node && node.deploy_id >= 0
              )
              vms.push(...filteredNodes)
            }
          })
        }
        vms.forEach((vm = {}, index) => {
          success(vm, vms.length, index + 1)
        })
      },
      error
    )
  } else {
    error()
  }
}

/**
 * Parse schedule action to string.
 *
 * @param {string} schedAction - schedule action to parse
 * @returns {string} scheduleAction
 */
const parseSchedActionsToString = (schedAction = '') => {
  const wrapper = 'SCHED_ACTION=[%1$s]'
  let rtn = ''
  try {
    const parsedSchedAction = JSON.parse(schedAction)
    if (Array.isArray(parsedSchedAction)) {
      rtn = parsedSchedAction
        .map((action) => generateNewResourceTemplate({}, action, [], wrapper))
        .join(' ')
    } else if (typeof parsedSchedAction === 'object') {
      rtn = generateNewResourceTemplate({}, parsedSchedAction, [], wrapper)
    } else {
      rtn = schedAction
    }
  } catch (err) {
    rtn = schedAction
  }

  return rtn
}

/**
 * Add schedule action in service.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @param {Function} oneConnection - xmlrpc connection
 */
const serviceAddSchedAction = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const { user, password } = userData
  if (params && params.id && params.sched_action && user && password) {
    const schedTemplate = parseSchedActionsToString(params.sched_action)
    const nodesUpdated = []
    getNodesService(
      user,
      password,
      params.id,
      (node = {}, nodesLength, index) => {
        const oneConnect = oneConnection(user, password)
        oneConnect(
          ActionVM.VM_SCHED_ADD,
          [node.deploy_id, schedTemplate],
          (err, value) => {
            if (!err && !isNaN(value)) {
              nodesUpdated.push(node.deploy_id)
            }
            if (nodesLength === index) {
              success(next, res, nodesUpdated)
            }
          },
          false
        )
      },
      (data = '') => error(next, res, data)
    )
  } else {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid id service or sched_action template'
    )
    next()
  }
}

/**
 * Update Schedule action in template.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @param {Function} oneConnection - xmlrpc connection
 */
const serviceUpdateSchedAction = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const { user, password } = userData
  if (
    params &&
    params.id &&
    params.id_sched &&
    params.sched_action &&
    user &&
    password
  ) {
    const schedTemplate = parseSchedActionsToString(params.sched_action)
    const nodesUpdated = []
    getNodesService(
      user,
      password,
      params.id,
      (node = {}, nodesLength, index) => {
        const oneConnect = oneConnection(user, password)
        oneConnect(
          ActionVM.VM_SCHED_UPDATE,
          [node.deploy_id, parseInt(params.id_sched, 10), schedTemplate],
          (err, value) => {
            if (!err && !isNaN(value)) {
              nodesUpdated.push(node.deploy_id)
            }
            if (nodesLength === index) {
              success(next, res, nodesUpdated)
            }
          },
          false
        )
      },
      (data = '') => error(next, res, data)
    )
  } else {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid id service, id sched action or sched_action template'
    )
    next()
  }
}

/**
 * Delete Schedule action in template.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params
 * @param {object} userData - user data
 * @param {Function} oneConnection - xmlrpc connection
 */
const serviceDeleteSchedAction = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  oneConnection = defaultEmptyFunction
) => {
  const { user, password } = userData
  if (params && params.id && params.id_sched && user && password) {
    const nodesUpdated = []
    getNodesService(
      user,
      password,
      params.id,
      (node = {}, nodesLength, index) => {
        const oneConnect = oneConnection(user, password)
        oneConnect(
          ActionVM.VM_SCHED_DELETE,
          [node.deploy_id, parseInt(params.id_sched, 10)],
          (err, value) => {
            if (!err && !isNaN(value)) {
              nodesUpdated.push(node.deploy_id)
            }
            if (nodesLength === index) {
              success(next, res, nodesUpdated)
            }
          },
          false
        )
      },
      (data = '') => error(next, res, data)
    )
  } else {
    res.locals.httpCode = httpResponse(
      methodNotAllowed,
      '',
      'invalid id service or id sched action'
    )
    next()
  }
}

const serviceApi = {
  service,
  serviceDelete,
  serviceAddAction,
  serviceAddScale,
  serviceAddRoleAction,
  serviceAddSchedAction,
  serviceUpdateSchedAction,
  serviceDeleteSchedAction,
}
module.exports = serviceApi
