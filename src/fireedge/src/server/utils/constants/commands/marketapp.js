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
  httpMethod: { GET, PUT, DELETE },
} = require('../defaults')

const MARKETAPP_ALLOCATE = 'marketapp.allocate'
const MARKETAPP_DELETE = 'marketapp.delete'
const MARKETAPP_UPDATE = 'marketapp.update'
const MARKETAPP_ENABLE = 'marketapp.enable'
const MARKETAPP_CHMOD = 'marketapp.chmod'
const MARKETAPP_CHOWN = 'marketapp.chown'
const MARKETAPP_RENAME = 'marketapp.rename'
const MARKETAPP_INFO = 'marketapp.info'
const MARKETAPP_LOCK = 'marketapp.lock'
const MARKETAPP_UNLOCK = 'marketapp.unlock'
const MARKETAPP_POOL_INFO = 'marketapppool.info'

const Actions = {
  MARKETAPP_ALLOCATE,
  MARKETAPP_DELETE,
  MARKETAPP_UPDATE,
  MARKETAPP_ENABLE,
  MARKETAPP_CHMOD,
  MARKETAPP_CHOWN,
  MARKETAPP_RENAME,
  MARKETAPP_INFO,
  MARKETAPP_LOCK,
  MARKETAPP_UNLOCK,
  MARKETAPP_POOL_INFO,
}

module.exports = {
  Actions,
  Commands: {
    [MARKETAPP_ALLOCATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        template: {
          from: postBody,
          default: '',
        },
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [MARKETAPP_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [MARKETAPP_ENABLE]: {
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
    [MARKETAPP_UPDATE]: {
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
    [MARKETAPP_CHMOD]: {
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
    [MARKETAPP_CHOWN]: {
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
    [MARKETAPP_RENAME]: {
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
    [MARKETAPP_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [MARKETAPP_LOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        lock: {
          from: postBody,
          default: 4,
        },
      },
    },
    [MARKETAPP_UNLOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [MARKETAPP_POOL_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        filter: {
          from: query,
          default: -2,
        },
        start: {
          from: query,
          default: -1,
        },
        end: {
          from: query,
          default: -1,
        },
      },
    },
  },
}
