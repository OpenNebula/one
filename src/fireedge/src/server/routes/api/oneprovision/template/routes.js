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

const { from: fromData } = require('server/utils/constants/defaults')
const { httpMethod } = require('server/utils/constants/defaults')

const basepath = '/provision-template'
const { GET, POST, PUT, DELETE } = httpMethod
const { resource, postBody } = fromData

const PROVISIONTEMPLATE_SHOW = 'provisiontemplate.show'
const PROVISIONTEMPLATE_INSTANTIATE = 'provisiontemplate.instantiate'
const PROVISIONTEMPLATE_CREATE = 'provisiontemplate.create'
const PROVISIONTEMPLATE_UPDATE = 'provisiontemplate.update'
const PROVISIONTEMPLATE_DELETE = 'provisiontemplate.delete'

const Actions = {
  PROVISIONTEMPLATE_SHOW,
  PROVISIONTEMPLATE_INSTANTIATE,
  PROVISIONTEMPLATE_CREATE,
  PROVISIONTEMPLATE_UPDATE,
  PROVISIONTEMPLATE_DELETE,
}

module.exports = {
  Actions,
  Commands: {
    [PROVISIONTEMPLATE_SHOW]: {
      path: `${basepath}/:id`,
      httpMethod: GET,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
    [PROVISIONTEMPLATE_INSTANTIATE]: {
      path: `${basepath}/instantiate/:id`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
    [PROVISIONTEMPLATE_CREATE]: {
      path: `${basepath}`,
      httpMethod: POST,
      auth: true,
      params: {
        resource: {
          from: postBody,
          all: true,
        },
      },
    },
    [PROVISIONTEMPLATE_UPDATE]: {
      path: `${basepath}/:id`,
      httpMethod: PUT,
      auth: true,
      params: {
        resource: {
          from: postBody,
          all: true,
        },
        id: {
          from: resource,
        },
      },
    },
    [PROVISIONTEMPLATE_DELETE]: {
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
