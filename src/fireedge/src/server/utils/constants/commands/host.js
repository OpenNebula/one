/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
  httpMethod: { GET, PUT, DELETE },
} = require('../defaults')

const HOST_ALLOCATE = 'host.allocate'
const HOST_DELETE = 'host.delete'
const HOST_STATUS = 'host.status'
const HOST_UPDATE = 'host.update'
const HOST_RENAME = 'host.rename'
const HOST_INFO = 'host.info'
const HOST_MONITORING = 'host.monitoring'
const HOST_POOL_INFO = 'hostpool.info'
const HOST_POOL_MONITORING = 'hostpool.monitoring'

const Actions = {
  HOST_ALLOCATE,
  HOST_DELETE,
  HOST_STATUS,
  HOST_UPDATE,
  HOST_RENAME,
  HOST_INFO,
  HOST_MONITORING,
  HOST_POOL_INFO,
  HOST_POOL_MONITORING,
}

module.exports = {
  Actions,
  Commands: {
    [HOST_ALLOCATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        hostname: {
          from: postBody,
          default: '',
        },
        imMad: {
          from: postBody,
          default: '',
        },
        vmmMad: {
          from: postBody,
          default: '',
        },
        cluster: {
          from: postBody,
          default: -1,
        },
      },
    },
    [HOST_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: 0,
        },
      },
    },
    [HOST_STATUS]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        status: {
          from: postBody,
          default: 0,
        },
      },
    },
    [HOST_UPDATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
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
    [HOST_RENAME]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        name: {
          from: postBody,
          default: '',
        },
      },
    },
    [HOST_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        decrypt: {
          from: query,
          default: false,
        },
      },
    },
    [HOST_MONITORING]: {
      // inspected
      httpMethod: GET,
      params: {
        id: {
          from: resource,
          default: 0,
        },
      },
    },
    [HOST_POOL_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        zone: {
          from: query,
          default: 0,
        },
      },
    },
    [HOST_POOL_MONITORING]: {
      // inspected
      httpMethod: GET,
      params: {
        seconds: {
          from: query,
          default: -1,
        },
      },
    },
  },
}
