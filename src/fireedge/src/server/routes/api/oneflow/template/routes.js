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
} = require('../../../../utils/constants/defaults')

const { GET, POST, DELETE, PUT } = httpMethod
const { resource, postBody } = fromData
const basepath = '/service_template'

const SERVICE_TEMPLATE_SHOW = 'servicetemplate.show'
const SERVICE_TEMPLATE_ACTION = 'servicetemplate.action'
const SERVICE_TEMPLATE_CREATE = 'servicetemplate.create'
const SERVICE_TEMPLATE_UPDATE = 'servicetemplate.update'
const SERVICE_TEMPLATE_DELETE = 'servicetemplate.delete'

const Actions = {
  SERVICE_TEMPLATE_SHOW,
  SERVICE_TEMPLATE_ACTION,
  SERVICE_TEMPLATE_CREATE,
  SERVICE_TEMPLATE_UPDATE,
  SERVICE_TEMPLATE_DELETE,
}

module.exports = {
  Actions,
  Commands: {
    [SERVICE_TEMPLATE_SHOW]: {
      path: `${basepath}/:id?`,
      httpMethod: GET,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
    [SERVICE_TEMPLATE_ACTION]: {
      path: `${basepath}/action/:id`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        action: {
          from: postBody,
        },
      },
    },
    [SERVICE_TEMPLATE_CREATE]: {
      path: `${basepath}`,
      httpMethod: POST,
      auth: true,
      params: {
        template: {
          from: postBody,
        },
      },
    },
    [SERVICE_TEMPLATE_UPDATE]: {
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
    [SERVICE_TEMPLATE_DELETE]: {
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
