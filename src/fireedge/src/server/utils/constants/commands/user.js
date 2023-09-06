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

const USER_ALLOCATE = 'user.allocate'
const USER_DELETE = 'user.delete'
const USER_PASSWD = 'user.passwd'
const USER_LOGIN = 'user.login'
const USER_UPDATE = 'user.update'
const USER_CHAUTH = 'user.chauth'
const USER_QUOTA = 'user.quota'
const USER_CHGRP = 'user.chgrp'
const USER_ADDGROUP = 'user.addgroup'
const USER_DELGROUP = 'user.delgroup'
const USER_ENABLE = 'user.enable'
const USER_INFO = 'user.info'
const USER_POOL_INFO = 'userpool.info'
const USER_QUOTA_INFO = 'userquota.info'
const USER_QUOTA_UPDATE = 'userquota.update'

const Actions = {
  USER_ALLOCATE,
  USER_DELETE,
  USER_PASSWD,
  USER_LOGIN,
  USER_UPDATE,
  USER_CHAUTH,
  USER_QUOTA,
  USER_CHGRP,
  USER_ADDGROUP,
  USER_DELGROUP,
  USER_ENABLE,
  USER_INFO,
  USER_POOL_INFO,
  USER_QUOTA_INFO,
  USER_QUOTA_UPDATE,
}

module.exports = {
  Actions,
  Commands: {
    [USER_ALLOCATE]: {
      // inspected
      httpMethod: POST,
      params: {
        username: {
          from: postBody,
          default: '',
        },
        password: {
          from: postBody,
          default: '',
        },
        driver: {
          from: postBody,
          default: '',
        },
        group: {
          from: postBody,
          default: [],
          arrayDefault: 0, // this is for the upcast of the internal values of the array
        },
      },
    },
    [USER_DELETE]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: 0,
        },
      },
    },
    [USER_PASSWD]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        password: {
          from: postBody,
          default: '',
        },
      },
    },
    [USER_LOGIN]: {
      // inspected
      httpMethod: POST,
      params: {
        user: {
          from: postBody,
          default: '',
        },
        token: {
          from: postBody,
          default: '',
        },
        expire: {
          from: postBody,
          default: 0,
        },
        gid: {
          from: postBody,
          default: -1,
        },
      },
    },
    [USER_UPDATE]: {
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
    [USER_CHAUTH]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: postBody,
          default: 0,
        },
        driver: {
          from: postBody,
          default: '',
        },
        password: {
          from: postBody,
          default: '',
        },
      },
    },
    [USER_QUOTA]: {
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
      },
    },
    [USER_CHGRP]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        group: {
          from: postBody,
          default: 0,
        },
      },
    },
    [USER_ADDGROUP]: {
      // inspected
      httpMethod: POST,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        group: {
          from: postBody,
          default: 0,
        },
      },
    },
    [USER_DELGROUP]: {
      // inspected
      httpMethod: DELETE,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        group: {
          from: query,
          default: 0,
        },
      },
    },
    [USER_ENABLE]: {
      // inspected
      httpMethod: PUT,
      params: {
        id: {
          from: resource,
          default: 0,
        },
        enable: {
          from: postBody,
          default: true,
        },
      },
    },
    [USER_INFO]: {
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
    [USER_POOL_INFO]: {
      // inspected
      httpMethod: GET,
      params: {},
    },
    [USER_QUOTA_INFO]: {
      // inspected
      httpMethod: GET,
      params: {},
    },
    [USER_QUOTA_UPDATE]: {
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
