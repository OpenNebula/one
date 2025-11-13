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

const basepath = '/drivers'
const { GET, POST } = httpMethod
const { resource } = fromData

const Actions = {
  LIST: 'drivers.list',
  SHOW: 'drivers.show',
  ENABLE: 'drivers.enable',
  DISABLE: 'drivers.disable',
  SYNC: 'drivers.sync',
}

const Commands = {
  [Actions.LIST]: {
    path: `${basepath}`,
    httpMethod: GET,
    auth: true,
  },
  [Actions.SHOW]: {
    path: `${basepath}/:name`,
    httpMethod: GET,
    auth: true,
    params: {
      name: {
        from: resource,
      },
    },
  },
  [Actions.ENABLE]: {
    path: `${basepath}/:name/enable`,
    httpMethod: POST,
    auth: true,
    params: {
      name: {
        from: resource,
      },
    },
  },
  [Actions.DISABLE]: {
    path: `${basepath}/:name/disable`,
    httpMethod: POST,
    auth: true,
    params: {
      name: {
        from: resource,
      },
    },
  },
  [Actions.SYNC]: {
    path: `${basepath}/sync`,
    httpMethod: POST,
    auth: true,
  },
}

module.exports = { Actions, Commands }
