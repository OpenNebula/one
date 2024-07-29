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

// eslint-disable-next-line node/no-deprecated-api
const { parse } = require('url')
const rpc = require('xmlrpc')
const { Map } = require('immutable')
const { sprintf } = require('sprintf-js')
const { global } = require('window-or-global')
const {
  httpCodes,
  opennebulaCommands,
  defaults,
} = require('server/utils/constants')
const {
  from,
  defaultEmptyFunction,
  defaultNamespace,
  defaultMessageProblemOpennebula,
  hookObjectNames,
} = defaults

const { getFireedgeConfig } = require('server/utils/yml')
const { xml2json } = require('server/utils/general')

// regex for separate the commands .info
const regexInfoAction = /^(\w+).info$/
// regex for separate string by lines
const regexLine = /\n/
// regex for remove multiple blanks
const regexRemoveBlanks = /\s+/gi
// regex for remove ANSI Color
// eslint-disable-next-line no-control-regex
const regexANSIColor = /\u001b\[.*?m/gi
// regex string with CSV format
const csvFormat =
  /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/
// regex sanitize string CSV formated
const csvSanitize =
  /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g
// regex single quote
const singleQuote = /\\'/g
// regex double quote
const doubleQuote = /\\"/g
// regex handle special case of empty last value.
const lastValueRegexCsv = /,\s*$/g
// regex text string wrapped in square brackets
const stringWrappedBrakets = /^\[.*\]$/g
// regex first and last brakets
const brakets = /(^\[)|(\]$)/g

/**
 * Authorizes if the user has access to the resource, for their connection to the HOOK.
 *
 * @param {string} username - username
 * @param {string} action - action (only valid i the action terminate in .info)
 * @param {Array} parameters - parameters of xmlrpc. If parameters[0] >=0 is a id of resource
 */
const fillResourceforHookConnection = (
  username = '',
  action = '',
  parameters = ''
) => {
  let match
  // parameters[0] is the resource ID
  if (
    username &&
    action &&
    (match = action.match(regexInfoAction)) &&
    match[1] &&
    parameters[0] >= 0
  ) {
    if (global && !global.users) {
      global.users = {}
    }
    if (!global.users[username]) {
      global.users[username] = {}
    }
    if (!global.users[username].resourcesHooks) {
      global.users[username].resourcesHooks = {}
    }

    const resourceName = match[1]
    const ensuredName = hookObjectNames[resourceName] || resourceName

    global.users[username].resourcesHooks[ensuredName] = parameters[0]
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
      rtn = ({
        action = '',
        parameters = [],
        callback = defaultEmptyFunction,
        fillHookResource = true,
        parseXML = true,
      }) => {
        if (action && Array.isArray(parameters) && callback) {
          // user config
          const appConfig = getFireedgeConfig()
          const namespace = appConfig.namespace || defaultNamespace
          const xmlParameters = [`${username}:${password}`, ...parameters]
          xmlClient.methodCall(
            `${namespace}.${action}`,
            xmlParameters,
            (err, value) => {
              const success = (data) => {
                fillHookResource &&
                  fillResourceforHookConnection(username, action, parameters)
                callback(undefined, data)
              }

              if (err?.body) {
                parseXML
                  ? xml2json(err.body, (error, result) => {
                      if (error) {
                        callback(error, undefined) // error parse xml

                        return
                      }
                      if (
                        result &&
                        result.methodResponse &&
                        result.methodResponse.fault &&
                        result.methodResponse.fault.value &&
                        result.methodResponse.fault.value.struct &&
                        result.methodResponse.fault.value.struct.member &&
                        Array.isArray(
                          result.methodResponse.fault.value.struct.member
                        )
                      ) {
                        const errorData =
                          result.methodResponse.fault.value.struct.member.find(
                            (element) => element.value && element.value.string
                          )
                        if (errorData) {
                          success(errorData.value.string)
                        }
                      }
                    })
                  : success(err.body)

                return
              } else if (value?.[0] && value?.[1]) {
                let messageCall
                if (Array.isArray(value)) {
                  messageCall = value[1]
                } else if (value.length > 0) {
                  messageCall = value
                }
                if (typeof messageCall === 'string' && messageCall.length > 0) {
                  parseXML
                    ? xml2json(messageCall, (error, result) => {
                        if (error) {
                          callback(error, undefined) // error parse xml

                          return
                        }
                        success(
                          error === null && !String(result)
                            ? JSON.stringify(messageCall)
                            : result
                        )
                      })
                    : success(messageCall)

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
  if (opennebulaCommands) {
    const commands = Object.keys(opennebulaCommands)
    commands.forEach((command) => {
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
 * Get allowed query parameters.
 *
 * @returns {Array} query parameters
 */
const getAllowedQueryParams = () => {
  const rtn = []
  const allowedQuerys = Object.keys(opennebulaCommands)
  if (from && from.query) {
    const { query } = from
    allowedQuerys.forEach((allowedQuery) => {
      const command = opennebulaCommands[allowedQuery]
      if (command && command.params) {
        const internalParams = Object.keys(command.params)
        internalParams.forEach((internalParam) => {
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
  if (opennebulaCommands) {
    const commands = Object.keys(opennebulaCommands)
    commands.forEach((command) => {
      if (command && command.length) {
        let commandString = command.split('.')
        commandString = commandString[0]

        /**
         * Finder command.
         *
         * @param {object} rtnCommand - command to validate
         * @returns {string} - command
         */
        const finderCommand = (rtnCommand) =>
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
const checkPositionInDataSource = (dataSource) => {
  let rtn = true
  if (dataSource && from) {
    const fromKeys = Object.values(from)
    fromKeys.forEach((key) => {
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
 * @returns {object|false} command opennebula
 */
const checkOpennebulaCommand = (command = '', method = '') =>
  command &&
  method &&
  opennebulaCommands &&
  opennebulaCommands[command] &&
  opennebulaCommands[command].params &&
  opennebulaCommands[command].httpMethod &&
  opennebulaCommands[command].httpMethod === method
    ? opennebulaCommands[command]
    : false

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
      defaultParams.forEach((defaultParam) => {
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
  wrapper = 'FIREEDGE=[%1$s]'
) => {
  const positions = Object.entries({ ...current, ...addPositions })
    .filter((position) => {
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

/**
 * Parse result console to string.
 *
 * @param {string} stringConsole - console string
 * @param {Array} excludeRegexs - array regexs for exclude
 * @returns {string} new console string
 */
const consoleParseToString = (stringConsole = '', excludeRegexs = []) => {
  if (!stringConsole) {
    return
  }

  const rtn = []
  stringConsole.split(regexLine).forEach((line) => {
    let pass = true
    if (Array.isArray(excludeRegexs)) {
      excludeRegexs.forEach((rex) => {
        if (rex.test(line)) {
          pass = false
        }
      })
    }
    const cleanLine = line
      .replace(regexRemoveBlanks, ' ')
      .replace(regexANSIColor, '')
      .trim()

    if (cleanLine && pass) {
      rtn.push(cleanLine)
    }
  })

  return rtn
}

/**
 * Parse array string to json.
 *
 * @param {Array} arrayConsole - result of consoleParseToString function
 * @param {string} regexHeader - regex for find header
 * @returns {any[]} console string JSON parsed
 */
const consoleParseToJSON = (arrayConsole = [], regexHeader = '') => {
  const rtn = []
  if (
    !(
      regexHeader &&
      Array.isArray(arrayConsole) &&
      arrayConsole[0] &&
      regexHeader.test(arrayConsole[0])
    )
  ) {
    return rtn
  }
  const header = arrayConsole[0].split(',')
  arrayConsole.forEach((row = '', i = 0) => {
    if (row && i > 0) {
      const explodeRow = CSVtoArray(row)
      if (Array.isArray(explodeRow)) {
        const newLine = {}
        explodeRow.forEach((value, index) => {
          newLine[header[index]] = stringWrappedBrakets.test(value)
            ? CSVtoArray(value.replace(brakets, ''))
            : value
        })
        rtn.push(newLine)
      }
    }
  })

  return rtn
}

/**
 * Parse strinf csv to array.
 *
 * @param {string} text - csv string
 * @returns {Array} csv array
 */
const CSVtoArray = (text = '') => {
  const rtn = []
  if (csvFormat.test(text)) {
    // if input string is not well formed CSV string.
    text.replace(csvSanitize, (m0, m1, m2, m3) => {
      if (m1 !== undefined) {
        rtn.push(m1.replace(singleQuote, "'"))
      } else if (m2 !== undefined) {
        rtn.push(m2.replace(doubleQuote, '"'))
      } else if (m3 !== undefined) {
        rtn.push(m3)
      }

      return ''
    })
    if (lastValueRegexCsv.test(text)) {
      rtn.push('')
    }
  }

  return rtn
}

module.exports = {
  opennebulaConnect,
  responseOpennebula,
  getMethodForOpennebulaCommand,
  getAllowedQueryParams,
  getRouteForOpennebulaCommand,
  checkPositionInDataSource,
  getDefaultParamsOfOpennebulaCommand,
  generateNewResourceTemplate,
  fillResourceforHookConnection,
  consoleParseToString,
  consoleParseToJSON,
}
