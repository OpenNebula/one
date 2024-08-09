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
const path = require('path')
const { global } = require('window-or-global')

/**
 * Parse custom configuration file format.
 *
 * @param {string} fileContent - Content of the configuration file.
 * @returns {object} Parsed configuration object.
 */
const parseConfigFileContent = (fileContent) => {
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
 * Get the configuration for a specific hypervisor.
 *
 * @param {string} hypervisor - The hypervisor type.
 * @returns {Promise<object>} Parsed configuration object.
 */
const getVmmConfig = async (hypervisor) => {
  const vmmExecConfigDirectory = global?.paths?.VMM_EXEC_CONFIG

  const configFilePath = path.join(
    vmmExecConfigDirectory,
    `vmm_exec_${hypervisor}.conf`
  )

  if (!(await fs.pathExists(configFilePath))) {
    throw new Error(`Configuration file not found: ${configFilePath}`)
  }

  try {
    const fileContent = await fs.readFile(configFilePath, 'utf-8')
    const config = parseConfigFileContent(fileContent)

    return config
  } catch (error) {
    throw new Error(`Error parsing config file: ${configFilePath}`)
  }
}

module.exports = {
  getVmmConfig,
}
