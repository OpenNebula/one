/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
const { getSunstoneViewConfig } = require('server/utils/yml')
const { existsSync } = require('fs')
const path = require('path')
const { global } = require('window-or-global')
const Jimp = require('jimp')

/**
 * Retrieves the logo filename.
 *
 * @returns {string|null} The validated logo filename or null if the filename is invalid or not specified.
 */
const getLogo = () => {
  const config = getSunstoneViewConfig()
  const logo = config?.logo

  const validFilenameRegex = /^[a-zA-Z0-9-_]+\.(jpg|jpeg|png|)$/

  if (
    logo &&
    typeof logo === 'string' &&
    logo.trim() !== '' &&
    validFilenameRegex.test(logo)
  ) {
    return { valid: true, filename: logo }
  }

  return { valid: false, filename: null, ...(!logo ? { NOTSET: true } : {}) }
}

/**
 * Validates the specified logo file path.
 *
 * @param {string} logo - The logo file name to validate.
 * @returns {string|boolean} Full logo path or false if invalid.
 */
const validateLogo = (logo) => {
  const imagesDirectory = global?.paths?.SUNSTONE_IMAGES

  if (!logo || !imagesDirectory) {
    return { valid: false, path: null }
  }

  const filePath = path.join(imagesDirectory, path.normalize(logo))

  if (!filePath?.startsWith(imagesDirectory)) {
    return { valid: false, path: null }
  }

  if (!existsSync(filePath)) {
    return { valid: false, path: 'Not found' }
  }

  return { valid: true, path: filePath }
}

/**
 * Encodes an image file at a specified path into a base64 string.
 *
 * @param {string} filePath - The full path to the image file.
 * @returns {Promise<string>} A promise that resolves to the base64 encoded image string.
 */
const encodeLogo = async (filePath) => {
  try {
    const image = await Jimp.read(filePath)
    const data = await image.getBufferAsync(Jimp.MIME_PNG)

    return `data:image/png;base64,${data.toString('base64')}`
  } catch (error) {
    return null
  }
}

/**
 * Resizes and encodes an image file to be used as a favicon.
 *
 * @param {string} filePath - The full path to the image file.
 * @returns {Promise<string>} A promise that resolves to the base64 encoded image string suitable for favicon use.
 */
const encodeFavicon = async (filePath) => {
  try {
    const image = await Jimp.read(filePath)
    const resizedImage = await image.resize(32, 32)
    const data = await resizedImage.getBufferAsync(Jimp.MIME_PNG)

    return `data:image/png;base64,${data.toString('base64')}`
  } catch (error) {
    return null
  }
}

module.exports = { getLogo, validateLogo, encodeLogo, encodeFavicon }
