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

const Worker = require('tiny-worker')
const { resolve } = require('path')
const { httpResponse } = require('server/utils/server')
const { httpCodes } = require('server/utils/constants')

const { internalServerError, ok, noContent, notFound } = httpCodes

/**
 * Use Tiny worker.
 *
 * @returns {object} - Worker
 */
const useWorker = () => {
  const workerPath = [__dirname]
  require('server/utils/index.worker')

  return new Worker(resolve(...workerPath, 'index.worker.js'))
}

/**
 * Parse Return http worker.
 *
 * @param {any} value - data from worker.
 * @returns {object} http response
 */
const parseReturnWorker = (value) => {
  let rtn = httpResponse(internalServerError)
  switch (typeof value) {
    case 'string':
      try {
        rtn = httpResponse(ok, JSON.parse(value))
      } catch (error) {
        rtn = httpResponse(
          value === null || value === '' ? noContent : notFound,
          value
        )
      }
      break
    case 'object':
      rtn = httpResponse(ok, value)
      break
    case 'number':
      rtn = httpResponse(ok, value)
      break
    default:
      break
  }

  return rtn
}
module.exports = {
  useWorker,
  parseReturnWorker,
}
