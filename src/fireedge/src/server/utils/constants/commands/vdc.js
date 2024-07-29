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

const VDC_ALLOCATE = 'vdc.allocate'
const VDC_DELETE = 'vdc.delete'
const VDC_UPDATE = 'vdc.update'
const VDC_RENAME = 'vdc.rename'
const VDC_ADDGROUP = 'vdc.addgroup'
const VDC_DELGROUP = 'vdc.delgroup'
const VDC_ADDCLUSTER = 'vdc.addcluster'
const VDC_DELCLUSTER = 'vdc.delcluster'
const VDC_ADDHOST = 'vdc.addhost'
const VDC_DELHOST = 'vdc.delhost'
const VDC_ADDDATASTORE = 'vdc.adddatastore'
const VDC_DELDATASTORE = 'vdc.deldatastore'
const VDC_ADDVNET = 'vdc.addvnet'
const VDC_DELVNET = 'vdc.delvnet'
const VDC_INFO = 'vdc.info'
const VDC_POOL_INFO = 'vdcpool.info'

const Actions = {
  VDC_ALLOCATE,
  VDC_DELETE,
  VDC_UPDATE,
  VDC_RENAME,
  VDC_ADDGROUP,
  VDC_DELGROUP,
  VDC_ADDCLUSTER,
  VDC_DELCLUSTER,
  VDC_ADDHOST,
  VDC_DELHOST,
  VDC_ADDDATASTORE,
  VDC_DELDATASTORE,
  VDC_ADDVNET,
  VDC_DELVNET,
  VDC_INFO,
  VDC_POOL_INFO,
}

module.exports = {
  Actions,
  Commands: {
    [VDC_ALLOCATE]: {
      // inspected
      httpMethod: POST,
      params: {
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [VDC_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [VDC_UPDATE]: {
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
    [VDC_RENAME]: {
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
    [VDC_INFO]: {
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
    [VDC_POOL_INFO]: {
      // inspected
      httpMethod: GET,
      params: {},
    },
    [VDC_ADDGROUP]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        group: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VDC_DELGROUP]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        group: {
          from: query,
          default: 0,
        },
      },
    },
    [VDC_ADDCLUSTER]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        zone: {
          from: postBody,
          default: 0,
        },
        cluster: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VDC_DELCLUSTER]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        zone: {
          from: query,
          default: 0,
        },
        cluster: {
          from: query,
          default: 0,
        },
      },
    },
    [VDC_ADDHOST]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        zone: {
          from: postBody,
          default: 0,
        },
        host: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VDC_DELHOST]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        zone: {
          from: postBody,
          default: 0,
        },
        host: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VDC_ADDDATASTORE]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        zone: {
          from: postBody,
          default: 0,
        },
        datastore: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VDC_DELDATASTORE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        zone: {
          from: postBody,
          default: 0,
        },
        datastore: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VDC_ADDVNET]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        zone: {
          from: postBody,
          default: 0,
        },
        vnet: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VDC_DELVNET]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        zone: {
          from: query,
          default: 0,
        },
        vnet: {
          from: query,
          default: 0,
        },
      },
    },
  },
}
