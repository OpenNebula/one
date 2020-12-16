/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
const { getParamsForObject } = require('server/utils/server')
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

const main = (req = {}, res = {}, next = () => undefined, routes = {}, user = {}, index = 0) => {
  const resources = Object.keys(req[fromData.resource])
  if (req && res && next && routes) {
    const route = routes[`${req[fromData.resource][resources[index]]}`.toLowerCase()]
    if (req && fromData && fromData.resource && req[fromData.resource] && route) {
      if (Object.keys(route).length > 0 && route.constructor === Object) {
        if (route.action && route.params && typeof route.action === 'function') {
          const params = getParamsForObject(route.params, req)
          route.action(res, next, params, user)
        } else {
          main(req, res, next, route, user, index + 1)
        }
      } else {
        next()
      }
    } else {
      next()
    }
  } else {
    next()
  }
}

const provisionTemplateApi = {
  main,
  routes
}
module.exports = provisionTemplateApi
