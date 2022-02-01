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
const { PROVISION } = require('server/routes/api/oneprovision/basepath')

const { GET, POST, DELETE, PUT } = httpMethod
const basepath = `/${PROVISION}`
const { resource, postBody } = fromData

const PROVISION_CLUSTER_RESOURCE = 'provision.clusterresource'
const PROVISION_DATASTORE_RESOURCE = 'provision.datastoreresource'
const PROVISION_HOST_RESOURCE = 'provision.hostresource'
const PROVISION_IMAGE_RESOURCE = 'provision.imageresource'
const PROVISION_NETWORK_RESOURCE = 'provision.networkresource'
const PROVISION_TEMPLATE_RESOURCE = 'provision.templateresource'
const PROVISION_VNTEMPLATE_RESOURCE = 'provision.vntemplateresource'
const PROVISION_LOGS = 'provision.logs'
const PROVISION_DEFAULTS = 'provision.defauls'
const PROVISION_LIST = 'provision.list'
const PROVISION_VALIDATE = 'provision.validate'
const PROVISION_HOST_POWEROFF = 'provision.hostpoweroff'
const PROVISION_HOST_REBOOT = 'provision.hostreboot'
const PROVISION_HOST_RESUME = 'provision.hostresume'
const PROVISION_CREATE = 'provision.create'
const PROVISION_HOST_SSH = 'provision.hostssh'
const PROVISION_DATASTORE = 'provision.datastore'
const PROVISION_FLOWTEMPLATE = 'provision.flowtemplate'
const PROVISION_DELETE_HOST_RESOURCE = 'provision.deletehostresource'
const PROVISION_DELETE_IMAGE_RESOURCE = 'provision.deleteimageresource'
const PROVISION_DELETE_NETWORK_RESOURCE = 'provision.deletenetworkresource'
const PROVISION_DELETE_VNTEMPLATE_RESOURCE = 'provision.deletevntemplate'
const PROVISION_DELETE_TEMPLATE_RESOURCE = 'provision.deletetemplateresource'
const PROVISION_DELETE_CLUSTER_RESOURCE = 'provision.deleteclusterresource'
const PROVISION_DELETE_PROVISION = 'provision.deleteprovision'
const PROVISION_UPDATE_CONFIGURE = 'provision.updateconfigure'
const PROVISION_UPDATE_HOST = 'provision.updatehost'
const PROVISION_ADD_HOST = 'provison.addhost'
const PROVISION_ADD_IP = 'provision.addip'

const Actions = {
  PROVISION_CLUSTER_RESOURCE,
  PROVISION_DATASTORE_RESOURCE,
  PROVISION_HOST_RESOURCE,
  PROVISION_IMAGE_RESOURCE,
  PROVISION_NETWORK_RESOURCE,
  PROVISION_TEMPLATE_RESOURCE,
  PROVISION_VNTEMPLATE_RESOURCE,
  PROVISION_LOGS,
  PROVISION_DEFAULTS,
  PROVISION_LIST,
  PROVISION_VALIDATE,
  PROVISION_HOST_POWEROFF,
  PROVISION_HOST_REBOOT,
  PROVISION_HOST_RESUME,
  PROVISION_CREATE,
  PROVISION_HOST_SSH,
  PROVISION_DATASTORE,
  PROVISION_FLOWTEMPLATE,
  PROVISION_DELETE_HOST_RESOURCE,
  PROVISION_DELETE_IMAGE_RESOURCE,
  PROVISION_DELETE_NETWORK_RESOURCE,
  PROVISION_DELETE_VNTEMPLATE_RESOURCE,
  PROVISION_DELETE_TEMPLATE_RESOURCE,
  PROVISION_DELETE_CLUSTER_RESOURCE,
  PROVISION_DELETE_PROVISION,
  PROVISION_UPDATE_CONFIGURE,
  PROVISION_UPDATE_HOST,
  PROVISION_ADD_HOST,
  PROVISION_ADD_IP,
}

