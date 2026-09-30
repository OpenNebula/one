/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

const basepath = '/oneks'
const ApiBasePath = '/clusters'
const ApiBasePathNodeGroups = '/nodegroups'
const ApiBasePathApplications = '/applications'
const { GET, POST, DELETE, PATCH } = httpMethod
const { resource, postBody, query } = fromData

const Actions = {
  LIST: 'oneks.list',
  LIST_APPLICATIONS: 'oneks.list_applications',
  SHOW_APPLICATION: 'oneks.show_application',
  LIST_CLUSTER_APPLICATIONS: 'oneks.list_cluster_applications',
  SHOW_CLUSTER_APPLICATION: 'oneks.show_cluster_application',
  INSTALL_APPLICATION: 'oneks.install_application',
  DELETE_CLUSTER_APPLICATION: 'oneks.delete_cluster_application',
  LIST_FAMILIES: 'oneks.list_families',
  LIST_NODEGROUP_FAMILIES: 'oneks.list_nodegroup_families',
  SHOW: 'oneks.show',
  SHOW_FAMILY: 'oneks.show_families',
  VALIDATE_DEPLOYMENT: 'oneks.validate_deployment',
  CREATE: 'oneks.create',
  DELETE: 'oneks.delete',
  KUBECONFIG: 'oneks.kubeconfig',
  ENDPOINT: 'oneks.endpoint',
  HISTORIC: 'oneks.historic',
  CREATE_NODEGROUP: 'oneks.create_nodegroup',
  UPDATE_NODEGROUP: 'oneks.update_nodegroup',
  DELETE_NODEGROUP: 'oneks.delete_nodegroup',
  SCALE_NODEGROUP: 'oneks.scale_nodegroup',
  LOGS: 'oneks.log',
  RECOVER: 'oneks.recover',
  RECOVER_NODEGROUP: 'oneks.recover_nodegroup',
  CHMOD: 'oneks.chmod',
  CHOWN: 'oneks.chown',
  CHGRP: 'oneks.chgrp',
  UPDATE_DOCUMENT: 'oneks.update_document',
  UPGRADE_KUBERNETES_VERSION: 'oneks.upgrade_kubernetes_version',
}

