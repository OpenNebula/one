/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
const fs = require('fs-extra')
const { global } = require('window-or-global')
const path = require('path')
const { parse: yamlToJson } = require('yaml')

/**
 * Fetches the default labels configuration.
 *
 * @returns {object} - Parsed default labels
 */
const getDefaultLabels = async () => {
  const defaultLabelsPath = global?.paths?.DEFAULT_LABELS_CONFIG

  if (!defaultLabelsPath) {
    return
  }

  try {
    const stats = await fs.stat(defaultLabelsPath)

    if (stats.isFile()) {
      const fileContent = await fs.readFile(defaultLabelsPath, 'utf-8')

      const parsedFile = yamlToJson(fileContent)

      return parsedFile
    }
  } catch (error) {
    throw new Error('No default labels found')
  }
}

/**
 * Get the configuration for a specific hypervisor.
 *
 * @returns {Promise<object>} Parsed configuration object.
 */
const getForecastConfig = () => {
  const remotesImPath = global?.paths?.REMOTES_IM_PATH

  const dirs = fs
    .readdirSync(remotesImPath, { withFileTypes: true })
    .filter((dir) => dir.isDirectory() && dir.name.endsWith('-probes.d'))
    .map((dir) => dir.name)

  if (!dirs?.length) {
    throw new Error(`No forecast configuration files found`)
  }

  const forecastConf = {}

  dirs.forEach((dir) => {
    const forecastConfigPath = path.join(remotesImPath, dir, 'forecast.conf')
    if (fs.pathExistsSync(forecastConfigPath)) {
      try {
        const fileContent = fs.readFileSync(forecastConfigPath, 'utf-8')
        const config = yamlToJson(fileContent)

        const driverName = dir.replace('-probes.d', '')
        forecastConf[driverName] = config
      } catch (error) {
        throw new Error(`Error parsing config file: ${forecastConfigPath}`)
      }
    }
  })

  return forecastConf
}

module.exports = {
  getForecastConfig,
  getDefaultLabels,
}
