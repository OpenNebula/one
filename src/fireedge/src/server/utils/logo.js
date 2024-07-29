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
const {
  getLogo,
  validateLogo,
  encodeFavicon,
} = require('server/routes/api/logo/utils')

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
  getEncodedFavicon,
}
