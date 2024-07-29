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
  httpMethod,
  from: fromData,
} = require('../../../utils/constants/defaults')

const { POST, GET, PUT } = httpMethod
const basepath = '/zendesk'
const { resource, postBody } = fromData

const ZENDESK_LOGIN = 'zendesk.login'
const ZENDESK_CREATE = 'zendesk.create'
const ZENDESK_UPDATE = 'zendesk.update'
const ZENDESK_COMMENT = 'zendesk.comment'
const ZENDESK_LIST = 'zendesk.list'

const Actions = {
  ZENDESK_LOGIN,
  ZENDESK_CREATE,
  ZENDESK_UPDATE,
  ZENDESK_COMMENT,
  ZENDESK_LIST,
}

module.exports = {
  Actions,
  Commands: {
    [ZENDESK_LOGIN]: {
      path: `${basepath}/login`,
      httpMethod: POST,
      auth: true,
      params: {
        user: {
          from: postBody,
        },
        pass: {
          from: postBody,
        },
      },
    },
    [ZENDESK_CREATE]: {
      path: `${basepath}`,
      httpMethod: POST,
      auth: true,
      params: {
        subject: {
          from: postBody,
        },
        body: {
          from: postBody,
        },
        version: {
          from: postBody,
        },
        severity: {
          from: postBody,
        },
      },
    },
    [ZENDESK_UPDATE]: {
      path: `${basepath}/:id`,
      httpMethod: PUT,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        body: {
          from: postBody,
        },
        solved: {
          from: postBody,
        },
        attachments: {
          from: 'files',
        },
      },
    },
    [ZENDESK_COMMENT]: {
      path: `${basepath}/comments/:id`,
      httpMethod: GET,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
    [ZENDESK_LIST]: {
      path: `${basepath}`,
      httpMethod: GET,
      auth: true,
    },
  },
}
