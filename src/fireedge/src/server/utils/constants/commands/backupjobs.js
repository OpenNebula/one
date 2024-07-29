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

const baseCommand = 'backupjob'
const baseCommandPool = `${baseCommand}pool`

const BACKUPJOB_ALLOCATE = `${baseCommand}.allocate`
const BACKUPJOB_DELETE = `${baseCommand}.delete`
const BACKUPJOB_INFO = `${baseCommand}.info`
const BACKUPJOB_UPDATE = `${baseCommand}.update`
const BACKUPJOB_RENAME = `${baseCommand}.rename`
const BACKUPJOB_CHOWN = `${baseCommand}.chown`
const BACKUPJOB_CHMOD = `${baseCommand}.chmod`
const BACKUPJOB_LOCK = `${baseCommand}.lock`
const BACKUPJOB_UNLOCK = `${baseCommand}.unlock`
const BACKUPJOB_BACKUP = `${baseCommand}.backup`
const BACKUPJOB_CANCEL = `${baseCommand}.cancel`
const BACKUPJOB_RETRY = `${baseCommand}.retry`
const BACKUPJOB_PRIORITY = `${baseCommand}.priority`
const BACKUPJOB_SCHED_ADD = `${baseCommand}.schedadd`
const BACKUPJOB_SCHED_DELETE = `${baseCommand}.scheddelete`
const BACKUPJOB_SCHED_UPDATE = `${baseCommand}.schedupdate`
const BACKUPJOB_POOL_INFO = `${baseCommandPool}.info`

const Actions = {
  BACKUPJOB_ALLOCATE,
  BACKUPJOB_DELETE,
  BACKUPJOB_INFO,
  BACKUPJOB_UPDATE,
  BACKUPJOB_RENAME,
  BACKUPJOB_CHOWN,
  BACKUPJOB_CHMOD,
  BACKUPJOB_LOCK,
  BACKUPJOB_UNLOCK,
  BACKUPJOB_BACKUP,
  BACKUPJOB_CANCEL,
  BACKUPJOB_RETRY,
  BACKUPJOB_PRIORITY,
  BACKUPJOB_SCHED_ADD,
  BACKUPJOB_SCHED_DELETE,
  BACKUPJOB_SCHED_UPDATE,
  BACKUPJOB_POOL_INFO,
}

module.exports = {
  Actions,
  Commands: {
    [BACKUPJOB_ALLOCATE]: {
      // inspected
      httpMethod: POST,
      params: {
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [BACKUPJOB_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [BACKUPJOB_INFO]: {
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
    [BACKUPJOB_UPDATE]: {
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
    [BACKUPJOB_RENAME]: {
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
    [BACKUPJOB_CHOWN]: {
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
    [BACKUPJOB_CHMOD]: {
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
    [BACKUPJOB_LOCK]: {
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
    [BACKUPJOB_UNLOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [BACKUPJOB_BACKUP]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [BACKUPJOB_CANCEL]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [BACKUPJOB_RETRY]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [BACKUPJOB_PRIORITY]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        priority: {
          from: postBody,
          default: 0,
        },
      },
    },
    [BACKUPJOB_SCHED_ADD]: {
      // inspected
      httpMethod: POST,
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
    [BACKUPJOB_SCHED_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        schedId: {
          from: postBody,
          default: 0,
        },
      },
    },
    [BACKUPJOB_SCHED_UPDATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        schedId: {
          from: postBody,
          default: 0,
        },
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [BACKUPJOB_POOL_INFO]: {
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
