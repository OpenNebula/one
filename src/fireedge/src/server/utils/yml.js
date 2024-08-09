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

const { parse: yamlToJson } = require('yaml')
const {
  protectedConfigData,
  defaultAppName,
  defaultApps,
  defaultEmptyFunction,
} = require('./constants/defaults')
const { existsFile, defaultError } = require('server/utils/server')
const { messageTerminal } = require('server/utils/general')
const { global } = require('window-or-global')

const getConfigPathByApp = (app) =>
  ({
    [defaultAppName]: global?.paths?.FIREEDGE_CONFIG,
    [defaultApps.sunstone.name]: global?.paths?.SUNSTONE_CONFIG,
    [defaultApps.provision.name]: global?.paths?.PROVISION_CONFIG,
  }[app])

const getViewConfigPathByApp = (app) =>
  ({
    [defaultAppName]: global?.paths?.SUNSTONE_VIEWS,
    [defaultApps.sunstone.name]: global?.paths?.SUNSTONE_VIEWS,
  }[app])

const getProtectedKeysByApp = (app) => protectedConfigData[app] || []

/**
 * Get fireedge configurations.
 *
 * @param {string} filePath - path config file
 * @param {Function} onError - callback error
 * @returns {object} fireedge configurations
 */
const readYAMLFile = (filePath = '', onError = defaultEmptyFunction) => {
  let rtn = {}

  const errorFunction = (error) => {
    messageTerminal(defaultError(error))
    onError === 'function' && onError(error)
  }

  const successFunction = (data) => {
    try {
      rtn = yamlToJson(data)
    } catch (error) {
      errorFunction(error?.message)
    }
  }

  filePath && existsFile(filePath, successFunction, errorFunction)

  return rtn
}

/**
 * Filter configuration by list of keys.
 *
 * @param {object} config - Config to filter
 * @param {Array} [keys] - List of keys to filter
 * @returns {object} Filtered object
 */
const filterByProtectedKeys = (config = {}, keys = []) =>
  Object.keys(config)
    .filter((key) => !keys.includes(key))
    .reduce((newConf, key) => ({ ...newConf, [key]: config[key] }), {})

/**
 * @typedef GetConfigurationOptions
 * @property {function(string)} [onError] - Function to be called when an error
 * @property {boolean} [includeProtectedConfig] - Include protected config. By default is true.
 */

/**
 * Get configuration by app name.
 *
 * @param {string} [app] - App name. Default: fireedge
 * @param {GetConfigurationOptions} options - Options
 * @returns {object} Configuration
 */
const getConfiguration = (
  app = defaultAppName,
  { onError = defaultEmptyFunction, includeProtectedConfig = true } = {}
) => {
  const config = readYAMLFile(getConfigPathByApp(app), onError)

  if (config && !includeProtectedConfig) {
    return filterByProtectedKeys(config, getProtectedKeysByApp(app))
  }

  return config
}

/**
 * Get configuration by app name.
 *
 * @param {string} [app] - App name. Default: fireedge
 * @param {GetConfigurationOptions} options - Options
 * @returns {object} Configuration
 */
const getViewConfiguration = (
  app = defaultAppName,
  { onError = defaultEmptyFunction } = {}
) => {
  const config = readYAMLFile(getViewConfigPathByApp(app), onError)

  return config
}

/**
 * Get FireEdge configuration.
 *
 * @param {GetConfigurationOptions} [options] - Options
 * @returns {object} FireEdge configuration
 */
const getFireedgeConfig = (options) => getConfiguration(defaultAppName, options)

/**
 * Get Sunstone configuration.
 *
 * @param {GetConfigurationOptions} [options] - Options
 * @returns {object} Sunstone configuration
 */
const getSunstoneConfig = (options) =>
  getConfiguration(defaultApps.sunstone.name, options)

/**
 * Get Sunstone views configuration.
 *
 * @returns {object} Sunstone configuration
 */
const getSunstoneViewConfig = () =>
  getViewConfiguration(defaultApps.sunstone.name)

/**
 * Get Provision configuration.
 *
 * @param {GetConfigurationOptions} [options] - Options
 * @returns {object} Provision configuration
 */
const getProvisionConfig = (options) =>
  getConfiguration(defaultApps.provision.name, options)

module.exports = {
  readYAMLFile,
  getFireedgeConfig,
  getSunstoneConfig,
  getSunstoneViewConfig,
  getProvisionConfig,
}
