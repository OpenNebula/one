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
  from: { resource, postBody, query },
  httpMethod: { GET, POST, PUT, DELETE },
} = require('../defaults')

const ZONE_ALLOCATE = 'zone.allocate'
const ZONE_DELETE = 'zone.delete'
const ZONE_UPDATE = 'zone.update'
const ZONE_RENAME = 'zone.rename'
const ZONE_INFO = 'zone.info'
const ZONE_RAFTSTATUS = 'zone.raftstatus'
const ZONE_POOL_INFO = 'zonepool.info'

const Actions = {
  ZONE_ALLOCATE,
  ZONE_DELETE,
  ZONE_UPDATE,
  ZONE_RENAME,
  ZONE_INFO,
  ZONE_RAFTSTATUS,
  ZONE_POOL_INFO,
}

module.exports = {
  Actions,
  Commands: {
    [ZONE_ALLOCATE]: {
      // inspected
      httpMethod: POST,
      params: {
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [ZONE_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [ZONE_UPDATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        template: {
          from: postBody,
          default: '',
        },
        replace: {
          from: postBody,
          default: 0,
        },
      },
    },
    [ZONE_RENAME]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        name: {
          from: postBody,
          default: '',
        },
      },
    },
    [ZONE_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        decrypt: {
          from: query,
          default: false,
        },
      },
    },
    [ZONE_RAFTSTATUS]: {
      // inspected
      httpMethod: GET,
      params: {},
    },
    [ZONE_POOL_INFO]: {
      // inspected
      httpMethod: GET,
      params: {},
    },
  },
}
