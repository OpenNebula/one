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

const { resolve } = require('path')
const { parse } = require('yaml')
const { defaultConfigFile } = require('./constants/defaults')
const { existsFile } = require('server/utils/server')
const { messageTerminal } = require('server/utils/general')
const { global } = require('window-or-global')

/**
 * Get fireedge configurations.
 *
 * @returns {object} fireedge configurations
 */
const getConfig = () => {
  let rtn = {}
  const pathfile = global.FIREEDGE_CONFIG || resolve(__dirname, '../', '../', '../', 'etc', defaultConfigFile)
  if (pathfile) {
    existsFile(pathfile, filedata => {
      rtn = parse(filedata)
    }, err => {
      const config = {
        color: 'red',
        message: 'Error: %s',
        error: err.message || ''
      }
      messageTerminal(config)
    })
  }
  return rtn
}

module.exports = {
  getConfig
}
