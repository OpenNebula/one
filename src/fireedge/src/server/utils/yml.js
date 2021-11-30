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

const { env } = require('process')
const { resolve } = require('path')
const { parse } = require('yaml')
const {
  defaultConfigFile,
  defaultWebpackMode,
  defaultSunstoneConfig,
  defaultProvisionConfig,
  defaultEmptyFunction,
} = require('./constants/defaults')
const { existsFile, defaultError } = require('server/utils/server')
const { messageTerminal } = require('server/utils/general')
const { global } = require('window-or-global')

const defaultPath =
  env && env.NODE_ENV === defaultWebpackMode ? ['../', '../', '../'] : ['../']
const basePaths = [__dirname, ...defaultPath, 'etc']

/**
 * Get fireedge configurations.
 *
 * @param {string} pathfile - path config file
 * @param {Function} errorFunction - callback error
 * @returns {object} fireedge configurations
 */
const readYAMLFile = (pathfile = '', errorFunction = defaultEmptyFunction) => {
  let rtn = {}
  const err = (error) => {
    messageTerminal(defaultError(error))
    if (typeof errorFunction === 'function') {
      errorFunction(error)
    }
  }
  if (pathfile) {
    existsFile(
      pathfile,
      (filedata) => {
        try {
          rtn = parse(filedata)
        } catch (error) {
          err(error && error.message)
        }
      },
      err
    )
  }

  return rtn
}

/**
 * Get fireedge configurations.
 *
 * @param {Function} callbackError - callback error
 * @returns {object} fireedge configurations
 */
const getFireedgeConfig = (callbackError = defaultEmptyFunction) => {
  const pathfile =
    (global && global.paths && global.paths.FIREEDGE_CONFIG) ||
    resolve(...basePaths, defaultConfigFile)

  return readYAMLFile(pathfile, callbackError)
}

/**
 * Get sunstone configurations.
 *
 * @param {Function} callbackError - callback error
 * @returns {object} sunstone configurations
 */
const getSunstoneConfig = (callbackError = defaultEmptyFunction) => {
  const pathfile =
    (global && global.paths && global.paths.SUNSTONE_CONFIG) ||
    resolve(...basePaths, 'sunstone', defaultSunstoneConfig)

  return readYAMLFile(pathfile, callbackError)
}

/**
 * Get provision configurations.
 *
 * @param {Function} callbackError - callback error
 * @returns {object} provision configurations
 */
const getProvisionConfig = (callbackError = defaultEmptyFunction) => {
  const pathfile =
    (global && global.paths && global.paths.PROVISION_CONFIG) ||
    resolve(...basePaths, 'provision', defaultProvisionConfig)

  return readYAMLFile(pathfile, callbackError)
}

module.exports = {
  getFireedgeConfig,
  getSunstoneConfig,
  getProvisionConfig,
}
