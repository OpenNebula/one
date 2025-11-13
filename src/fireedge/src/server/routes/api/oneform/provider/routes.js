/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

const basepath = '/providers'
const { resource, postBody } = fromData
const { GET, POST, DELETE, PATCH } = httpMethod

const Actions = {
  LIST: 'providers.list',
  CREATE: 'providers.create',
  SHOW: 'providers.show',
  UPDATE: 'providers.update',
  DELETE: 'providers.delete',
  CHMOD: 'providers.chmod',
  CHOWN: 'providers.chown',
  CHGRP: 'providers.chgrp',
}

const Commands = {
  [Actions.LIST]: {
    path: `${basepath}`,
    httpMethod: GET,
    auth: true,
  },
  [Actions.SHOW]: {
    path: `${basepath}/:id`,
    httpMethod: GET,
    auth: true,
    params: {
      id: {
        from: resource,
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
