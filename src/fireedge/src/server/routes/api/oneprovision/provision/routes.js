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
const basepath = '/provision'

const PROVISION_LOGS = 'provision.logs'
const PROVISION_DEFAULTS = 'provision.defaults'
const PROVISION_LIST = 'provision.list'
const PROVISION_VALIDATE = 'provision.validate'
const PROVISION_CREATE = 'provision.create'
const PROVISION_DELETE = 'provision.delete'
const PROVISION_CONFIGURE = 'provision.configure'
// cluster, datastore, host, image, network, template, vntemplate, flowtemplate
const PROVISION_GET_RESOURCE = 'provision.get_resource'
const PROVISION_DELETE_RESOURCE = 'provision.delete_resource'
// actions: poweroff, reboot, resume, update, configure, ssh
const PROVISION_HOST_ACTION = 'provision.host_action'
const PROVISION_HOST_CONFIGURE = 'provision.host_configure'
const PROVISION_ADD_HOST = 'provision.add_host'
const PROVISION_ADD_IP = 'provision.add_ip'

const Actions = {
  PROVISION_LOGS,
  PROVISION_DEFAULTS,
  PROVISION_LIST,
  PROVISION_VALIDATE,
  PROVISION_CREATE,
  PROVISION_DELETE,
  PROVISION_CONFIGURE,
  PROVISION_GET_RESOURCE,
  PROVISION_DELETE_RESOURCE,
  PROVISION_HOST_ACTION,
  PROVISION_HOST_CONFIGURE,
  PROVISION_ADD_HOST,
  PROVISION_ADD_IP,
}

module.exports = {
  Actions,
  Commands: {
    [PROVISION_LOGS]: {
      path: `${basepath}/log/:id`,
      httpMethod: GET,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
    [PROVISION_DEFAULTS]: {
      path: `${basepath}/defaults`,
      httpMethod: GET,
      auth: true,
    },
    [PROVISION_LIST]: {
      path: `${basepath}/:id?`,
      httpMethod: GET,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
    [PROVISION_VALIDATE]: {
      path: `${basepath}/validate`,
      httpMethod: POST,
      auth: true,
      params: {
        resource: {
          from: postBody,
        },
      },
    },
    [PROVISION_CREATE]: {
      path: `${basepath}`,
      httpMethod: POST,
      auth: true,
      params: {
        data: {
          from: postBody,
        },
      },
    },
    [PROVISION_DELETE]: {
      path: `${basepath}/:id`,
      httpMethod: DELETE,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        cleanup: {
          from: postBody,
        },
        force: {
          from: postBody,
        },
      },
    },
    [PROVISION_CONFIGURE]: {
      path: `${basepath}/configure/:id`,
      httpMethod: PUT,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        force: {
          from: postBody,
        },
      },
    },
    [PROVISION_GET_RESOURCE]: {
      path: `${basepath}/resource/:resource`,
      httpMethod: GET,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
      },
    },
    [PROVISION_DELETE_RESOURCE]: {
      path: `${basepath}/resource/:resource/:id/:provision`,
      httpMethod: DELETE,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
        id: {
          from: resource,
        },
        provision: {
          from: resource,
        },
      },
    },
    [PROVISION_HOST_ACTION]: {
      path: `${basepath}/host/:action/:id`,
      httpMethod: POST,
      auth: true,
      params: {
        action: {
          from: resource,
        },
        id: {
          from: resource,
        },
      },
    },
    [PROVISION_HOST_CONFIGURE]: {
      path: `${basepath}/host/:id`,
      httpMethod: PUT,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
    [PROVISION_ADD_HOST]: {
      path: `${basepath}/addhost/:id`,
      httpMethod: PUT,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        amount: {
          from: postBody,
        },
      },
    },
    [PROVISION_ADD_IP]: {
      path: `${basepath}/ip/:id`,
      httpMethod: PUT,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        amount: {
          from: postBody,
        },
      },
    },
  },
}
