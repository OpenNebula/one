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

const { httpMethod, from: fromData } = require('server/utils/constants/defaults')
const { exportApp } = require('./functions')
const { POST } = httpMethod

const routes = {
  [POST]: {
    export: {
      action: exportApp,
      params: {
        id: {
          from: fromData.resource,
          name: 'id'
        },
        name: {
          from: fromData.postBody,
          name: 'name'
        },
        datastore: {
          from: fromData.postBody,
          name: 'datastore'
        },
        file: {
          from: fromData.postBody,
          name: 'file'
        },
        associated: {
          from: fromData.postBody,
          name: 'associated'
        },
        tag: {
          from: fromData.postBody,
          name: 'tag'
        },
        template: {
          from: fromData.postBody,
          name: 'template'
        },
        vmname: {
          from: fromData.postBody,
          name: 'vmname'
        }
      }
    }
  }
}

const authApi = {
  routes
}
module.exports = authApi
