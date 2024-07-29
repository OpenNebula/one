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
  from: fromData,
  httpMethod,
} = require('../../../../utils/constants/defaults')

const { GET, POST, PUT, DELETE } = httpMethod
const { resource, postBody } = fromData
const basepath = '/provider'

const PROVIDER_CONNECTION = 'provider.connection'
const PROVIDER_CONFIG = 'provider.config'
const PROVIDER_LIST = 'provider.list'
const PROVIDER_CREATE = 'provider.create'
const PROVIDER_UPDATE = 'provider.update'
const PROVIDER_DELETE = 'provider.delete'

const Actions = {
  PROVIDER_CONNECTION,
  PROVIDER_CONFIG,
  PROVIDER_LIST,
  PROVIDER_CREATE,
  PROVIDER_UPDATE,
  PROVIDER_DELETE,
}

module.exports = {
  Actions,
  Commands: {
    [PROVIDER_CONNECTION]: {
      path: `${basepath}/connection/:id`,
      httpMethod: GET,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
    [PROVIDER_CONFIG]: {
      path: `${basepath}/config`,
      httpMethod: GET,
      auth: true,
    },
    [PROVIDER_LIST]: {
      path: `${basepath}/:id?`,
      httpMethod: GET,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
    [PROVIDER_CREATE]: {
      path: `${basepath}`,
      httpMethod: POST,
      auth: true,
      params: {
        data: {
          from: postBody,
        },
      },
    },
    [PROVIDER_UPDATE]: {
      path: `${basepath}/:id`,
      httpMethod: PUT,
      auth: true,
      params: {
        data: {
          from: postBody,
        },
        id: { from: resource },
      },
    },
    [PROVIDER_DELETE]: {
      path: `${basepath}/:id`,
      httpMethod: DELETE,
      auth: true,
      params: {
        id: { from: resource },
      },
    },
  },
}
