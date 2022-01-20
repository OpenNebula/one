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
  from: fromData,
  httpMethod,
} = require('server/utils/constants/defaults')
const {
  getListProviders,
  getConnectionProviders,
  createProviders,
  updateProviders,
  deleteProvider,
  getProviderConfig,
} = require('server/routes/api/oneprovision/provider/functions')

const { GET, POST, PUT, DELETE } = httpMethod

const routes = {
  [GET]: {
    null: {
      action: getListProviders,
      params: {
        id: { from: fromData.resource, name: 'method' },
      },
    },
    connection: {
      action: getConnectionProviders,
      params: {
        id: { from: fromData.resource, name: 'id' },
      },
    },
    config: {
      action: getProviderConfig,
      params: {},
    },
  },
  [POST]: {
    null: {
      action: createProviders,
      params: {
        resource: { from: fromData.postBody },
      },
    },
  },
  [PUT]: {
    null: {
      action: updateProviders,
      params: {
        resource: { from: fromData.postBody },
        id: { from: fromData.resource, name: 'method' },
      },
    },
  },
  [DELETE]: {
    null: {
      action: deleteProvider,
      params: {
        id: { from: fromData.resource, name: 'method' },
      },
    },
  },
}

const providerApi = {
  routes,
}
module.exports = providerApi
