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

const basepath = '/vdc'
const { POST, PUT } = httpMethod
const { resource, postBody } = fromData

const VDC_CREATE = 'vdc.create'
const VDC_UPDATE = 'vdc.updateVdc'

const Actions = {
  VDC_CREATE,
  VDC_UPDATE,
}

module.exports = {
  Actions,
  Commands: {
    [VDC_CREATE]: {
      path: `${basepath}/create`,
      httpMethod: POST,
      auth: true,
      params: {
        hosts: {
          from: postBody,
        },
        datastores: {
          from: postBody,
        },
        vnets: {
          from: postBody,
        },
        groups: {
          from: postBody,
        },
        clusters: {
          from: postBody,
        },
        template: {
          from: postBody,
        },
      },
    },
    [VDC_UPDATE]: {
      path: `${basepath}/updateVdc/:id`,
      httpMethod: PUT,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        hosts: {
          from: postBody,
        },
        datastores: {
          from: postBody,
        },
        vnets: {
          from: postBody,
        },
        groups: {
          from: postBody,
        },
        clusters: {
          from: postBody,
        },
        template: {
          from: postBody,
        },
      },
    },
  },
}
