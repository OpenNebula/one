/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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

const { httpMethod, from: fromData } = require('server/utils/constants/defaults')
const { auth } = require('./auth-functions')
const { POST } = httpMethod

const routes = {
  [POST]: {
    null: {
      action: auth,
      params: {
        user: {
          from: fromData.postBody,
          name: 'user'
        },
        token: {
          from: fromData.postBody,
          name: 'token'
        },
        type: {
          from: fromData.postBody,
          name: 'type'
        },
        token2fa: {
          from: fromData.postBody,
          name: 'token2fa'
        },
        remember: {
          from: fromData.postBody,
          name: 'remember'
        }
      }
    }
  }
}

const authApi = {
  routes
}
module.exports = authApi
