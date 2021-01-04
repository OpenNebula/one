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

const express = require('express')
const { defaults, httpCodes, params } = require('server/utils/constants')
const { getConfig } = require('server/utils/yml')

const appConfig = getConfig()

const {
  opennebulaConnect,
  checkIfIsARouteFunction,
  commandXML,
  checkOpennebulaCommand,
  checkMethodRouteFunction,
  responseOpennebula,
  httpResponse,
  getDataZone
} = require('../../utils')

const {
  validateResourceAndSession,
  optionalParameters,
  optionalQueries,
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
  defaultOpennebulaZones
} = defaults

const defaultZones = defaultOpennebulaZones
if (
  appConfig &&
  appConfig.one_xmlrpc &&
  Array.isArray(defaultOpennebulaZones) &&
  defaultOpennebulaZones[0] &&
  defaultOpennebulaZones[0].rpc
) {
  defaultOpennebulaZones[0].rpc = appConfig.one_xmlrpc
}

const router = express.Router()

express()

const paramsToRoutes = () =>
  Object.keys(params).reduce(
    (resources, param) => String(resources).concat(`/:${params[param]}?`),
    '/:resource?'
  )

router.all(
  paramsToRoutes(),
  [validateResourceAndSession, optionalParameters, optionalQueries],
  (req, res, next) => {
    const { internalServerError, ok, methodNotAllowed, notFound } = httpCodes
    const { method: httpMethod } = req
    res.locals.httpCode = httpResponse(internalServerError)
    const { zone } = getQueriesState()
    const zoneData = getDataZone(zone, defaultZones)
    if (zoneData) {
      const { rpc } = zoneData
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
        const { method } = getParamsState()
        const command = commandXML(
          resource,
          method,
          httpMethod === httpMethods.GET && defaultGetMethod
        )
        const getOpennebulaMethod = checkOpennebulaCommand(command, httpMethod)
        if (getOpennebulaMethod) {
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

          const updaterResponse = code => {
            if ('id' in code && 'message' in code) {
              res.locals.httpCode = code
            }
          }
          const connect = connectOpennebula(
            getUserOpennebula(),
            getPassOpennebula(),
            rpc
          )
          connect(command, getOpennebulaMethod(dataSources), (err, value) =>
            responseOpennebula(updaterResponse, err, value, response, next)
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
