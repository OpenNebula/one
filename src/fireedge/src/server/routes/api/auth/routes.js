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
  httpMethod,
  from: fromData,
} = require('../../../utils/constants/defaults')

const { POST } = httpMethod
const { postBody } = fromData

const basepath = '/auth'
const AUTHENTICATION = 'authentication'

const Actions = {
  AUTHENTICATION,
}

module.exports = {
  Actions,
  Commands: {
    [AUTHENTICATION]: {
      path: `${basepath}/`,
      httpMethod: POST,
      auth: false,
      params: {
        user: {
          from: postBody,
        },
        token: {
          from: postBody,
        },
        type: {
          from: postBody,
        },
        token2fa: {
          from: postBody,
        },
        remember: {
          from: postBody,
        },
      },
    },
  },
}
