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

const { defaultHeaderRemote } = require('server/utils/constants/defaults')
class OpenNebulaError extends Error {
  /**
   * @param {string} message - message error.
   */
  constructor(message) {
    super(message)
    this.name = 'OpenNebulaError'
  }
}

class JWTError extends OpenNebulaError {
  /**
   * @param {string} message - error message description.
   */
  constructor(message) {
    super(message)
    this.name = 'JWTError'
  }
}

class MissingRemoteHeaderError extends OpenNebulaError {
  /**
   * @param {string} headers - error message description.
   */
  constructor(headers = '') {
    super(`missing header: ${defaultHeaderRemote.join()} in ${headers}`)
    this.name = 'MissingRemoteHeaderError'
  }
}

class MissingFireEdgeKeyError extends OpenNebulaError {
  /**
   *
   */
  constructor() {
    super('FireEdge key is not loaded in globals.path')
    this.name = 'MissingFireEdgeKeyError'
  }
}

module.exports = {
  JWTError,
  MissingFireEdgeKeyError,
  OpenNebulaError,
  MissingRemoteHeaderError,
}
