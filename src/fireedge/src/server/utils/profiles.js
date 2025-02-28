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
const path = require('path')
const { global } = require('window-or-global')
const { parse } = require('yaml')

/**
 * Parse profile configuration.
 *
 * @param {string} fileContent - Content of the configuration file.
 * @returns {object} Parsed os profile object.
 */
const parseProfileFileContent = (fileContent) => {
  try {
    return parse(fileContent)
  } catch (error) {
    throw new Error(`Error parsing profile: ${error.message}`)
  }
}

/**
 * Get the contents of an OS template profile or list all profiles.
 *
 * @param {string} [id='-1'] - The name of the profile. If '-1' or undefined, list all profiles.
 * @returns {Promise<object|string[]>} Parsed os profile object or list of profile names.
 */
const getProfiles = async (id = '-1') => {
  const vmTemplateProfilesDir = global?.paths?.OS_PROFILES

  if (!vmTemplateProfilesDir) {
    throw new Error('OS_PROFILES path is not defined.')
  }

  let profileFilePath

  if (id && id !== '-1') {
    profileFilePath = path.join(vmTemplateProfilesDir, `${id}.yaml`)
  } else {
    profileFilePath = vmTemplateProfilesDir
  }

  const exists = await fs.pathExists(profileFilePath)

  if (!exists) {
    if (id && id !== '-1') {
      throw new Error('OS profile not found')
    } else {
      throw new Error('No OS profiles found')
    }
  }

  try {
    const stats = await fs.stat(profileFilePath)

    if (stats.isFile()) {
      const fileContent = await fs.readFile(profileFilePath, 'utf-8')

      return parseProfileFileContent(fileContent)
    } else if (stats.isDirectory()) {
      const profiles = await fs.readdir(profileFilePath)
      const yamlFiles = profiles
        .filter((file) => path.extname(file) === '.yaml')
        .map((file) => path.basename(file, '.yaml'))

      if (yamlFiles.length === 0) {
        throw new Error('No OS profiles found')
      }

      return yamlFiles
    } else {
      throw new Error(`Unknown file type: ${profileFilePath}`)
    }
  } catch (error) {
    throw new Error(`${error?.message || 'OS Profile error'}`)
  }
}

module.exports = {
  getProfiles,
}
