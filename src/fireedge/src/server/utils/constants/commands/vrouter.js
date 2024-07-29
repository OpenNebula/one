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

const VROUTER_ALLOCATE = 'vrouter.allocate'
const VROUTER_DELETE = 'vrouter.delete'
const VROUTER_INSTANTIATE = 'vrouter.instantiate'
const VROUTER_INSTANTIATE_POSTBODY = 'vrouter.instantiate'
const VROUTER_NIC_ATTACH = 'vrouter.attachnic'
const VROUTER_NIC_DETACH = 'vrouter.detachnic'
const VROUTER_UPDATE = 'vrouter.update'
const VROUTER_CHMOD = 'vrouter.chmod'
const VROUTER_CHOWN = 'vrouter.chown'
const VROUTER_RENAME = 'vrouter.rename'
const VROUTER_INFO = 'vrouter.info'
const VROUTER_LOCK = 'vrouter.lock'
const VROUTER_UNLOCK = 'vrouter.unlock'
const VROUTER_POOL_INFO = 'vrouterpool.info'

const Actions = {
  VROUTER_ALLOCATE,
  VROUTER_DELETE,
  VROUTER_INSTANTIATE,
  VROUTER_INSTANTIATE_POSTBODY,
  VROUTER_NIC_ATTACH,
  VROUTER_NIC_DETACH,
  VROUTER_UPDATE,
  VROUTER_CHMOD,
  VROUTER_CHOWN,
  VROUTER_RENAME,
  VROUTER_INFO,
  VROUTER_LOCK,
  VROUTER_UNLOCK,
  VROUTER_POOL_INFO,
}

module.exports = {
  Actions,
  Commands: {
    [VROUTER_ALLOCATE]: {
      // inspected
      httpMethod: POST,
      params: {
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [VROUTER_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        images: {
          from: query,
          default: false,
        },
      },
    },
    [VROUTER_INSTANTIATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        number: {
          from: postBody,
          default: 1,
        },
        templateId: {
          from: postBody,
          default: 0,
        },
        name: {
          from: postBody,
          default: '',
        },
        pending: {
          from: postBody,
          default: false,
        },
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [VROUTER_INSTANTIATE_POSTBODY]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: postBody,
          default: 0,
        },
        number: {
          from: postBody,
          default: 1,
        },
        templateId: {
          from: postBody,
          default: 0,
        },
        name: {
          from: postBody,
          default: '',
        },
        // HOLD?
        pending: {
          from: postBody,
          default: false,
        },
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [VROUTER_NIC_ATTACH]: {
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
    [VROUTER_NIC_DETACH]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        nic: {
          from: postBody,
          default: 0,
        },
      },
    },
    [VROUTER_UPDATE]: {
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
        update: {
          from: postBody,
          default: 1,
        },
      },
    },
    [VROUTER_CHMOD]: {
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
    [VROUTER_CHOWN]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        userId: {
          from: postBody,
          default: -1,
        },
        groupId: {
          from: postBody,
          default: -1,
        },
      },
    },
    [VROUTER_RENAME]: {
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
    [VROUTER_INFO]: {
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
    [VROUTER_LOCK]: {
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
    [VROUTER_UNLOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [VROUTER_POOL_INFO]: {
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
