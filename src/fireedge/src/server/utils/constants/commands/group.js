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

const GROUP_ALLOCATE = 'group.allocate'
const GROUP_DELETE = 'group.delete'
const GROUP_INFO = 'group.info'
const GROUP_UPDATE = 'group.update'
const GROUP_ADDADMIN = 'group.addadmin'
const GROUP_DELADMIN = 'group.deladmin'
const GROUP_QUOTA = 'group.quota'
const GROUP_POOL_INFO = 'grouppool.info'
const GROUP_QUOTA_INFO = 'groupquota.info'
const GROUP_QUOTA_UPDATE = 'groupquota.update'

const Actions = {
  GROUP_ALLOCATE,
  GROUP_DELETE,
  GROUP_INFO,
  GROUP_UPDATE,
  GROUP_ADDADMIN,
  GROUP_DELADMIN,
  GROUP_QUOTA,
  GROUP_POOL_INFO,
  GROUP_QUOTA_INFO,
  GROUP_QUOTA_UPDATE,
}

module.exports = {
  Actions,
  Commands: {
    [GROUP_ALLOCATE]: {
      // inspected
      httpMethod: POST,
      params: {
        name: {
          from: postBody,
          default: '',
        },
      },
    },
    [GROUP_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
      },
    },
    [GROUP_INFO]: {
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
    [GROUP_UPDATE]: {
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
    [GROUP_ADDADMIN]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        user: {
          from: postBody,
          default: 0,
        },
      },
    },
    [GROUP_DELADMIN]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: -1,
        },
        user: {
          from: postBody,
          default: 0,
        },
      },
    },
    [GROUP_QUOTA]: {
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
    [GROUP_POOL_INFO]: {
      // inspected
      httpMethod: GET,
      params: {},
    },
    [GROUP_QUOTA_INFO]: {
      // inspected
      httpMethod: GET,
      params: {},
    },
    [GROUP_QUOTA_UPDATE]: {
      // inspected
      httpMethod: PUT,
      params: {
        template: {
          from: postBody,
          default: '',
        },
      },
    },
  },
}
