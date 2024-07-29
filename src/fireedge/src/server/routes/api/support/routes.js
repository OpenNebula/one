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

const { httpMethod } = require('../../../utils/constants/defaults')

const basepath = '/support'
const { GET } = httpMethod

const SUPPORT_CHECK = 'support.check'
const SUPPORT_VERSION = 'support.version'
const Actions = {
  SUPPORT_CHECK,
  SUPPORT_VERSION,
}

module.exports = {
  Actions,
  Commands: {
    [SUPPORT_VERSION]: {
      path: `${basepath}/check/version`,
      httpMethod: GET,
      auth: true,
    },
    [SUPPORT_CHECK]: {
      path: `${basepath}/check`,
      httpMethod: GET,
      auth: true,
    },
  },
}
