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
/* eslint-disable indent */

const { env } = require('process')
const express = require('express')
const { resolve } = require('path')
const Worker = require('tiny-worker')
const { defaults, httpCodes, params } = require('server/utils/constants')
const { getConfig } = require('server/utils/yml')

const {
  opennebulaConnect,
  checkIfIsARouteFunction,
  commandXMLRPC,
  checkOpennebulaCommand,
  checkMethodRouteFunction,
  responseOpennebula,
  httpResponse,
  getDataZone,
  fillResourceforHookConnection
} = require('../../utils')

const { writeInLogger } = require('../../utils/logger')

const {
  validateResourceAndSession,
  setOptionalParameters,
  setOptionalQueries,
  clearStates,
  getParamsState,
  getQueriesState,
  getIdUserOpennebula,
  getUserOpennebula,
  getPassOpennebula
} = require('./middlewares')

const {
  defaultMessageInvalidZone,
  defaultGetMethod,
  httpMethod: httpMethods,
  from: fromData,
  defaultOpennebulaZones,
  defaultWebpackMode
} = defaults

const router = express.Router()

express()

/**
 * Get route parameters.
 *
 * @returns {Array} valid express route
 */
const routeParameters = () =>
  Object.keys(params).reduce(
    (resources, param) => String(resources).concat(`/:${params[param]}?`),
    '/:resource?'
  )

router.all(
  routeParameters(),
  [validateResourceAndSession, setOptionalParameters, setOptionalQueries],
  (req, res, next) => {
    const { internalServerError, ok, methodNotAllowed, notFound } = httpCodes
    const { method: httpMethod } = req
    res.locals.httpCode = httpResponse(internalServerError)
    const { zone } = getQueriesState()
    // get data zones by config file
    const appConfig = getConfig()
    if (
      appConfig.one_xmlrpc &&
      Array.isArray(defaultOpennebulaZones) &&
      defaultOpennebulaZones[0] &&
      defaultOpennebulaZones[0].rpc
    ) {
      defaultOpennebulaZones[0].rpc = appConfig.one_xmlrpc
    }
    const zoneData = getDataZone(zone, defaultOpennebulaZones)
    if (zoneData) {
      const { rpc } = zoneData
      /**
       * Instance of connection to opennebula.
       *
       * @param {string} user - opennegula user
       * @param {string} pass - opennebula pass
       * @returns {Function} opennebula executer calls to XMLRPC
       */
      const connectOpennebula = (
        user = getUserOpennebula(),
        pass = getPassOpennebula()
      ) => opennebulaConnect(user, pass, rpc)

      const { resource } = req.params
      const routeFunction = checkIfIsARouteFunction(resource, httpMethod)
      res.locals.httpCode = httpResponse(methodNotAllowed)
      const dataSources = {
        [fromData.resource]: getParamsState(),
        [fromData.query]: getQueriesState(),
        [fromData.postBody]: req.body
      }
      if (routeFunction) {
        /*********************************************************
         * This execute functions (routes)
         *********************************************************/

        const valRouteFunction = checkMethodRouteFunction(
          routeFunction,
          httpMethod
        )
        if (valRouteFunction) {
          const userIdOpennebula = getIdUserOpennebula()
          valRouteFunction(
            dataSources,
            res,
            next,
            connectOpennebula,
            userIdOpennebula,
            { id: userIdOpennebula, user: getUserOpennebula(), password: getPassOpennebula() }
          )
        } else {
          next()
        }
      } else {
        /*********************************************************
         * This execute a XMLRPC commands
         *********************************************************/

        const { method } = getParamsState()
        const command = commandXMLRPC(
          resource,
          method,
          httpMethod === httpMethods.GET && defaultGetMethod
        )
        const getOpennebulaMethod = checkOpennebulaCommand(command, httpMethod)
        if (getOpennebulaMethod) {
          /**
           * Http response.
           *
           * @param {object} val - response http code
           */
          const response = (val = {}) => {
            switch (typeof val) {
              case 'string':
                res.locals.httpCode = httpResponse(notFound, val)
                break
              case 'object':
                res.locals.httpCode = httpResponse(ok, val)
                break
              case 'number':
                res.locals.httpCode = httpResponse(ok, val)
                break
              default:
                break
            }
            next()
          }

          /**
           * Updater http response.
           *
           * @param {object} code - http code
           */
          const updaterResponse = code => {
            if ('id' in code && 'message' in code) {
              res.locals.httpCode = code
            }
          }

          //* worker thread */
          const user = getUserOpennebula()
          const paramsCommand = getOpennebulaMethod(dataSources)
          let workerPath = [__dirname]
          if (env && env.NODE_ENV === defaultWebpackMode) {
            workerPath = ['src', 'server', 'utils']
          } else {
            require('server/utils/index.worker')
          }
          const worker = new Worker(resolve(...workerPath, 'index.worker.js'))
          worker.onmessage = function (result) {
            worker.terminate()
            const err = result && result.data && result.data.err
            const value = result && result.data && result.data.value
            if (!err) {
              fillResourceforHookConnection(user, command, paramsCommand)
            }
            writeInLogger(`worker: ${command} : ${JSON.stringify(value)}`)
            responseOpennebula(updaterResponse, err, value, response, next)
          }
          worker.postMessage(
            {
              globalState: (global && global.paths) || {},
              user,
              password: getPassOpennebula(),
              rpc,
              command,
              paramsCommand
            }
          )
        } else {
          next()
        }
      }
    } else {
      res.locals.httpCode.message += `: ${defaultMessageInvalidZone}`
      next()
    }
  },
  (req, res) => {
    clearStates()
    const { httpCode } = res.locals
    res.status(httpCode.id).json(httpCode)
  }
)

module.exports = router
