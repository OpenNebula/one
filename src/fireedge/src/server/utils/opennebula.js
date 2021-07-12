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

const upcast = require('upcast')
// eslint-disable-next-line node/no-deprecated-api
const { parse } = require('url')
const rpc = require('xmlrpc')
const xml2js = require('xml2js')
const { Map } = require('immutable')
const { sprintf } = require('sprintf-js')
const { global } = require('window-or-global')
const httpCodes = require('./constants/http-codes')
const commandsParams = require('./constants/commands')
const {
  from,
  defaultEmptyFunction,
  defaultNamespace,
  defaultMessageProblemOpennebula
} = require('./constants/defaults')

// regex for separate the commands .info
const regexInfoAction = /^(\w+).info$/

// user config
const { getConfig } = require('./yml')

const appConfig = getConfig()
const namespace = appConfig.namespace || defaultNamespace

/**
 * Authorizes if the user has access to the resource, for their connection to the HOOK.
 *
 * @param {string} username - username
 * @param {string} action - action (only valid i the action terminate in .info)
 * @param {Array} parameters - parameters of xmlrpc. If parameters[0] >=0 is a id of resource
 */
const fillResourceforHookConection = (username = '', action = '', parameters = '') => {
  let match
  // parameters[0] is the resource ID
  if (username && action && (match = action.match(regexInfoAction)) && match[1] && parameters[0] >= 0) {
    if (global && !global.users) {
      global.users = {}
    }
    if (!global.users[username]) {
      global.users[username] = {}
    }
    if (!global.users[username].resourcesHooks) {
      global.users[username].resourcesHooks = {}
    }
    global.users[username].resourcesHooks[match[1]] = parameters[0]
  }
}

/**
 * Opennebula XMLRPC function.
 *
 * @param {string} username - opennebula user
 * @param {string} password - opennebula password
 * @param {string} zoneURL - opennebula zone URL
 * @returns {Function} executer XMLRPC function
 */
const opennebulaConnect = (username = '', password = '', zoneURL = '') => {
  let rtn = defaultEmptyFunction
  if (username && password && zoneURL) {
    let xmlClient = null
    const parsedHostname = parse(zoneURL)
    const protocol = parsedHostname.protocol
    if (protocol === 'https:') {
      xmlClient = rpc.createSecureClient(zoneURL)
    } else {
      xmlClient = rpc.createClient(zoneURL)
    }
    if (xmlClient && xmlClient.methodCall) {
      rtn = (action = '', parameters = [], callback = () => undefined, fillHookResource = true) => {
        if (action && parameters && Array.isArray(parameters) && callback) {
          const xmlParameters = [`${username}:${password}`, ...parameters]
          xmlClient.methodCall(
            namespace + action,
            xmlParameters,
            (err, value) => {
              const configParseXML = {
                explicitArray: false,
                trim: true,
                normalize: true,
                includeWhiteChars: true,
                strict: false
              }

              if (err && err.body) {
                xml2js.parseString(
                  err.body,
                  configParseXML,
                  (error, result) => {
                    if (error) {
                      callback(error, undefined) // error parse xml
                      return
                    }
                    if (
                      result &&
                      result.METHODRESPONSE &&
                      result.METHODRESPONSE.PARAMS &&
                      result.METHODRESPONSE.PARAMS.PARAM &&
                      result.METHODRESPONSE.PARAMS.PARAM.VALUE &&
                      result.METHODRESPONSE.PARAMS.PARAM.VALUE.ARRAY &&
                      result.METHODRESPONSE.PARAMS.PARAM.VALUE.ARRAY.DATA &&
                      result.METHODRESPONSE.PARAMS.PARAM.VALUE.ARRAY.DATA
                        .VALUE &&
                      Array.isArray(
                        result.METHODRESPONSE.PARAMS.PARAM.VALUE.ARRAY.DATA
                          .VALUE
                      )
                    ) {
                      const errorData = result.METHODRESPONSE.PARAMS.PARAM.VALUE.ARRAY.DATA.VALUE.filter(
                        element => element.STRING
                      )
                      if (
                        Array.isArray(errorData) &&
                        errorData[0] &&
                        errorData[0].STRING
                      ) {
                        // success
                        fillHookResource && fillResourceforHookConection(username, action, parameters)
                        callback(undefined, errorData[0].STRING)
                      }
                    }
                  }
                )
                return
              } else if (value && value[0] && value[1]) {
                let messageCall
                if (Array.isArray(value) && value[0] && value[1]) {
                  messageCall = value[1]
                } else if (value.length > 0) {
                  messageCall = value
                }
                if (typeof messageCall === 'string' && messageCall.length > 0) {
                  xml2js.parseString(
                    messageCall,
                    configParseXML,
                    (error, result) => {
                      if (error) {
                        callback(error, undefined) // error parse xml
                        return
                      }
                      // success
                      fillHookResource && fillResourceforHookConection(username, action, parameters)
                      callback(
                        undefined,
                        error === null && result === null ? messageCall : result
                      )
                    }
                  )
                  return
                }
              }
              callback(err && err.message, value && value[1]) // error call opennebula
            }
          )
        }
      }
    }
  }
  return rtn
}

