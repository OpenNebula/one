/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

const { XMLParser } = require('fast-xml-parser')
const { sprintf } = require('sprintf-js')
const { access, readFile } = require('fs-extra')
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

    // Replace {0}, {1}, ...
    rtn = rtn.replace(/{(\d+)}/g, (match, number) =>
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
    const parser = new XMLParser(defaultConfigParseXML)
    const jsonObj = parser.parse(xml)

    const result =
      jsonObj == null ||
      typeof jsonObj !== 'object' ||
      Object.keys(jsonObj)?.length <= 0
        ? ''
        : jsonObj

    rtn = [null, result]
  } catch (error) {
    rtn = [error]
  }

  // eslint-disable-next-line node/no-callback-literal
  callback(...rtn)
}

/**
 * Parse custom configuration file format.
 *
 * @param {string} fileContent - Content of the configuration file.
 * @returns {object} Parsed configuration object.
 */
const parseConfigFile = (fileContent) => {
  const lines = fileContent
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))

  const config = {}
  let inBlock = false
  let currentKey = ''
  let blockContent = []
  let blockEndMarker = ''

  lines.forEach((line) => {
    if (!line) return

    const trimLine = line?.trim()

    if (!inBlock) {
      const [key, ...rest] = trimLine.split('=')
      const value = rest.join('=').trim()

      if (key && /^[A-Za-z0-9_]+$/.test(key.trim())) {
        currentKey = key.trim()

        if (value.startsWith('[') || value.startsWith('"')) {
          blockEndMarker = value.startsWith('[') ? ']' : '"'
          if (value.endsWith(blockEndMarker) && value.length > 1) {
            config[currentKey] = value
          } else {
            inBlock = true
            blockContent = [value]
          }
        } else {
          config[currentKey] = value
        }
      }
    } else {
      blockContent.push(line)
      if (line.endsWith(blockEndMarker)) {
        config[currentKey] = blockContent.join('\n')
        inBlock = false
        currentKey = ''
        blockContent = []
      }
    }
  })

  if (inBlock && currentKey) {
    config[currentKey] = blockContent?.join('\n')
  }

  return config
}

/**
 * Parse log file to JSON.
 *
 * @param {string} logPath - Path to the log file.
 * @returns {Promise<object>} Parsed log data in JSON format.
 * @throws Will throw an error if the file cannot be read.
 */
const parseLogFile = async (logPath) => {
  // Check if the file exists
  await access(logPath)

  // Read the file
  const content = await readFile(logPath, 'utf-8')

  // Split content into lines
  const linesArray = content.split('\n').filter((line) => line.trim() !== '')

  // Map each line to the desired format
  const lines = linesArray.map((line) => {
    let level = 'debug' // Default level

    if (/\[E\]/.test(line)) level = 'error'
    else if (/\[W\]/.test(line)) level = 'warning'
    else if (/\[D\]/.test(line)) level = 'debug'
    else if (/\[I\]/.test(line)) level = 'info'

    return { level, text: line }
  })

  // Build final JSON
  return {
    meta: {
      mode: 'all',
      total_lines: lines.length,
    },
    lines,
  }
}

module.exports = {
  messageTerminal,
  addPrintf,
  checkEmptyObject,
  xml2json,
  parseConfigFile,
  parseLogFile,
}
