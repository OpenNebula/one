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
} = require('../../../../utils/constants/defaults')

const basepath = '/provisions'
const { resource, postBody, query } = fromData
const { GET, POST, DELETE, PATCH } = httpMethod

const Actions = {
  LIST: 'provisions.list',
  CREATE: 'provisions.create',
  SHOW: 'provisions.show',
  UPDATE: 'provisions.update',
  DELETE: 'provisions.delete',
  RECOVER: 'provisions.recover',
  ADD_HOSTS: 'provisions.addHosts',
  DELETE_HOSTS: 'provisions.deleteHosts',
  ADD_PUBLIC_IPS: 'provisions.addPublicIps',
  DELETE_PUBLIC_IP: 'provisions.deletePublicIp',
  CHMOD: 'provisions.chmod',
  CHOWN: 'provisions.chown',
  CHGRP: 'provisions.chgrp',
  LOGS: 'provisions.logs',
}

const Commands = {
  [Actions.LIST]: {
    path: `${basepath}`,
    httpMethod: GET,
    auth: true,
    params: {
      extended: {
        from: query,
        default: 'false',
      },
    },
  },
  [Actions.SHOW]: {
    path: `${basepath}/:id`,
    httpMethod: GET,
    auth: true,
    params: {
      id: { from: resource },
      extended: {
        from: query,
        default: 'false',
      },
    },
  },
  [Actions.LOGS]: {
    path: `${basepath}/:id/logs`,
    httpMethod: GET,
    auth: true,
    params: {
      id: { from: resource },
      all: {
        from: query,
        default: 'true',
      },
    },
  },
  [Actions.CREATE]: {
    path: `${basepath}`,
    httpMethod: POST,
    auth: true,
    params: {
      template: {
        from: postBody,
      },
    },
  },
  [Actions.UPDATE]: {
    path: `${basepath}/:id`,
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
  [Actions.DELETE]: {
    path: `${basepath}/:id`,
    httpMethod: DELETE,
    auth: true,
    params: {
      id: {
        from: resource,
      },
      force: {
        from: query,
        default: false,
      },
    },
  },
  [Actions.RECOVER]: {
    path: `${basepath}/:id/recover`,
    httpMethod: POST,
    auth: true,
    params: {
      id: { from: resource },
      force: { from: query },
    },
  },
  [Actions.ADD_HOSTS]: {
    path: `${basepath}/:id/hosts`,
    httpMethod: POST,
    auth: true,
    params: {
      id: { from: resource },
      amount: { from: postBody },
      hosts: { from: postBody },
    },
  },
  [Actions.DELETE_HOSTS]: {
    path: `${basepath}/:id/hosts`,
    httpMethod: DELETE,
    auth: true,
    params: {
      id: { from: resource },
      ids: { from: query },
    },
  },
  [Actions.ADD_PUBLIC_IPS]: {
    path: `${basepath}/:id/public-network/ips`,
    httpMethod: POST,
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
  [Actions.DELETE_PUBLIC_IP]: {
    path: `${basepath}/:id/public-network/ips/:ar_id`,
    httpMethod: DELETE,
    auth: true,
    params: {
      id: {
        from: resource,
      },
      ar_id: {
        from: resource,
      },
    },
  },
  [Actions.CHMOD]: {
    path: `${basepath}/:id/chmod`,
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
}

module.exports = { Actions, Commands }
