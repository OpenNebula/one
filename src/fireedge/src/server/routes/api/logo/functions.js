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
  getAllLogos,
  validateLogo,
  encodeLogo,
} = require('server/utils/logo')

const { defaults, httpCodes } = require('server/utils/constants')
const { httpResponse } = require('server/utils/server')
const { internalServerError, notFound, badRequest, ok } = httpCodes
const { defaultEmptyFunction } = defaults
const { writeInLogger } = require('server/utils/logger')

/**
 * Middleware to get and send the encoded logo image.
 *
 * @param {object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
const getEncodedLogo = async (res = {}, next = defaultEmptyFunction) => {
  const logo = getLogo()

  if (logo?.NOTSET) {
    res.locals.httpCode = httpResponse(ok, '', '')

    return next()
  }

  if (!logo?.valid) {
    res.locals.httpCode = httpResponse(badRequest, 'Bad logo specified', '')

    return next()
  }

  const validate = validateLogo(logo?.filename)

  if (!validate?.valid && validate?.path !== null) {
    res.locals.httpCode = httpResponse(notFound, 'Could not find logo', '')

    return next()
  }

  if (!validate?.valid) {
    res.locals.httpCode = httpResponse(badRequest, '', '')

    return next()
  }

  try {
    const encodedLogo = await encodeLogo(validate?.path)
    if (!encodedLogo || encodedLogo === null) {
      res.locals.httpCode = httpResponse(
        internalServerError,
        'Failed to load logo',
        ''
      )
    } else {
      res.locals.httpCode = httpResponse(ok, {
        b64: encodedLogo,
        logoName: logo?.filename,
      })
    }
  } catch (error) {
    const httpError = httpResponse(internalServerError, '', '')
    writeInLogger(httpError)
    res.locals.httpCode = httpError
  }
  next()
}

/**
 * Middleware to get and send all logos with their paths.
 *
 * @param {object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
const getAllLogosHandler = async (res = {}, next = defaultEmptyFunction) => {
  try {
    const logos = getAllLogos() ?? {}

    if (!logos) {
      res.locals.httpCode = httpResponse(notFound, 'No logos found', '')

      return next()
    }

    const validLogos = {}
    for (const [name, filePath] of Object?.entries(logos)) {
      const validate = validateLogo(filePath, true)
      if (validate.valid) {
        validLogos[name] = validate.path
      }
    }

    if (Object.keys(validLogos)?.length === 0) {
      res.locals.httpCode = httpResponse(notFound, 'No valid logos found', '')
    } else {
      res.locals.httpCode = httpResponse(ok, validLogos)
    }
  } catch (error) {
    const httpError = httpResponse(
      internalServerError,
      'Failed to load logos',
      ''
    )
    writeInLogger(httpError)
    res.locals.httpCode = httpError
  }

  next()
}

module.exports = {
  getEncodedLogo,
  getAllLogosHandler,
}
