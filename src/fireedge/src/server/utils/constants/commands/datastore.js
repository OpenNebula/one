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

const DATASTORE_ALLOCATE = 'datastore.allocate'
const DATASTORE_DELETE = 'datastore.delete'
const DATASTORE_UPDATE = 'datastore.update'
const DATASTORE_CHMOD = 'datastore.chmod'
const DATASTORE_CHOWN = 'datastore.chown'
const DATASTORE_RENAME = 'datastore.rename'
const DATASTORE_ENABLE = 'datastore.enable'
const DATASTORE_INFO = 'datastore.info'
const DATASTORE_POOL_INFO = 'datastorepool.info'

const Actions = {
  DATASTORE_ALLOCATE,
  DATASTORE_DELETE,
  DATASTORE_UPDATE,
  DATASTORE_CHMOD,
  DATASTORE_CHOWN,
  DATASTORE_RENAME,
  DATASTORE_ENABLE,
  DATASTORE_INFO,
  DATASTORE_POOL_INFO,
}

module.exports = {
  Actions,
  Commands: {
    [DATASTORE_ALLOCATE]: {
      // inspected
      httpMethod: POST,
      params: {
        template: {
          from: postBody,
          default: '',
        },
        cluster: {
          from: postBody,
          default: -1,
        },
      },
    },
    [DATASTORE_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [DATASTORE_UPDATE]: {
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
    [DATASTORE_CHMOD]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        ownerUse: {
          from: postBody,
          default: -1,
        },
        ownerManage: {
          from: postBody,
          default: -1,
        },
        ownerAdmin: {
          from: postBody,
          default: -1,
        },
        groupUse: {
          from: postBody,
          default: -1,
        },
        groupManage: {
          from: postBody,
          default: -1,
        },
        groupAdmin: {
          from: postBody,
          default: -1,
        },
        otherUse: {
          from: postBody,
          default: -1,
        },
        otherManage: {
          from: postBody,
          default: -1,
        },
        otherAdmin: {
          from: postBody,
          default: -1,
        },
      },
    },
    [DATASTORE_CHOWN]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        user: {
          from: postBody,
          default: -1,
        },
        group: {
          from: postBody,
          default: -1,
        },
      },
    },
    [DATASTORE_RENAME]: {
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
    [DATASTORE_ENABLE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        enable: {
          from: postBody,
          default: true,
        },
      },
    },
    [DATASTORE_INFO]: {
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
    [DATASTORE_POOL_INFO]: {
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
