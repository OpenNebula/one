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
  getListResourceProvision,
  getListProvisions,
  getLogProvisions,
  deleteResource,
  deleteProvision,
  hostCommand,
  hostCommandSSH,
  createProvision,
  configureProvision,
  configureHost,
  validate,
  getProvisionDefaults,
} = require('server/routes/api/oneprovision/provision/functions')
const { GET, POST, DELETE, PUT } = httpMethod

const routes = {
  [GET]: {
    null: {
      action: getListProvisions,
      params: {
        id: { from: fromData.resource, name: 'method' },
      },
    },
    cluster: {
      action: getListResourceProvision,
      params: {
        resource: { from: fromData.resource, name: 'id' },
      },
    },
    datastore: {
      action: getListResourceProvision,
      params: {
        resource: { from: fromData.resource, name: 'id' },
      },
    },
    host: {
      action: getListResourceProvision,
      params: {
        resource: { from: fromData.resource, name: 'id' },
      },
    },
    image: {
      action: getListResourceProvision,
      params: {
        resource: { from: fromData.resource, name: 'id' },
      },
    },
    network: {
      action: getListResourceProvision,
      params: {
        resource: { from: fromData.resource, name: 'id' },
      },
    },
    template: {
      action: getListResourceProvision,
      params: {
        resource: { from: fromData.resource, name: 'id' },
      },
    },
    vntemplate: {
      action: getListResourceProvision,
      params: {
        resource: { from: fromData.resource, name: 'id' },
      },
    },
    log: {
      action: getLogProvisions,
      params: {
        id: { from: fromData.resource, name: 'id' },
      },
    },
    defaults: {
      action: getProvisionDefaults,
      params: {},
    },
  },
  [POST]: {
    null: {
      action: createProvision,
      params: {
        resource: { from: fromData.postBody },
      },
      websocket: true,
    },
    validate: {
      action: validate,
      params: {
        resource: { from: fromData.postBody },
      },
    },
    host: {
      poweroff: {
        action: hostCommand,
        params: {
          action: { from: fromData.resource, name: 'id' },
          id: { from: fromData.resource, name: 'id2' },
        },
      },
      reboot: {
        action: hostCommand,
        params: {
          action: { from: fromData.resource, name: 'id' },
          id: { from: fromData.resource, name: 'id2' },
        },
      },
      resume: {
        action: hostCommand,
        params: {
          action: { from: fromData.resource, name: 'id' },
          id: { from: fromData.resource, name: 'id2' },
        },
      },
      ssh: {
        action: hostCommandSSH,
        params: {
          action: { from: fromData.resource, name: 'id' },
          id: { from: fromData.resource, name: 'id2' },
          command: { from: fromData.postBody, name: 'command' },
        },
      },
    },
  },
  [DELETE]: {
    null: {
      action: deleteProvision,
      params: {
        id: { from: fromData.resource, name: 'method' },
        cleanup: { from: fromData.postBody, name: 'cleanup' },
      },
      websocket: true,
    },
    datastore: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id' },
      },
    },
    flowtemplate: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id' },
      },
    },
    host: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id' },
      },
    },
    image: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id' },
      },
    },
    network: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id' },
      },
    },
    vntemplate: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id' },
      },
    },
    template: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id' },
      },
    },
    cluster: {
      action: deleteResource,
      params: {
        resource: { from: fromData.resource, name: 'method' },
        id: { from: fromData.resource, name: 'id' },
      },
    },
  },
  [PUT]: {
    configure: {
      action: configureProvision,
      params: {
        id: { from: fromData.resource, name: 'id' },
      },
      websocket: true,
    },
    host: {
      action: configureHost,
      params: {
        id: { from: fromData.resource, name: 'id' },
      },
    },
  },
}

const provisionApi = {
  routes,
}
module.exports = provisionApi
