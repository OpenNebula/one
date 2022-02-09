/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
const MARKETAPP = require('server/routes/api/marketapp/basepath')

const { POST, GET } = httpMethod
const basepath = `/${MARKETAPP}`
const { query, resource, postBody } = fromData
const MARKETAPP_EXPORT = 'marketapp.export'
const MARKETAPP_VMIMPORT = 'marketapp.vmimport'
const MARKETAPP_TEMPLATEIMPORT = 'marketapp.templateimport'
const MARKETAPP_DOCKERTAGS = 'marketapp.dockertags'

const Actions = {
  MARKETAPP_EXPORT,
  MARKETAPP_VMIMPORT,
  MARKETAPP_TEMPLATEIMPORT,
  MARKETAPP_DOCKERTAGS,
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
    [MARKETAPP_VMIMPORT]: {
      path: `${basepath}/vmimport/:vmId`,
      httpMethod: POST,
      auth: true,
      params: {
        vmId: {
          from: resource,
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
    [MARKETAPP_TEMPLATEIMPORT]: {
      path: `${basepath}/templateimport/:templateId`,
      httpMethod: POST,
      auth: true,
      params: {
        templateId: {
          from: resource,
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
    [MARKETAPP_DOCKERTAGS]: {
      path: `${basepath}/dockertags/:id`,
      httpMethod: GET,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        page: {
          from: query,
        },
      },
    },
  },
}
