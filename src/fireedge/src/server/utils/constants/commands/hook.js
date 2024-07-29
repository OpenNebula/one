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

const HOOK_ALLOCATE = 'hook.allocate'
const HOOK_DELETE = 'hook.delete'
const HOOK_INFO = 'hook.info'
const HOOK_RENAME = 'hook.rename'
const HOOK_LOCK = 'hook.lock'
const HOOK_UNLOCK = 'hook.unlock'
const HOOK_RETRY = 'hook.retry'
const HOOK_POOL_INFO = 'hookpool.info'
const HOOK_LOG_INFO = 'hooklog.info'

const Actions = {
  HOOK_ALLOCATE,
  HOOK_DELETE,
  HOOK_INFO,
  HOOK_RENAME,
  HOOK_LOCK,
  HOOK_UNLOCK,
  HOOK_RETRY,
  HOOK_POOL_INFO,
  HOOK_LOG_INFO,
}

module.exports = {
  Actions,
  Commands: {
    [HOOK_ALLOCATE]: {
      // inspected
      httpMethod: POST,
      params: {
        template: {
          from: postBody,
          default: '',
        },
      },
    },
    [HOOK_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [HOOK_DELETE]: {
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
    [HOOK_RENAME]: {
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
    [HOOK_INFO]: {
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
    [HOOK_LOCK]: {
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
    [HOOK_UNLOCK]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [HOOK_RETRY]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        execution: {
          from: postBody,
          default: 0,
        },
      },
    },
    [HOOK_POOL_INFO]: {
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
    [HOOK_LOG_INFO]: {
      // inspected
      httpMethod: GET,
      params: {
        minimun: {
          from: postBody, // epoch time
          default: '',
        },
        maximun: {
          from: postBody, // epoch time
          default: '',
        },
        id: {
          from: postBody,
          default: '', // check
        },
        execution: {
          from: postBody,
          default: 0,
        },
      },
    },
  },
}
