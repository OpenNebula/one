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
const fs = require('fs-extra')
const { global } = require('window-or-global')
const { writeInLogger } = require('server/utils/logger')
const { defaults } = require('server/utils/constants')
const { defaultRemoteModules, defaultPort } = defaults

/**
 * Reads the tab-manifest.json file from disk.
 *
 * @returns {Promise<object>} - The parsed JSON object from the file.
 * @throws {Error} - Throws if the file cannot be read or parsed.
 */
const getTabManifest = async () => {
  try {
    const tabManifestConfigPath = global?.paths?.TAB_MANIFEST_CONFIG
    if (!(await fs.pathExists(tabManifestConfigPath))) {
      throw new Error(`Configuration file not found: ${tabManifestConfigPath}`)
    }

    const fileContent = await fs.readFile(tabManifestConfigPath, 'utf8')

    return JSON.parse(fileContent)
  } catch (error) {
    throw new Error('Failed to load tab-manifest.json')
  }
}

/**
 * Reads the remotes-config.json file from disk.
 *
 * @returns {Promise<object>} - The parsed JSON object from the file.
 * @throws {Error} - Throws if the file cannot be read or parsed.
 */
const getRemotesConfig = () => {
  const remotesConfigPath = global?.paths?.REMOTE_MODULES_CONFIG
  if (!remotesConfigPath) {
    const errorMsg =
      '[CRITICAL] REMOTE_MODULES_CONFIG is not defined. Cannot load remotes-config.json.'
    writeInLogger(errorMsg)
    console.error(errorMsg)
  }

  if (!fs.pathExistsSync(remotesConfigPath)) {
    const errorMsg = `[CRITICAL] Failed to locate remotes-config.json at: ${remotesConfigPath}`
    writeInLogger(errorMsg)
    console.error(errorMsg)
  }

  try {
    const fileContent = fs.readFileSync(remotesConfigPath, 'utf8')
    const config = JSON.parse(fileContent)

    return config
  } catch (error) {
    const errorMsg = `[CRITICAL] Failed to parse remotes-config.json. Client cannot be loaded. Error: ${error.message}. Attempting fallback to local modules.`
    console.error(errorMsg)
    writeInLogger(errorMsg)
    const fallbackConfig = Object.fromEntries(
      defaultRemoteModules.map((module) => [
        module,
        {
          name: module,
          entry: `http://localhost:${defaultPort}/fireedge/modules/${module}/remoteEntry.js`,
        },
      ])
    )

    fallbackConfig.fallback = true

    return fallbackConfig
  }
}

module.exports = {
  getTabManifest,
  getRemotesConfig,
}
