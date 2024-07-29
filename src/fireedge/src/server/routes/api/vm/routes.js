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

const basepath = '/vm'
const { POST, GET } = httpMethod
const { resource, postBody } = fromData

const VM_SAVEASTEMPLATE = 'vm.saveastemplate'
const GUACAMOLE = 'vm.guacamole'

const Actions = {
  VM_SAVEASTEMPLATE,
  GUACAMOLE,
}

module.exports = {
  Actions,
  Commands: {
    [VM_SAVEASTEMPLATE]: {
      path: `${basepath}/save/:id`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        name: {
          from: postBody,
        },
        persistent: {
          from: postBody,
        },
      },
    },
    [GUACAMOLE]: {
      path: `${basepath}/:id/guacamole/:type`,
      httpMethod: GET,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        type: {
          from: resource,
        },
      },
    },
  },
}
