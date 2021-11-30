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
const {
  serviceTemplate,
  serviceTemplateDelete,
  serviceTemplateCreate,
  serviceTemplateUpdate,
  serviceTemplateAction,
} = require('./service_template-functions')
const { GET, POST, DELETE, PUT } = httpMethod

const routes = {
  [GET]: {
    list: {
      action: serviceTemplate,
      params: {
        id: { from: fromData.resource, name: 'id', front: true },
      },
    },
  },
  [POST]: {
    create: {
      action: serviceTemplateCreate,
      params: {
        template: { from: fromData.postBody, front: true },
      },
    },
    action: {
      action: serviceTemplateAction,
      params: {
        id: { from: fromData.resource, name: 'id', front: true },
        template: { from: fromData.postBody, front: true },
      },
    },
  },
  [PUT]: {
    update: {
      action: serviceTemplateUpdate,
      params: {
        id: { from: fromData.resource, name: 'id', front: true },
        template: { from: fromData.postBody, front: true },
      },
    },
  },
  [DELETE]: {
    delete: {
      action: serviceTemplateDelete,
      params: {
        id: { from: fromData.resource, name: 'id', front: true },
      },
    },
  },
}

const serviceTemplateApi = {
  routes,
}

module.exports = serviceTemplateApi
