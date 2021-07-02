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

// const colors = require('colors')
const { sprintf } = require('sprintf-js')

const messageTerminal = (
  {
    color = 'red',
    error = '',
    message = '%s'
  }
) => {
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

const checkEmptyObject = (obj = {}) =>
  Object.keys(obj).length === 0 && obj.constructor === Object

module.exports = {
  messageTerminal,
  addPrintf,
  checkEmptyObject
}
