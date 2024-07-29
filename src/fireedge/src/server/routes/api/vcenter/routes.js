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
} = require('../../../utils/constants/defaults')

const { POST, GET } = httpMethod
const { resource, postBody, query } = fromData

const basepath = '/vcenter'
const VCENTER_TOKEN = 'vcenter.token'
const VCENTER_CLEAR_TAGS = 'vcenter.cleartags'
const VCENTER_IMPORT_HOSTS = 'vcenter.importhosts'
const VCENTER_IMPORT_DATASTORES = 'vcenter.importdatastores'
const VCENTER_IMPORT_TEMPLATES = 'vcenter.importtemplates'
const VCENTER_IMPORT_NETWORKS = 'vcenter.importnetworks'
const VCENTER_IMPORT_IMAGES = 'vcenter.importimages'
const VCENTER_LIST_ALL = 'vcenter.listall'
const VCENTER_LIST = 'vcenter.list'

const Actions = {
  VCENTER_TOKEN,
  VCENTER_CLEAR_TAGS,
  VCENTER_IMPORT_HOSTS,
  VCENTER_IMPORT_TEMPLATES,
  VCENTER_IMPORT_DATASTORES,
  VCENTER_IMPORT_NETWORKS,
  VCENTER_IMPORT_IMAGES,
  VCENTER_LIST_ALL,
  VCENTER_LIST,
}

module.exports = {
  Actions,
  Commands: {
    [VCENTER_TOKEN]: {
      path: `${basepath}/token/:id`,
      httpMethod: GET,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
    [VCENTER_CLEAR_TAGS]: {
      path: `${basepath}/cleartags/:id`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
      },
    },
    [VCENTER_IMPORT_HOSTS]: {
      path: `${basepath}/hosts/:id?`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        vcenter: {
          from: postBody,
        },
        user: {
          from: postBody,
        },
        pass: {
          from: postBody,
        },
      },
    },
    [VCENTER_IMPORT_DATASTORES]: {
      path: `${basepath}/datastores/:id?`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        host: {
          from: postBody,
        },
      },
    },
    [VCENTER_IMPORT_TEMPLATES]: {
      path: `${basepath}/templates/:id?`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        datastore: {
          from: postBody,
        },
        host: {
          from: postBody,
        },
        folder: {
          from: postBody,
        },
        linked_clone: {
          from: postBody,
        },
      },
    },
    [VCENTER_IMPORT_NETWORKS]: {
      path: `${basepath}/networks/:id?`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        host: {
          from: postBody,
        },
        size: {
          from: postBody,
        },
        type: {
          from: postBody,
        },
        mac: {
          from: postBody,
        },
        ip: {
          from: postBody,
        },
        selectedClusters: {
          from: postBody,
        },
        globalPrefix: {
          from: postBody,
        },
        ulaPrefix: {
          from: postBody,
        },
        ip6Global: {
          from: postBody,
        },
      },
    },
    [VCENTER_IMPORT_IMAGES]: {
      path: `${basepath}/images/:id?`,
      httpMethod: POST,
      auth: true,
      params: {
        id: {
          from: resource,
        },
        host: {
          from: postBody,
        },
        datastore: {
          from: postBody,
        },
      },
    },
    [VCENTER_LIST_ALL]: {
      path: `${basepath}/listall/:vobject/:host`,
      httpMethod: GET,
      auth: true,
      params: {
        vobject: {
          from: resource,
        },
        host: {
          from: resource,
        },
        datastore: {
          from: query,
        },
      },
    },
    [VCENTER_LIST]: {
      path: `${basepath}/:vobject/:host`,
      httpMethod: GET,
      auth: true,
      params: {
        vobject: {
          from: resource,
        },
        host: {
          from: resource,
        },
        datastore: {
          from: query,
        },
      },
    },
  },
}
