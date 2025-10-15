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
const { defaults, httpCodes } = require('server/utils/constants')

const { httpResponse } = require('server/utils/server')

const { getSunstoneConfig } = require('server/utils/yml')
const path = require('path')

const { defaultEmptyFunction } = defaults

const { ok, badRequest, internalServerError } = httpCodes

const httpBadRequest = httpResponse(badRequest, '', '')

/**
 * Upload File.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} params - data response http
 * @param {object} userData - user of http request
 */
const upload = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { files } = params
  const { user, password } = userData

  if (!(files && user && password)) {
    res.locals.httpCode = httpBadRequest
    next()

    return
  }
  try {
    const data = files.map((file) => file.path)
    res.locals.httpCode = httpResponse(ok, data?.length ? data : '')
  } catch {}
  next()
}

/**
 * Cleanup temporary file.
 *
 * @param {object} res - response http
 * @param {Function} next - express stepper
 * @param {string} params - data response http
 * @param {object} userData - user of http request
 */
const cleanup = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  const { path: filePath } = params
  const { user, password } = userData

  if (!(filePath && user && password)) {
    res.locals.httpCode = httpBadRequest
    next()

    return
  }

  try {
    const appConfig = getSunstoneConfig()
    const tmpdir = appConfig.tmpdir || defaults.defaultTmpPath
    const resolvedTmp = path.resolve(tmpdir) + path.sep
    const resolvedFile = path.resolve(filePath)

    if (!resolvedFile.startsWith(resolvedTmp)) {
      res.locals.httpCode = httpResponse(
        internalServerError,
        '',
        'Invalid file path'
      )
      next()

      return
    }

    const { removeFile } = require('server/utils/server')
    const removed = removeFile(resolvedFile)
    res.locals.httpCode = httpResponse(
      removed ? ok : internalServerError,
      '',
      ''
    )
  } catch (e) {
    res.locals.httpCode = httpResponse(
      internalServerError,
      '',
      e?.message || ''
    )
  }
  next()
}
const functionRoutes = {
  upload,
  cleanup,
}
module.exports = functionRoutes
