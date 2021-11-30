/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
  httpMethod,
  from: fromData,
} = require('server/utils/constants/defaults')
const { login, list, comments, create, update } = require('./zendesk-functions')
const { POST, GET, PUT } = httpMethod

const routes = {
  [POST]: {
    login: {
      action: login,
      params: {
        user: {
          from: fromData.postBody,
          name: 'user',
        },
        pass: {
          from: fromData.postBody,
          name: 'pass',
        },
      },
    },
    create: {
      action: create,
      params: {
        subject: {
          from: fromData.postBody,
          name: 'subject',
        },
        body: {
          from: fromData.postBody,
          name: 'body',
        },
        version: {
          from: fromData.postBody,
          name: 'version',
        },
        severity: {
          from: fromData.postBody,
          name: 'severity',
        },
      },
    },
  },
  [PUT]: {
    update: {
      action: update,
      params: {
        id: {
          from: fromData.resource,
          name: 'id',
        },
        body: {
          from: fromData.postBody,
          name: 'body',
        },
        solved: {
          from: fromData.postBody,
          name: 'solved',
        },
        attachments: {
          from: 'files',
          name: 'attachments',
        },
      },
    },
  },
  [GET]: {
    list: {
      action: list,
      params: {},
    },
    comments: {
      action: comments,
      params: {
        id: {
          from: fromData.resource,
          name: 'id',
        },
      },
    },
  },
}

const authApi = {
  routes,
}
module.exports = authApi