module.exports = {
  Actions,
  Commands: {
    [PROVISION_CLUSTER_RESOURCE]: {
      path: `${basepath}/cluster/:resource`,
      httpMethod: GET,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
      },
    },
    [PROVISION_DATASTORE_RESOURCE]: {
      path: `${basepath}/datastore/:resource`,
      httpMethod: GET,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
      },
    },
    [PROVISION_HOST_RESOURCE]: {
      path: `${basepath}/host/:resource`,
      httpMethod: GET,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
      },
    },
    [PROVISION_IMAGE_RESOURCE]: {
      path: `${basepath}/image/:resource`,
      httpMethod: GET,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
      },
    },
    [PROVISION_NETWORK_RESOURCE]: {
      path: `${basepath}/network/:resource`,
      httpMethod: GET,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
      },
    },
    [PROVISION_TEMPLATE_RESOURCE]: {
      path: `${basepath}/template/:resource`,
      httpMethod: GET,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
      },
    },
    [PROVISION_VNTEMPLATE_RESOURCE]: {
      path: `${basepath}/vntemplate/:resource`,
      httpMethod: GET,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
      },
    },
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
    [PROVISION_HOST_POWEROFF]: {
      path: `${basepath}/host/poweroff/:action/:id`,
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
    [PROVISION_HOST_REBOOT]: {
      path: `${basepath}/host/reboot/:action/:id`,
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
    [PROVISION_HOST_RESUME]: {
      path: `${basepath}/host/resume/:action/:id`,
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
    [PROVISION_CREATE]: {
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
    [PROVISION_HOST_SSH]: {
      path: `${basepath}/host/ssh/:action/:id/:command`,
      httpMethod: DELETE,
      auth: true,
      params: {
        action: {
          from: resource,
        },
        id: {
          from: resource,
        },
        command: {
          from: postBody,
        },
      },
    },
    [PROVISION_DATASTORE]: {
      path: `${basepath}/datastore/:resource/:id`,
      httpMethod: DELETE,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
        id: {
          from: resource,
        },
      },
    },
    [PROVISION_FLOWTEMPLATE]: {
      path: `${basepath}/flowtemplate/:resource/:id`,
      httpMethod: DELETE,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
        id: {
          from: resource,
        },
      },
    },
    [PROVISION_DELETE_HOST_RESOURCE]: {
      path: `${basepath}/host/:resource/:id`,
      httpMethod: DELETE,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
        id: {
          from: resource,
        },
      },
    },
    [PROVISION_DELETE_IMAGE_RESOURCE]: {
      path: `${basepath}/image/:resource/:id`,
      httpMethod: DELETE,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
        id: {
          from: resource,
        },
      },
    },
    [PROVISION_DELETE_NETWORK_RESOURCE]: {
      path: `${basepath}/network/:resource/:id`,
      httpMethod: DELETE,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
        id: {
          from: resource,
        },
      },
    },
    [PROVISION_DELETE_VNTEMPLATE_RESOURCE]: {
      path: `${basepath}/vntemplate/:resource/:id`,
      httpMethod: DELETE,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
        id: {
          from: resource,
        },
      },
    },
    [PROVISION_DELETE_TEMPLATE_RESOURCE]: {
      path: `${basepath}/template/:resource/:id`,
      httpMethod: DELETE,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
        id: {
          from: resource,
        },
      },
    },
    [PROVISION_DELETE_CLUSTER_RESOURCE]: {
      path: `${basepath}/cluster/:resource/:id`,
      httpMethod: DELETE,
      auth: true,
      params: {
        resource: {
          from: resource,
        },
        id: {
          from: resource,
        },
      },
    },
    [PROVISION_DELETE_PROVISION]: {
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
    [PROVISION_UPDATE_CONFIGURE]: {
      path: `${basepath}/configure/:id`,
      httpMethod: PUT,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
    [PROVISION_UPDATE_HOST]: {
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
      path: `${basepath}/host/:id`,
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
