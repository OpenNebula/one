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

const IMAGE_ALLOCATE = 'image.allocate'
const IMAGE_CLONE = 'image.clone'
const IMAGE_DELETE = 'image.delete'
const IMAGE_ENABLE = 'image.enable'
const IMAGE_PERSISTENT = 'image.persistent'
const IMAGE_CHTYPE = 'image.chtype'
const IMAGE_UPDATE = 'image.update'
const IMAGE_CHMOD = 'image.chmod'
const IMAGE_CHOWN = 'image.chown'
const IMAGE_RENAME = 'image.rename'
const IMAGE_SNAPDEL = 'image.snapshotdelete'
const IMAGE_SNAPREV = 'image.snapshotrevert'
const IMAGE_SNAPFLAT = 'image.snapshotflatten'
const IMAGE_INFO = 'image.info'
const IMAGE_LOCK = 'image.lock'
const IMAGE_UNLOCK = 'image.unlock'
const IMAGE_RESTORE = 'image.restore'
const IMAGE_POOL_INFO = 'imagepool.info'

const Actions = {
  IMAGE_ALLOCATE,
  IMAGE_CLONE,
  IMAGE_DELETE,
  IMAGE_ENABLE,
  IMAGE_PERSISTENT,
  IMAGE_CHTYPE,
  IMAGE_UPDATE,
  IMAGE_CHMOD,
  IMAGE_CHOWN,
  IMAGE_RENAME,
  IMAGE_SNAPDEL,
  IMAGE_SNAPREV,
  IMAGE_SNAPFLAT,
  IMAGE_INFO,
  IMAGE_LOCK,
  IMAGE_UNLOCK,
  IMAGE_RESTORE,
  IMAGE_POOL_INFO,
}

module.exports = {
  Actions,
  Commands: {
    [IMAGE_ALLOCATE]: {
      // inspected
      httpMethod: POST,
      params: {
        template: {
          from: postBody,
          default: '',
        },
        datastore: {
          from: postBody,
          default: 0,
        },
        capacity: {
          from: postBody,
          default: false,
        },
      },
    },
    [IMAGE_CLONE]: {
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
        datastore: {
          from: postBody,
          default: -1,
        },
      },
    },
    [IMAGE_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        force: {
          from: postBody,
          default: false,
        },
      },
    },
    [IMAGE_ENABLE]: {
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
    [IMAGE_PERSISTENT]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        persistent: {
          from: postBody,
          default: true,
        },
      },
    },
    [IMAGE_CHTYPE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        type: {
          from: postBody,
          default: '',
        },
      },
    },
    [IMAGE_UPDATE]: {
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
    [IMAGE_CHMOD]: {
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
    [IMAGE_CHOWN]: {
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
    [IMAGE_RENAME]: {
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
    [IMAGE_SNAPDEL]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        snapshot: {
          from: postBody,
          default: 0,
        },
      },
    },
    [IMAGE_SNAPREV]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        snapshot: {
          from: postBody,
          default: 0,
        },
      },
    },
    [IMAGE_SNAPFLAT]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        snapshot: {
          from: postBody,
          default: 0,
        },
      },
    },
    [IMAGE_INFO]: {
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
    [IMAGE_LOCK]: {
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
    [IMAGE_UNLOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [IMAGE_RESTORE]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        datastore: {
          from: postBody,
          default: -1,
        },
        options: {
          from: postBody,
          default: '',
        },
      },
    },
    [IMAGE_POOL_INFO]: {
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