/**
 * Set http response.
 *
 * @param {object} res - http response
 * @param {object} err - error
 * @param {object} value - data if no has a error
 * @param {Function} response - callback function, run when has value
 * @param {Function} next - express stepper
 */
const responseOpennebula = (res, err, value, response, next) => {
  if (err && res && typeof res === 'function') {
    const { internalServerError } = httpCodes
    const codeError = Map(internalServerError).toObject()
    codeError.data = `${defaultMessageProblemOpennebula}`
    res(codeError)
    next()
  } else if (typeof response === 'function') {
    response(value)
  }
}

/**
 * Get the method valid by the opennebula command.
 *
 * @returns {Array} opennebula command
 */
const getMethodForOpennebulaCommand = () => {
  const rtn = []
  if (commandsParams) {
    const commands = Object.keys(commandsParams)
    commands.forEach(command => {
      if (command && command.length) {
        const commandString = command.split('.')
        if (!rtn.includes(commandString[1])) {
          rtn.push(commandString[1])
        }
      }
    })
  }
  return rtn
}

/**
 * Get a command to XMLRPC.
 *
 * @param {string} resource - resource
 * @param {string} method - method
 * @param {string} defaultMethod - default method
 * @returns {string} command to XMLRPC
 */
const commandXMLRPC = (resource = '', method = '', defaultMethod = '') => {
  let command = ''
  const allowedActions = getMethodForOpennebulaCommand()
  if (resource && resource.length) {
    command = `${resource}`
  }
  const commandWithDefault = defaultMethod
    ? `${command}.${defaultMethod}`
    : command
  if (typeof method === 'string' && method !== 'action') {
    command = allowedActions.includes(method)
      ? `${command}.${method}`
      : commandWithDefault
  }
  return command
}

/**
 * Get allowed query parameters.
 *
 * @returns {Array} query parameters
 */
const getAllowedQueryParams = () => {
  const rtn = []
  const allowedQuerys = Object.keys(commandsParams)
  if (from && from.query) {
    const { query } = from
    allowedQuerys.forEach(allowedQuery => {
      const command = commandsParams[allowedQuery]
      if (command && command.params) {
        const internalParams = Object.keys(command.params)
        internalParams.forEach(internalParam => {
          if (
            command.params[internalParam] &&
            command.params[internalParam].from &&
            command.params[internalParam].from === query &&
            !rtn.includes(internalParam)
          ) {
            rtn.push(internalParam)
          }
        })
      }
    })
  }
  return rtn
}

/**
 * Get route for opennebula command.
 *
 * @returns {Array} command
 */
const getRouteForOpennebulaCommand = () => {
  const rtn = []
  if (commandsParams) {
    const commands = Object.keys(commandsParams)
    commands.forEach(command => {
      if (command && command.length) {
        let commandString = command.split('.')
        commandString = commandString[0]

        /**
         * Finder command.
         *
         * @param {object} rtnCommand - command to validate
         * @returns {string} - command
         */
        const finderCommand = rtnCommand =>
          rtnCommand &&
          rtnCommand.endpoint &&
          rtnCommand.endpoint === commandString
        if (!rtn.some(finderCommand)) {
          rtn.push({ endpoint: commandString })
        }
      }
    })
  }
  return rtn
}

