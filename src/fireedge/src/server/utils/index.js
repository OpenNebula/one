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

const params = require('./constants/params')
const functionRoutes = require('../routes/api')
const { validateAuth } = require('./jwt')
const { httpResponse, getDataZone } = require('./server')
const { messageTerminal, addPrintf, checkEmptyObject } = require('./general')
const { getFireedgeConfig } = require('./yml')

const {
  responseOpennebula,
  opennebulaConnect,
  getMethodForOpennebulaCommand,
  commandXMLRPC,
  getAllowedQueryParams,
  getRouteForOpennebulaCommand,
  checkOpennebulaCommand,
  fillResourceforHookConnection
} = require('./opennebula')

/**
 * Create params http request state.
 *
 * @returns {object} params state
 */
const createParamsState = () => {
  const rtn = {}
  if (params && Array.isArray(params)) {
    params.forEach(param => {
      rtn[param] = null
    })
  }
  return rtn
}

/**
 * Create Queries http request state.
 *
 * @returns {object} queries state
 */
const createQueriesState = () => {
  const rtn = {}
  const queries = getAllowedQueryParams()
  if (queries && Array.isArray(queries)) {
    queries.forEach(query => {
      rtn[query] = null
    })
  }
  return rtn
}

/**
 * Check method in route function.
 *
 * @param {object} routeFunction - data function route
 * @param {string} httpMethod - http method
 * @returns {Function} function route
 */
const checkMethodRouteFunction = (routeFunction, httpMethod = '') => {
  let rtn
  if (
    routeFunction &&
    routeFunction.httpMethod &&
    routeFunction.httpMethod === httpMethod &&
    routeFunction.action &&
    typeof routeFunction.action === 'function'
  ) {
    rtn = routeFunction.action
  }
  return rtn
}

/**
 * Check if route id a function.
 *
 * @param {string} route - route
 * @param {string} httpMethod - http method
 * @param {boolean} authenticated - user authenticated
 * @returns {object} route function
 */
const checkIfIsARouteFunction = (route, httpMethod, authenticated) => {
  let rtn = false
  if (route && route.length) {
    const { private: functionPrivate, public: functionPublic } = functionRoutes
    const functions = authenticated ? functionPrivate : functionPublic
    /**
     * Finder command.
     *
     * @param {object} rtnCommand - command to validate
     * @returns {object} command
     */
    const finderCommand = rtnCommand =>
      rtnCommand &&
      rtnCommand.endpoint &&
      rtnCommand.endpoint === route &&
      rtnCommand.httpMethod &&
      rtnCommand.httpMethod === httpMethod &&
      rtnCommand.action &&
      typeof rtnCommand.action === 'function'

    const find = functions.find(finderCommand)
    if (find) {
      rtn = find
    }
  }
  return rtn
}

module.exports = {
  validateAuth,
  createParamsState,
  getAllowedQueryParams,
  createQueriesState,
  opennebulaConnect,
  messageTerminal,
  addPrintf,
  getRouteForOpennebulaCommand,
  getMethodForOpennebulaCommand,
  commandXMLRPC,
  checkIfIsARouteFunction,
  checkOpennebulaCommand,
  checkMethodRouteFunction,
  responseOpennebula,
  getFireedgeConfig,
  httpResponse,
  getDataZone,
  checkEmptyObject,
  fillResourceforHookConnection
}
