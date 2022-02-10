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
const VCENTER = require('server/routes/api/vcenter/basepath')

const basepath = `/${VCENTER}`
const { POST, GET } = httpMethod
const { resource, postBody, query } = fromData

const VCENTER_CLEARTAGS = 'vcenter.cleartags'
const VCENTER_HOSTS = 'vcenter.hosts'
const VCENTER_IMPORT = 'vcenter.import'
const VCENTER_LISTALL = 'vcenter.listall'
const VCENTER_LIST = 'vcenter.list'
const Actions = {
  VCENTER_CLEARTAGS,
  VCENTER_HOSTS,
  VCENTER_IMPORT,
  VCENTER_LISTALL,
  VCENTER_LIST,
}

module.exports = {
  Actions,
  Commands: {
    [VCENTER_CLEARTAGS]: {
      path: `${basepath}/cleartags/:id`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
    [VCENTER_HOSTS]: {
      path: `${basepath}/hosts`,
      httpMethod: POST,
      auth: true,
      params: {
        vcenter: {
          from: postBody,
          name: 'vcenter',
        },
        user: {
          from: postBody,
          name: 'user',
        },
        pass: {
          from: postBody,
          name: 'pass',
        },
      },
    },
    [VCENTER_IMPORT]: {
      path: `${basepath}/:vobject`,
      httpMethod: POST,
      auth: true,
      params: {
        vobject: {
          from: resource,
        },
        host: {
          from: postBody,
        },
        datastore: {
          from: postBody,
        },
        id: {
          from: postBody,
        },
        answers: {
          from: postBody,
        },
      },
    },
    [VCENTER_LISTALL]: {
      path: `${basepath}/listall/:vobject`,
      httpMethod: GET,
      auth: true,
      params: {
        vobject: {
          from: resource,
        },
        host: {
          from: query,
        },
        datastore: {
          from: query,
        },
      },
    },
    [VCENTER_LIST]: {
      path: `${basepath}/:vobject`,
      httpMethod: GET,
      auth: true,
      params: {
        vobject: {
          from: resource,
        },
        host: {
          from: query,
        },
        datastore: {
          from: query,
        },
      },
    },
  },
}
