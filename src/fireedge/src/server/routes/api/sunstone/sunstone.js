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
const { defaultEmptyFunction } = require('server/utils/constants/defaults')
const { httpMethod, from: fromData } = require('server/utils/constants/defaults')
const { getParamsForObject } = require('server/utils/server')
const {
  getConfig,
  getViews
} = require('./sunstone-functions')
const { GET } = httpMethod

const routes = {
  [GET]: {
    views: {
      action: getViews,
      params: {}
    },
    config: {
      action: getConfig,
      params: {}
    }
  }
}
const main = (req = {}, res = {}, next = defaultEmptyFunction, routes = {}, user = {}, oneConnection = defaultEmptyFunction, index = 0) => {
  const resources = Object.keys(req[fromData.resource])
  if (req && res && next && routes) {
    const route = routes[`${req[fromData.resource][resources[index]]}`.toLowerCase()]
    if (req && fromData && fromData.resource && req[fromData.resource] && route) {
      if (Object.keys(route).length > 0 && route.constructor === Object) {
        if (route.action && route.params && typeof route.action === 'function') {
          const params = getParamsForObject(route.params, req)
          route.action(res, next, params, user, oneConnection)
        } else {
          main(req, res, next, route, user, oneConnection, index + 1)
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

const sunstoneApi = {
  main,
  routes
}

module.exports = sunstoneApi
