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
const { SERVICE_TEMPLATE } = require('server/routes/api/oneflow/basepath')

const { GET, POST, DELETE, PUT } = httpMethod
const basepath = `/${SERVICE_TEMPLATE}`
const { resource, postBody } = fromData

const SERVICETEMPLATE_SHOW = 'servicetemplate.show'
const SERVICETEMPLATE_ACTION = 'servicetemplate.action'
const SERVICETEMPLATE_CREATE = 'servicetemplate.create'
const SERVICETEMPLATE_UPDATE = 'servicetemplate.update'
const SERVICETEMPLATE_DELETE = 'servicetemplate.delete'

const Actions = {
  SERVICETEMPLATE_SHOW,
  SERVICETEMPLATE_ACTION,
  SERVICETEMPLATE_CREATE,
  SERVICETEMPLATE_UPDATE,
  SERVICETEMPLATE_DELETE,
}

module.exports = {
  Actions,
  Commands: {
    [SERVICETEMPLATE_SHOW]: {
      path: `${basepath}/:id`,
      httpMethod: GET,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
    [SERVICETEMPLATE_ACTION]: {
      path: `${basepath}/action/:id`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        template: {
          from: postBody,
        },
      },
    },
    [SERVICETEMPLATE_CREATE]: {
      path: `${basepath}`,
      httpMethod: POST,
      auth: true,
      params: {
        template: {
          from: postBody,
        },
      },
    },
    [SERVICETEMPLATE_UPDATE]: {
      path: `${basepath}/:id`,
      httpMethod: PUT,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        template: {
          from: postBody,
        },
      },
    },
    [SERVICETEMPLATE_DELETE]: {
      path: `${basepath}/:id`,
      httpMethod: DELETE,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
  },
}
