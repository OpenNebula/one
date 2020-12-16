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
const { main: provision, routes: provisionRoutes } = require('./provision')
const { main: provisionTemplate, routes: provisionTemplateRoutes } = require('./provision_template')
const { main: provider, routes: providerRoutes } = require('./provider')

const { PROVIDER, PROVISION, PROVISION_TEMPLATE } = require('./string-routes')

const privateRoutes = []
const publicRoutes = []

const fillRoute = (method, endpoint, action) => ({
  httpMethod: method,
  endpoint,
  action
})

const fillPrivateRoutes = (methods = {}, path = '', action = () => undefined) => {
  if (Object.keys(methods).length > 0 && methods.constructor === Object) {
    Object.keys(methods).forEach((method) => {
      privateRoutes.push(
        fillRoute(method, path,
          (req, res, next, conection, userId, user) => {
            action(req, res, next, methods[method], user)
          })
      )
    })
  }
}

const generatePrivateRoutes = () => {
  fillPrivateRoutes(provisionRoutes, PROVISION, provision)
  fillPrivateRoutes(provisionTemplateRoutes, PROVISION_TEMPLATE, provisionTemplate)
  fillPrivateRoutes(providerRoutes, PROVIDER, provider)
  return privateRoutes
}

const functionRoutes = {
  private: generatePrivateRoutes(),
  public: publicRoutes
}

module.exports = functionRoutes
