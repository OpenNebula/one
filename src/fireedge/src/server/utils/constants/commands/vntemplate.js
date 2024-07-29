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

const VNTEMPLATE_ALLOCATE = 'vntemplate.allocate'
const VNTEMPLATE_CLONE = 'vntemplate.clone'
const VNTEMPLATE_DELETE = 'vntemplate.delete'
const VNTEMPLATE_INSTANTIATE = 'vntemplate.instantiate'
const VNTEMPLATE_UPDATE = 'vntemplate.update'
const VNTEMPLATE_CHMOD = 'vntemplate.chmod'
const VNTEMPLATE_CHOWN = 'vntemplate.chown'
const VNTEMPLATE_RENAME = 'vntemplate.rename'
const VNTEMPLATE_INFO = 'vntemplate.info'
const VNTEMPLATE_LOCK = 'vntemplate.lock'
const VNTEMPLATE_UNLOCK = 'vntemplate.unlock'
const VNTEMPLATE_POOL_INFO = 'vntemplatepool.info'

const Actions = {
  VNTEMPLATE_ALLOCATE,
  VNTEMPLATE_CLONE,
  VNTEMPLATE_DELETE,
  VNTEMPLATE_INSTANTIATE,
  VNTEMPLATE_UPDATE,
  VNTEMPLATE_CHMOD,
  VNTEMPLATE_CHOWN,
  VNTEMPLATE_RENAME,
  VNTEMPLATE_INFO,
  VNTEMPLATE_LOCK,
  VNTEMPLATE_UNLOCK,
  VNTEMPLATE_POOL_INFO,
}

module.exports = {
  Actions,
  Commands: {
    [VNTEMPLATE_ALLOCATE]: {
      // inspected
      httpMethod: POST,
      params: {
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [VNTEMPLATE_CLONE]: {
      // inspected
      httpMethod: POST,
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
    [VNTEMPLATE_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [VNTEMPLATE_INSTANTIATE]: {
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
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [VNTEMPLATE_UPDATE]: {
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
    [VNTEMPLATE_CHMOD]: {
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
    [VNTEMPLATE_CHOWN]: {
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
    [VNTEMPLATE_RENAME]: {
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
    [VNTEMPLATE_INFO]: {
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
    [VNTEMPLATE_LOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        level: {
          from: postBody,
          default: 4,
        },
        test: {
          from: postBody,
          default: false,
        },
      },
    },
    [VNTEMPLATE_UNLOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [VNTEMPLATE_POOL_INFO]: {
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
