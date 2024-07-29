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

const CLUSTER_ALLOCATE = 'cluster.allocate'
const CLUSTER_DELETE = 'cluster.delete'
const CLUSTER_UPDATE = 'cluster.update'
const CLUSTER_ADDHOST = 'cluster.addhost'
const CLUSTER_DELHOST = 'cluster.delhost'
const CLUSTER_ADDDATASTORE = 'cluster.adddatastore'
const CLUSTER_DELDATASTORE = 'cluster.deldatastore'
const CLUSTER_ADDVNET = 'cluster.addvnet'
const CLUSTER_DELVNET = 'cluster.delvnet'
const CLUSTER_RENAME = 'cluster.rename'
const CLUSTER_INFO = 'cluster.info'
const CLUSTER_POOL_INFO = 'clusterpool.info'

const Actions = {
  CLUSTER_ALLOCATE,
  CLUSTER_DELETE,
  CLUSTER_UPDATE,
  CLUSTER_ADDHOST,
  CLUSTER_DELHOST,
  CLUSTER_ADDDATASTORE,
  CLUSTER_DELDATASTORE,
  CLUSTER_ADDVNET,
  CLUSTER_DELVNET,
  CLUSTER_RENAME,
  CLUSTER_INFO,
  CLUSTER_POOL_INFO,
}

module.exports = {
  Actions,
  Commands: {
    [CLUSTER_ALLOCATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        name: {
          from: postBody,
          default: '',
        },
      },
    },
    [CLUSTER_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [CLUSTER_UPDATE]: {
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
    [CLUSTER_ADDHOST]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        host: {
          from: postBody,
          default: 0,
        },
      },
    },
    [CLUSTER_DELHOST]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        host: {
          from: postBody,
          default: 0,
        },
      },
    },
    [CLUSTER_ADDDATASTORE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        datastore: {
          from: postBody,
          default: 0,
        },
      },
    },
    [CLUSTER_DELDATASTORE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        datastore: {
          from: postBody,
          default: 0,
        },
      },
    },
    [CLUSTER_ADDVNET]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        vnet: {
          from: postBody,
          default: 0,
        },
      },
    },
    [CLUSTER_DELVNET]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        vnet: {
          from: postBody,
          default: 0,
        },
      },
    },
    [CLUSTER_RENAME]: {
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
    [CLUSTER_INFO]: {
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
    [CLUSTER_POOL_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        zone: {
          from: query,
          default: 0,
        },
      },
    },
  },
}
