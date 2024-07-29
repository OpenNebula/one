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
  from: fromData,
  httpMethod,
} = require('../../../utils/constants/defaults')

const { POST, GET } = httpMethod
const { query, resource, postBody } = fromData

const basepath = '/marketapp'
const MARKETAPP_EXPORT = 'marketapp.export'
const MARKETAPP_DOWNLOAD = 'marketapp.download'
const MARKETAPP_IMPORT = 'marketapp.import'

const Actions = {
  MARKETAPP_EXPORT,
  MARKETAPP_DOWNLOAD,
  MARKETAPP_IMPORT,
}

module.exports = {
  Actions,
  Commands: {
    [MARKETAPP_EXPORT]: {
      path: `${basepath}/export/:id`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        name: {
          from: postBody,
        },
        datastore: {
          from: postBody,
        },
        file: {
          from: postBody,
        },
        associated: {
          from: postBody,
        },
        tag: {
          from: postBody,
        },
        template: {
          from: postBody,
        },
        vmname: {
          from: postBody,
        },
      },
    },
    [MARKETAPP_DOWNLOAD]: {
      path: `${basepath}/download/:id`,
      httpMethod: GET,
      auth: false,
      params: {
        id: {
          from: resource,
        },
        token: {
          from: query,
        },
      },
    },
    [MARKETAPP_IMPORT]: {
      path: `${basepath}/vmimport/:id`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        resource: {
          from: postBody,
        },
        associated: {
          from: postBody,
        },
        marketId: {
          from: postBody,
        },
        vmname: {
          from: postBody,
        },
      },
    },
  },
}
