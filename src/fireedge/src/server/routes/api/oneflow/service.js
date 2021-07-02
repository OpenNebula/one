/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

const { httpMethod, from: fromData } = require('server/utils/constants/defaults')
const { getParamsForObject } = require('server/utils/server')
const {
  service,
  serviceDelete,
  serviceAddAction,
  serviceAddScale,
  serviceAddRoleAction
} = require('./service-functions')
const { GET, POST, DELETE } = httpMethod

const routes = {
  [GET]: {
    list: {
      action: service,
      params: {
        id: { from: fromData.resource, name: 'id', front: true }
      }
    }
  },
  [POST]: {
    action: {
      action: serviceAddAction,
      params: {
        id: { from: fromData.resource, name: 'id' },
        action: { from: fromData.postBody, front: true }
      }
    },
    scale: {
      action: serviceAddScale,
      params: {
        id: { from: fromData.resource, name: 'id' },
        action: { from: fromData.postBody, front: true }
      }
    },
    'role-action': {
      action: serviceAddRoleAction,
      params: {
        role: { from: fromData.resource, name: 'id', front: true },
        id: { from: fromData.resource, name: 'id2', front: true },
        action: { from: fromData.postBody, front: true }
      }
    }
  },
  [DELETE]: {
    delete: {
      action: serviceDelete,
      params: { id: { from: fromData.resource, name: 'id', front: true } }
    }
  }
}

const serviceApi = {
  routes
}

module.exports = serviceApi
