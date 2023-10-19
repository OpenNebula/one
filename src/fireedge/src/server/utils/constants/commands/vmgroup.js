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
  httpMethod: { GET, POST, PUT, DELETE },
} = require('../defaults')

const VM_GROUP_ALLOCATE = 'vmgroup.allocate'
const VM_GROUP_ROLEADD = 'vmgroup.roleadd'
const VM_GROUP_ROLEDELETE = 'vmgroup.roledelete'
const VM_GROUP_ROLEUPDATE = 'vmgroup.roleupdate'
const VM_GROUP_DELETE = 'vmgroup.delete'
const VM_GROUP_UPDATE = 'vmgroup.update'
const VM_GROUP_CHMOD = 'vmgroup.chmod'
const VM_GROUP_CHOWN = 'vmgroup.chown'
const VM_GROUP_RENAME = 'vmgroup.rename'
const VM_GROUP_INFO = 'vmgroup.info'
const VM_GROUP_LOCK = 'vmgroup.lock'
const VM_GROUP_UNLOCK = 'vmgroup.unlock'
const VM_GROUP_POOL_INFO = 'vmgrouppool.info'

const Actions = {
  VM_GROUP_ALLOCATE,
  VM_GROUP_ROLEADD,
  VM_GROUP_ROLEDELETE,
  VM_GROUP_ROLEUPDATE,
  VM_GROUP_DELETE,
  VM_GROUP_UPDATE,
  VM_GROUP_CHMOD,
  VM_GROUP_CHOWN,
  VM_GROUP_RENAME,
  VM_GROUP_INFO,
  VM_GROUP_LOCK,
  VM_GROUP_UNLOCK,
  VM_GROUP_POOL_INFO,
}

module.exports = {
  Actions,
  Commands: {
    [VM_GROUP_ALLOCATE]: {
      // inspected
      httpMethod: POST,
      params: {
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    // inspected
    [VM_GROUP_ROLEADD]: {
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
      },
    },
    // inspected
    [VM_GROUP_ROLEDELETE]: {
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        roleId: {
          from: postBody,
          default: -1,
        },
      },
    }, // inspected
    [VM_GROUP_ROLEUPDATE]: {
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        roleId: {
          from: postBody,
          default: -1,
        },
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [VM_GROUP_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: 0,
        },
      },
    },
    [VM_GROUP_UPDATE]: {
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
    [VM_GROUP_CHMOD]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
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
    [VM_GROUP_CHOWN]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
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
    [VM_GROUP_RENAME]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        name: {
          from: query,
          default: '',
        },
      },
    },
    [VM_GROUP_INFO]: {
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
    [VM_GROUP_LOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        lock: {
          from: postBody,
          default: 4,
        },
      },
    },
    [VM_GROUP_UNLOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
      },
    },
    [VM_GROUP_POOL_INFO]: {
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
