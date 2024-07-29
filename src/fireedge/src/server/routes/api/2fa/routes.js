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

const { POST, DELETE, GET } = httpMethod
const basepath = '/tfa'
const TFA_SETUP = 'tfa.setup'
const TFA_QR = 'tfa.qr'
const TFA_DELETE = 'tfa.delete'

const Actions = {
  TFA_SETUP,
  TFA_QR,
  TFA_DELETE,
}

module.exports = {
  Actions,
  Commands: {
    [TFA_SETUP]: {
      path: `${basepath}`,
      httpMethod: POST,
      auth: true,
      params: {
        token: {
          from: fromData.postBody,
        },
      },
    },
    [TFA_QR]: {
      path: `${basepath}`,
      httpMethod: GET,
      auth: true,
    },
    [TFA_DELETE]: {
      path: `${basepath}`,
      httpMethod: DELETE,
      auth: true,
    },
  },
}
