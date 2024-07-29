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

const { parse: xmlParse } = require('fast-xml-parser')
const { sprintf } = require('sprintf-js')

const { defaults } = require('server/utils/constants')

const { defaultEmptyFunction, defaultConfigParseXML } = defaults

/**
 * Message in CLI (console.log).
 *
 * @param {object} config - message config: {color,error, message}
 * @param {string} config.color - color
 * @param {string} config.error - error mesage
 * @param {string} config.message - formar error
 */
const messageTerminal = ({ color = 'red', error = '', message = '%s' }) => {
  const reset = '\x1b[0m'
  let consoleColor = ''
  switch (color) {
    case 'green':
      consoleColor = '\x1b[32m'
      break
    case 'yellow':
      consoleColor = '\x1b[33m'
      break
    default:
      consoleColor = '\x1b[31m'
      break
  }
  console.log(consoleColor, sprintf(message, error), reset)
}

/**
 * Printf.
 *
 * @param {string} string - text string
 * @param {Array} args - values to replace
 * @returns {string} string with values resplaced
 */
const addPrintf = (string = '', args = '') => {
  let rtn = string
  if (string && args) {
    const replacers = Array.isArray(args) ? args : [args]
    rtn = string.replace(/{(\d+)}/g, (match, number) =>
      typeof replacers[number] !== 'undefined' ? replacers[number] : match
    )
  }

  return rtn
}

/**
 * Check of object is empty.
 *
 * @param {object} obj - object to evaluate
 * @returns {boolean} check if object is empty
 */
const checkEmptyObject = (obj = {}) =>
  Object.keys(obj).length === 0 && obj.constructor === Object

/**
 * Parse XML to JSON.
 *
 * @param {string} xml - xml data in  string
 * @param {Function} callback - callback data
 */
const xml2json = (xml = '', callback = defaultEmptyFunction) => {
  let rtn = []
  try {
    const jsonObj = xmlParse(xml, defaultConfigParseXML)
    rtn = [null, jsonObj]
  } catch (error) {
    rtn = [error]
  }

  // eslint-disable-next-line node/no-callback-literal
  callback(...rtn)
}

module.exports = {
  messageTerminal,
  addPrintf,
  checkEmptyObject,
  xml2json,
}
