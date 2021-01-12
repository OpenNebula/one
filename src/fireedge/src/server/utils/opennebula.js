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

const upcast = require('upcast')
const { parse } = require('url')
const rpc = require('xmlrpc')
const xml2js = require('xml2js')
const { Map } = require('immutable')
const { sprintf } = require('sprintf-js')
const speakeasy = require('speakeasy')
const httpCodes = require('./constants/http-codes')
const commandsParams = require('./constants/commands')
const {
  from,
  defaultNamespace,
  defaultMessageProblemOpennebula
} = require('./constants/defaults')

// user config
const { getConfig } = require('./yml')

const appConfig = getConfig()
const namespace = appConfig.namespace || defaultNamespace

const opennebulaConnect = (username = '', password = '', path = '') => {
  let rtn = () => null
  if (username && password && path) {
    let xmlClient = null
    const parsedHostname = parse(path)
    const protocol = parsedHostname.protocol
    if (protocol === 'https:') {
      xmlClient = rpc.createSecureClient(path)
    } else {
      xmlClient = rpc.createClient(path)
    }
    if (xmlClient && xmlClient.methodCall) {
      rtn = (action = '', parameters = [], callback = () => undefined) => {
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
                        callback(undefined, errorData[0].STRING)
                      }
                    }
                  }
                )
                return
              } else if (value && value[0] && value[1]) {
                const messageCall = value[1]
                if (typeof messageCall === 'string' && messageCall.length > 0) {
                  xml2js.parseString(
                    messageCall,
                    configParseXML,
                    (error, result) => {
                      if (error) {
                        callback(error, undefined) // error parse xml
                        return
                      }
                      callback(
                        undefined,
                        error === null && result === null ? messageCall : result
                      ) // success
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

const commandXML = (resource = '', method = '', defaultMethod = '') => {
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

const getRouteForOpennebulaCommand = () => {
  const rtn = []
  if (commandsParams) {
    const commands = Object.keys(commandsParams)
    commands.forEach(command => {
      if (command && command.length) {
        let commandString = command.split('.')
        commandString = commandString[0]
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

const paramsDefaultByCommandOpennebula = (command = '', httpCode = '') => {
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

const generateNewTemplate = (
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

const check2Fa = (secret = '', token = '') => {
  let rtn = false
  if (secret && token) {
    rtn = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token
    })
  }
  return rtn
}

module.exports = {
  opennebulaConnect,
  responseOpennebula,
  getMethodForOpennebulaCommand,
  commandXML,
  getAllowedQueryParams,
  getRouteForOpennebulaCommand,
  checkPositionInDataSource,
  checkOpennebulaCommand,
  paramsDefaultByCommandOpennebula,
  generateNewTemplate,
  check2Fa
}
