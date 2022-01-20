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
  importVcenter,
  list,
  listAll,
  cleartags,
  hosts,
} = require('server/routes/api/vcenter/functions')
const { POST, GET } = httpMethod

const routes = {
  [POST]: {
    import: {
      action: importVcenter,
      params: {
        vobject: {
          from: fromData.resource,
          name: 'id',
        },
        host: {
          from: fromData.postBody,
          name: 'host',
        },
        datastore: {
          from: fromData.postBody,
          name: 'datastore',
        },
        id: {
          from: fromData.postBody,
          name: 'id',
        },
        answers: {
          from: fromData.postBody,
          name: 'answers',
        },
      },
    },
    cleartags: {
      action: cleartags,
      params: {
        id: {
          from: fromData.resource,
          name: 'id',
        },
      },
    },
    hosts: {
      action: hosts,
      params: {
        vcenter: {
          from: fromData.postBody,
          name: 'vcenter',
        },
        user: {
          from: fromData.postBody,
          name: 'user',
        },
        pass: {
          from: fromData.postBody,
          name: 'pass',
        },
      },
    },
  },
  [GET]: {
    null: {
      action: list,
      params: {
        vobject: {
          from: fromData.resource,
          name: 'method',
        },
        host: {
          from: fromData.query,
          name: 'host',
        },
        datastore: {
          from: fromData.query,
          name: 'datastore',
        },
      },
    },
    listall: {
      action: listAll,
      params: {
        vobject: {
          from: fromData.resource,
          name: 'id',
        },
        host: {
          from: fromData.query,
          name: 'host',
        },
        datastore: {
          from: fromData.query,
          name: 'datastore',
        },
      },
    },
  },
}

const authApi = {
  routes,
}
module.exports = authApi
