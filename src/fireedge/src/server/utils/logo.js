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
const { getSunstoneViewConfig } = require('server/utils/yml')
const { existsSync, readdirSync } = require('fs')
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
 * @param {boolean} relativePaths - Return relative paths instead of absolute
 * @returns {string|boolean} Full logo path or false if invalid.
 */
const validateLogo = (logo, relativePaths = false) => {
  const imagesDirectory = global?.paths?.SUNSTONE_IMAGES

  if (!logo || !imagesDirectory) {
    return { valid: false, path: null }
  }

  const filePath = path.isAbsolute(logo)
    ? logo
    : path.join(imagesDirectory, path.normalize(logo))

  if (!filePath?.startsWith(imagesDirectory)) {
    return { valid: false, path: null }
  }

  if (!existsSync(filePath)) {
    return { valid: false, path: 'Not found' }
  }

  if (relativePaths) {
    const relativePath = path.relative(imagesDirectory, filePath)

    return { valid: true, path: `images/logos/${relativePath}` }
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

/**
 * Retrieves all logo files from the assets directory.
 *
 * @returns {object} A JSON object with filename as key and full path as value.
 */
const getAllLogos = () => {
  const imagesDirectory = global?.paths?.SUNSTONE_IMAGES
  if (!imagesDirectory || !existsSync(imagesDirectory)) {
    return null
  }

  const files = readdirSync(imagesDirectory)
  const validFilenameRegex = /^[a-zA-Z0-9-_]+\.(jpg|jpeg|png|)$/

  const logos = files.reduce((acc, file) => {
    if (validFilenameRegex.test(file)) {
      acc[file.replace(/\.(jpg|jpeg|png)$/, '')] = path.join(
        imagesDirectory,
        file
      )
    }

    return acc
  }, {})

  return logos
}

/**
 * Retrieves, validates, and encodes a custom favicon image.
 * Returns a base64 encoded string of the favicon if available,
 * otherwise null.
 *
 * @returns {Promise<{b64: string, logoName: string} | null>} A promise that resolves to the base64 encoded image string suitable for favicon use.
 */
const getEncodedFavicon = async () => {
  const logo = getLogo()

  if (!logo?.valid || logo?.NOTSET) {
    return null
  }

  const validated = validateLogo(logo?.filename)
  if (!validated?.valid || validated?.path === 'Not found') {
    return null
  }

  try {
    const encodedFavicon = await encodeFavicon(validated.path)
    if (!encodedFavicon) {
      return null
    }

    return {
      b64: encodedFavicon,
      logoName: logo.filename,
    }
  } catch (error) {
    return null
  }
}

module.exports = {
  getLogo,
  getAllLogos,
  validateLogo,
  encodeLogo,
  encodeFavicon,
  getEncodedFavicon,
}
