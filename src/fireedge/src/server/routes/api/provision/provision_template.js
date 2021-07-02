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
const { from: fromData } = require('server/utils/constants/defaults')
const {
  getListProvisionTemplates,
  createProvisionTemplate,
  instantiateProvisionTemplate,
  updateProvisionTemplate,
  deleteProvisionTemplate
} = require('./provision_template-functions')
const { httpMethod } = require('server/utils/constants/defaults')

const { GET, POST, PUT, DELETE } = httpMethod

const routes = {
  [GET]: {
    list: {
      action: getListProvisionTemplates,
      params: {
        id: { from: fromData.resource, name: 'id', front: true }
      }
    }
  },
  [POST]: {
    create: {
      action: createProvisionTemplate,
      params: {
        resource: { from: fromData.postBody, front: true }
      }
    },
    instantiate: {
      action: instantiateProvisionTemplate,
      params: {
        id: { from: fromData.resource, name: 'id', front: true }
      }
    }
  },
  [PUT]: {
    update: {
      action: updateProvisionTemplate,
      params: {
        resource: { from: fromData.postBody, front: true },
        id: { from: fromData.resource, name: 'id', front: true }
      }
    }
  },
  [DELETE]: {
    delete: {
      action: deleteProvisionTemplate,
      params: {
        id: { from: fromData.resource, name: 'id', front: true }
      }
    }
  }
}

const provisionTemplateApi = {
  routes
}
module.exports = provisionTemplateApi
