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

const VN_ALLOCATE = 'vn.allocate'
const VN_DELETE = 'vn.delete'
const VN_AR_ADD = 'vn.add_ar'
const VN_AR_RM = 'vn.rm_ar'
const VN_AR_UPDATE = 'vn.update_ar'
const VN_RESERVE = 'vn.reserve'
const VN_AR_FREE = 'vn.free_ar'
const VN_HOLD = 'vn.hold'
const VN_RELEASE = 'vn.release'
const VN_UPDATE = 'vn.update'
const VN_CHMOD = 'vn.chmod'
const VN_CHOWN = 'vn.chown'
const VN_RENAME = 'vn.rename'
const VN_INFO = 'vn.info'
const VN_LOCK = 'vn.lock'
const VN_UNLOCK = 'vn.unlock'
const VN_RECOVER = 'vn.recover'
const VN_POOL_INFO = 'vnpool.info'

const Actions = {
  VN_ALLOCATE,
  VN_DELETE,
  VN_AR_ADD,
  VN_AR_RM,
  VN_AR_UPDATE,
  VN_RESERVE,
  VN_AR_FREE,
  VN_HOLD,
  VN_RELEASE,
  VN_UPDATE,
  VN_CHMOD,
  VN_CHOWN,
  VN_RENAME,
  VN_INFO,
  VN_LOCK,
  VN_UNLOCK,
  VN_RECOVER,
  VN_POOL_INFO,
}

module.exports = {
  Actions,
  Commands: {
    [VN_ALLOCATE]: {
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
    [VN_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [VN_AR_ADD]: {
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
      },
    },
    [VN_AR_RM]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        address: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VN_AR_UPDATE]: {
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
      },
    },
    [VN_RESERVE]: {
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
      },
    },
    [VN_AR_FREE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        range: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VN_HOLD]: {
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
      },
    },
    [VN_RELEASE]: {
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
      },
    },
    [VN_UPDATE]: {
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
    [VN_CHMOD]: {
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
    [VN_CHOWN]: {
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
    [VN_RENAME]: {
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
    [VN_INFO]: {
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
    [VN_LOCK]: {
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
      },
    },
    [VN_UNLOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [VN_RECOVER]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        operation: {
          from: postBody,
          default: 1,
        },
      },
    },
    [VN_POOL_INFO]: {
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
        zone: {
          from: query,
          default: 0,
        },
      },
    },
  },
}