const Commands = {
  [Actions.LIST]: {
    path: `${basepath}/`,
    apiPath: ApiBasePath,
    httpMethod: GET,
    auth: true,
  },
  [Actions.LIST_APPLICATIONS]: {
    path: `${basepath}/applications`,
    apiPath: ApiBasePathApplications,
    httpMethod: GET,
    auth: true,
    params: {
      all: {
        from: query,
      },
      cluster_id: {
        from: query,
      },
    },
  },
  [Actions.SHOW_APPLICATION]: {
    path: `${basepath}/applications/:application_id`,
    apiPath: `${ApiBasePathApplications}/{0}`,
    httpMethod: GET,
    auth: true,
    params: {
      application_id: {
        from: resource,
      },
      cluster_id: {
        from: query,
      },
    },
  },
  [Actions.LIST_CLUSTER_APPLICATIONS]: {
    path: `${basepath}/:id/applications`,
    apiPath: `${ApiBasePath}/{0}/applications`,
    httpMethod: GET,
    auth: true,
    params: {
      id: {
        from: resource,
      },
      all: {
        from: query,
      },
    },
  },
  [Actions.INSTALL_APPLICATION]: {
    path: `${basepath}/:id/applications`,
    apiPath: `${ApiBasePath}/{0}/applications`,
    httpMethod: POST,
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
  [Actions.SHOW_CLUSTER_APPLICATION]: {
    path: `${basepath}/:id/applications/:release_name`,
    apiPath: `${ApiBasePath}/{0}/applications/{1}`,
    httpMethod: GET,
    auth: true,
    params: {
      id: { from: resource },
      release_name: { from: resource },
    },
  },
  [Actions.DELETE_CLUSTER_APPLICATION]: {
    path: `${basepath}/:id/applications/:release_name`,
    apiPath: `${ApiBasePath}/{0}/applications/{1}`,
    httpMethod: DELETE,
    auth: true,
    params: {
      id: { from: resource },
      release_name: { from: resource },
    },
  },
  [Actions.LIST_FAMILIES]: {
    path: `${basepath}/families`,
    apiPath: `${ApiBasePath}/families`,
    httpMethod: GET,
    auth: true,
  },
  [Actions.LIST_NODEGROUP_FAMILIES]: {
    path: `${basepath}/nodegroups/families`,
    apiPath: `${ApiBasePathNodeGroups}/families`,
    httpMethod: GET,
    auth: true,
  },
  [Actions.SHOW]: {
    path: `${basepath}/:id`,
    apiPath: `${ApiBasePath}/{0}`,
    httpMethod: GET,
    auth: true,
    params: {
      id: {
        from: resource,
      },
      expand: {
        from: query,
      },
    },
  },
  [Actions.SHOW_FAMILY]: {
    path: `${basepath}/families/:name`,
    apiPath: `${ApiBasePath}/families/{0}`,
    httpMethod: GET,
    auth: true,
    params: {
      name: {
        from: resource,
      },
    },
  },
  [Actions.VALIDATE_DEPLOYMENT]: {
    path: `${basepath}/deployment/validate`,
    apiPath: `${ApiBasePath}/deployment/validate`,
    httpMethod: POST,
    auth: true,
    params: {
      template: {
        from: postBody,
      },
    },
  },
  [Actions.CREATE]: {
    path: `${basepath}`,
    apiPath: ApiBasePath,
    httpMethod: POST,
    auth: true,
    params: {
      template: {
        from: postBody,
      },
    },
  },
  [Actions.DELETE]: {
    path: `${basepath}/:id`,
    apiPath: `${ApiBasePath}/{0}`,
    httpMethod: DELETE,
    auth: true,
    params: {
      id: {
        from: resource,
      },
      force: {
        from: query,
      },
    },
  },
  [Actions.SCALE_NODEGROUP]: {
    path: `${basepath}/:id/nodegroups/:nodegroup_id/scale`,
    apiPath: `${ApiBasePath}/{0}/nodegroups/{1}/scale`,
    httpMethod: POST,
    auth: true,
    params: {
      id: {
        from: resource,
      },
      nodegroup_id: {
        from: resource,
      },
      template: {
        from: postBody,
      },
    },
  },
  [Actions.KUBECONFIG]: {
    path: `${basepath}/kubeconfig/:id`,
    apiPath: `${ApiBasePath}/{0}/kubeconfig`,
    httpMethod: GET,
    auth: true,
    params: {
      id: {
        from: resource,
      },
    },
  },
  [Actions.ENDPOINT]: {
    path: `${basepath}/endpoint/:id`,
    apiPath: `${ApiBasePath}/{0}/endpoint`,
    httpMethod: GET,
    auth: true,
    params: {
      id: {
        from: resource,
      },
    },
  },
  [Actions.HISTORIC]: {
    path: `${basepath}/:id/historic`,
    apiPath: `${ApiBasePath}/{0}/historic`,
    httpMethod: GET,
    auth: true,
    params: {
      id: {
        from: resource,
      },
    },
  },
  [Actions.CREATE_NODEGROUP]: {
    path: `${basepath}/:id/nodegroups`,
    apiPath: `${ApiBasePath}/{0}/nodegroups`,
    httpMethod: POST,
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
  [Actions.UPDATE_NODEGROUP]: {
    path: `${basepath}/:id/nodegroups/:nodegroup_id`,
    apiPath: `${ApiBasePath}/{0}/nodegroups/{1}`,
    httpMethod: PATCH,
    auth: true,
    params: {
      id: {
        from: resource,
      },
      nodegroup_id: {
        from: resource,
      },
      template: {
        from: postBody,
      },
    },
  },
  [Actions.DELETE_NODEGROUP]: {
    path: `${basepath}/:id/nodegroups/:nodegroup_id`,
    apiPath: `${ApiBasePath}/{0}/nodegroups/{1}`,
    httpMethod: DELETE,
    auth: true,
    params: {
      id: {
        from: resource,
      },
      nodegroup_id: {
        from: resource,
      },
    },
  },
  [Actions.LOGS]: {
    path: `${basepath}/:id/logs`,
    apiPath: `${ApiBasePath}/{0}/logs`,
    httpMethod: GET,
    auth: true,
    params: {
      id: {
        from: resource,
      },
    },
  },
  [Actions.RECOVER]: {
    path: `${basepath}/:id/recover`,
    apiPath: `${ApiBasePath}/{0}/recover`,
    httpMethod: POST,
    auth: true,
    params: {
      id: {
        from: resource,
      },
    },
  },
  [Actions.RECOVER_NODEGROUP]: {
    path: `${basepath}/:id/nodegroups/:nodegroup_id/recover`,
    apiPath: `${ApiBasePath}/{0}/nodegroups/{1}/recover`,
    httpMethod: POST,
    auth: true,
    params: {
      id: {
        from: resource,
      },
      nodegroup_id: {
        from: resource,
      },
    },
  },
  [Actions.CHMOD]: {
    path: `${basepath}/:id/chmod`,
    apiPath: `${ApiBasePath}/{0}/chmod`,
    httpMethod: POST,
    auth: true,
    params: {
      id: {
        from: resource,
      },
      octet: {
        from: postBody,
      },
    },
  },
  [Actions.CHOWN]: {
    path: `${basepath}/:id/chown`,
    apiPath: `${ApiBasePath}/{0}/chown`,
    httpMethod: POST,
    auth: true,
    params: {
      id: {
        from: resource,
      },
      owner_id: {
        from: postBody,
      },
      group_id: {
        from: postBody,
      },
    },
  },
  [Actions.CHGRP]: {
    path: `${basepath}/:id/chgrp`,
    apiPath: `${ApiBasePath}/{0}/chgrp`,
    httpMethod: POST,
    auth: true,
    params: {
      id: {
        from: resource,
      },
      group_id: {
        from: postBody,
      },
    },
  },
  [Actions.UPGRADE_KUBERNETES_VERSION]: {
    path: `${basepath}/:id/upgrade`,
    apiPath: `${ApiBasePath}/{0}/upgrade`,
    httpMethod: POST,
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
  [Actions.UPDATE_DOCUMENT]: {
    path: `${basepath}/:id`,
    apiPath: `${ApiBasePath}/{0}`,
    httpMethod: PATCH,
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
}

module.exports = { Actions, Commands }
