/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
const upcast = require('upcast')
const {
  defaults,
  httpCodes,
  opennebulaCommands: commands,
} = require('server/utils/constants')
const {
  validateSession,
  getUserOpennebula,
  getPassOpennebula,
  getZone,
} = require('server/routes/entrypoints/Api/middlawares')
const { fillResourceforHookConnection } = require('server/utils/opennebula')
const { httpResponse, validateHttpMethod } = require('server/utils/server')
const { useWorker, parseReturnWorker } = require('server/utils/worker')
const {
  writeInLogger,
  writeInLoggerInvalidRPC,
} = require('server/utils/logger')

const {
  defaultEmptyFunction,
  defaultMessageInvalidZone,
  from: fromData,
} = defaults
const { internalServerError } = httpCodes
const { resource: fromResource, query, postBody } = fromData

/**
 * Execute Worker.
 *
 * @param {object} config - worker config.
 * @param {string} config.user - user.
 * @param {string} config.password - password.
 * @param {string} config.rpc - rpc path.
 * @param {string} config.command - command.
 * @param {any[]} config.paramsCommand - params for commands
 * @param {function():any} config.next - stepper express
 * @param {object} config.res - response express
 */
const executeWorker = ({
  user,
  password,
  rpc,
  command,
  paramsCommand,
  next,
  res,
}) => {
  writeInLoggerInvalidRPC(rpc)
  if (!(user && password && rpc && command && paramsCommand)) {
    return
  }
  const worker = useWorker()
  worker.onmessage = function (result) {
    worker.terminate()
    const err = result && result.data && result.data.err
    const value = result && result.data && result.data.value
    writeInLogger([command, paramsCommand, JSON.stringify(value)], {
      format: 'worker: %s, [%s]: %s',
      level: 2,
    })
    if (!err) {
      fillResourceforHookConnection(user, command, paramsCommand)
      res.locals.httpCode = parseReturnWorker(value)
    }
    next()
  }

  worker.postMessage({
    type: 'xmlrpc',
    config: {
      globalState: (global && global.paths) || {},
      user,
      password,
      rpc,
      command,
      paramsCommand,
    },
  })
}

/**
 * Get commands for command.
 *
 * @param {object} config - config for get params for command
 * @param {object} config.params - params command
 * @param {object} config.serverDataSource - server data source
 * @returns {any[]} - params for command
 */
const getCommandParams = (config) => {
  const { params, serverDataSource } = config
  if (!(params && serverDataSource)) {
    return
  }

  return Object.entries(params).map(([key, value]) => {
    if (!(key && value && value.from && typeof value.default !== 'undefined')) {
      return ''
    }
    // `value == null` checks against undefined and null
    if (
      serverDataSource[value.from] &&
      serverDataSource[value.from][key] != null
    ) {
      const upcastedData = upcast.to(
        serverDataSource[value.from][key],
        upcast.type(value.default)
      )

      return value.arrayDefault !== undefined && Array.isArray(upcastedData)
        ? upcastedData.map((internalValue) =>
            upcast.to(internalValue, upcast.type(value.arrayDefault))
          )
        : upcastedData
    } else {
      return value.default
    }
  })
}

/**
 * Get routes functions.
 *
 * @param {object} config - config router
 * @param {object} config.expressRouter - express router
 * @param {function(object):object} config.jsonResponser - parse to json
 */
const xmlrpcRoutes = ({
  expressRouter = {},
  jsonResponser = defaultEmptyFunction,
}) => {
  Object.keys(commands).forEach((command) => {
    const [resource, method] = command.split('.')
    const { httpMethod, params } = commands[command]
    if (resource && method && httpMethod) {
      const validHttpMethod = validateHttpMethod(httpMethod)
      if (
        validHttpMethod &&
        typeof expressRouter[validHttpMethod] === 'function'
      ) {
        const resourceParams =
          (params &&
            Object.entries(params).reduce((prev, current) => {
              const [key, value] = current
              if (value && value.from && value.from === fromResource) {
                return `${prev}/:${key}?`
              }

              return prev
            }, '')) ||
          ''
        expressRouter[validHttpMethod](
          `/${resource}/${method}${resourceParams}`,
          (req, res, next) => validateSession({ req, res, next }),
          (req, res, next) => {
            res.locals.httpCode = httpResponse(internalServerError)
            const { zone } = req.query
            const zoneData = getZone(zone)
            if (zoneData) {
              const user = getUserOpennebula()
              const password = getPassOpennebula()
              const { rpc } = zoneData

              const serverDataSource = {
                [fromResource]: req.params,
                [query]: req.query,
                [postBody]: req.body,
              }

              executeWorker({
                user,
                password,
                rpc,
                command,
                paramsCommand: getCommandParams({ params, serverDataSource }),
                next,
                res,
              })
            } else {
              res.locals.httpCode = httpResponse(
                internalServerError,
                '',
                `${internalServerError.message}: ${defaultMessageInvalidZone}`
              )
              next()
            }
          },
          jsonResponser
        )
      }
    }
  })
}

module.exports = xmlrpcRoutes