/**
 * Check position in data source.
 *
 * @param {object} dataSource - source data
 * @returns {boolean} check if exists
 */
const checkPositionInDataSource = dataSource => {
  let rtn = true
  if (dataSource && from) {
    const fromKeys = Object.values(from)
    fromKeys.forEach(key => {
      if (!(key && dataSource && key in dataSource)) {
        rtn = false
      }
    })
  }
  return rtn
}
/**
 * Check if http command exist in commands.js.
 *
 * @param {string} command - openenbula command
 * @param {string} method - method of opennebula command
 * @param {boolean} commandParams - commands
 * @returns {object} command opennebula
 */
const checkOpennebulaCommand = (
  command = '',
  method = '',
  commandParams = true
) => {
  let rtn = false
  if (command && method && commandsParams && from) {
    if (
      commandsParams &&
      commandsParams[command] &&
      commandsParams[command].params &&
      commandsParams[command].httpMethod &&
      commandsParams[command].httpMethod === method
    ) {
      rtn = commandParams
        ? dataSource => {
          let rtnParams = false
          if (dataSource && checkPositionInDataSource(dataSource)) {
            const { params: paramsForCommand } = commandsParams[command]
            const internalParams = []
            Object.keys(paramsForCommand).forEach(param => {
              const parameter = paramsForCommand[param]
              if (
                'default' in parameter &&
                  'from' in parameter &&
                  parameter.from in dataSource &&
                  param in dataSource[parameter.from] &&
                  dataSource[parameter.from][param]
              ) {
                internalParams.push(
                  upcast.to(
                    dataSource[parameter.from][param],
                    upcast.type(parameter.default)
                  )
                )
              } else {
                internalParams.push(parameter.default)
              }
            })
            if (internalParams) {
              rtnParams = internalParams
            }
          }
          return rtnParams
        }
        : commandsParams[command]
    }
  }
  return rtn
}

/**
 * Get default params of opennebula command.
 *
 * @param {string} command - opennebula command
 * @param {object} httpCode - http code
 * @returns {Array} array defaults of command
 */
const getDefaultParamsOfOpennebulaCommand = (command = '', httpCode = '') => {
  const rtn = []
  if (command && httpCode) {
    const getDefaultValues = checkOpennebulaCommand(command, httpCode, false)
    if (getDefaultValues && getDefaultValues.params) {
      const defaultParams = Object.keys(getDefaultValues.params)
      defaultParams.forEach(defaultParam => {
        if (
          getDefaultValues.params &&
          defaultParam &&
          getDefaultValues.params[defaultParam] &&
          'default' in getDefaultValues.params[defaultParam]
        ) {
          rtn.push(getDefaultValues.params[defaultParam].default)
        }
      })
    }
  }
  return rtn
}

/**
 * Generate a new resource template opennebula.
 *
 * @param {object} current - actual resource template
 * @param {object} addPositions - new positions of resource template
 * @param {object} removedPositions - delete positions of resource template
 * @param {string} wrapper - wrapper data of template
 * @returns {string} opennebula template
 */
const generateNewResourceTemplate = (
  current = {},
  addPositions = {},
  removedPositions = [],
  wrapper = 'SUNSTONE=[%1$s]'
) => {
  const positions = Object.entries({ ...current, ...addPositions })
    .filter(position => {
      let element = position
      if (Array.isArray(position)) {
        element = position[0]
      }
      return element && !removedPositions.includes(element)
    })
    .map(([position, value]) => `${position}=${value}`)
    .join(', ')
  return sprintf(wrapper, positions)
}

module.exports = {
  opennebulaConnect,
  responseOpennebula,
  getMethodForOpennebulaCommand,
  commandXMLRPC,
  getAllowedQueryParams,
  getRouteForOpennebulaCommand,
  checkPositionInDataSource,
  checkOpennebulaCommand,
  getDefaultParamsOfOpennebulaCommand,
  generateNewResourceTemplate
}
