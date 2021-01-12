/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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

const fs = require('fs-extra')
const params = require('./constants/params')
const { defaultTypeLog } = require('./constants/defaults')
const functionRoutes = require('../routes/api')
const { validateAuth } = require('./jwt')
const { httpResponse, getDataZone } = require('./server')
const { messageTerminal, addPrintf } = require('./general')
const { getConfig } = require('./yml')

// user config
const appConfig = getConfig()

const mode = appConfig.log || defaultTypeLog

const {
  responseOpennebula,
  opennebulaConnect,
  getMethodForOpennebulaCommand,
  commandXML,
  getAllowedQueryParams,
  getRouteForOpennebulaCommand,
  checkOpennebulaCommand
} = require('./opennebula')

const createParamsState = () => {
  const rtn = {}
  if (params && Array.isArray(params)) {
    params.forEach(param => {
      rtn[param] = null
    })
  }
  return rtn
}

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

const includeMAPSJSbyHTML = (path = '') => {
  let scripts = ''
  if (mode === defaultTypeLog) {
    fs.readdirSync(path).forEach(file => {
      if (file.match(/\w*\.js\.map+$\b/gi)) {
        scripts += `<script src="/client/${file}" type="application/json"></script>`
      }
    })
  }
  return scripts
}

const includeJSbyHTML = (path = '') => {
  let scripts = ''
  fs.readdirSync(path).forEach(file => {
    if (file.match(/\w*\.js+$\b/gi)) {
      scripts += `<script src="/client/${file}"></script>`
    }
  })
  return scripts
}

const includeCSSbyHTML = (path = '') => {
  let scripts = ''
  fs.readdirSync(path).forEach(file => {
    if (file.match(/\w*\.css+$\b/gi)) {
      scripts += `<link rel="stylesheet" href="/client/${file}"></link>`
    }
  })
  return scripts
}

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

const checkIfIsARouteFunction = (route, httpMethod) => {
  let rtn = false
  if (route && route.length) {
    const { private: functionPrivate, public: functionPublic } = functionRoutes
    const functions = [...functionPrivate, ...functionPublic]
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
  includeMAPSJSbyHTML,
  includeJSbyHTML,
  includeCSSbyHTML,
  messageTerminal,
  addPrintf,
  getRouteForOpennebulaCommand,
  getMethodForOpennebulaCommand,
  commandXML,
  checkIfIsARouteFunction,
  checkOpennebulaCommand,
  checkMethodRouteFunction,
  responseOpennebula,
  getConfig,
  httpResponse,
  getDataZone
}
