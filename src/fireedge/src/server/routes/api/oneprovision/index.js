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
  Actions: ActionsProvision,
  Commands: CommandsProvision,
} = require('server/routes/api/oneprovision/provision/routes')
const {
  getListResourceProvision,
  getListProvisions,
  getLogProvisions,
  deleteResource,
  deleteProvision,
  hostCommand,
  hostAdd,
  ipAdd,
  createProvision,
  configureProvision,
  configureHost,
  validate,
  getProvisionDefaults,
} = require('server/routes/api/oneprovision/provision/functions')

const {
  Actions: ActionsTemplate,
  Commands: CommandsTemplate,
} = require('server/routes/api/oneprovision/template/routes')
const {
  getListProvisionTemplates,
  createProvisionTemplate,
  instantiateProvisionTemplate,
  updateProvisionTemplate,
  deleteProvisionTemplate,
} = require('server/routes/api/oneprovision/template/functions')

const {
  Actions: ActionsProvider,
  Commands: CommandsProvider,
} = require('server/routes/api/oneprovision/provider/routes')
const {
  getListProviders,
  getConnectionProviders,
  createProviders,
  updateProviders,
  deleteProvider,
  getProviderConfig,
} = require('server/routes/api/oneprovision/provider/functions')

const {
  PROVISION_LOGS,
  PROVISION_DEFAULTS,
  PROVISION_LIST,
  PROVISION_VALIDATE,
  PROVISION_CREATE,
  PROVISION_DELETE,
  PROVISION_CONFIGURE,
  PROVISION_GET_RESOURCE,
  PROVISION_DELETE_RESOURCE,
  PROVISION_HOST_ACTION,
  PROVISION_HOST_CONFIGURE,
  PROVISION_ADD_HOST,
  PROVISION_ADD_IP,
} = ActionsProvision

const {
  PROVISIONTEMPLATE_SHOW,
  PROVISIONTEMPLATE_INSTANTIATE,
  PROVISIONTEMPLATE_CREATE,
  PROVISIONTEMPLATE_UPDATE,
  PROVISIONTEMPLATE_DELETE,
} = ActionsTemplate

const {
  PROVIDER_CONNECTION,
  PROVIDER_CONFIG,
  PROVIDER_LIST,
  PROVIDER_CREATE,
  PROVIDER_UPDATE,
  PROVIDER_DELETE,
} = ActionsProvider

module.exports = [
  // Provision
  {
    ...CommandsProvision[PROVISION_GET_RESOURCE],
    action: getListResourceProvision,
  },
  {
    ...CommandsProvision[PROVISION_DELETE_RESOURCE],
    action: deleteResource,
  },
  {
    ...CommandsProvision[PROVISION_LOGS],
    action: getLogProvisions,
  },
  {
    ...CommandsProvision[PROVISION_DEFAULTS],
    action: getProvisionDefaults,
  },
  {
    ...CommandsProvision[PROVISION_LIST],
    action: getListProvisions,
  },
  {
    ...CommandsProvision[PROVISION_VALIDATE],
    action: validate,
  },
  {
    ...CommandsProvision[PROVISION_HOST_ACTION],
    action: hostCommand,
  },
  {
    ...CommandsProvision[PROVISION_CREATE],
    action: createProvision,
  },
  {
    ...CommandsProvision[PROVISION_CONFIGURE],
    action: configureProvision,
  },
  {
    ...CommandsProvision[PROVISION_DELETE],
    action: deleteProvision,
  },
  {
    ...CommandsProvision[PROVISION_HOST_CONFIGURE],
    action: configureHost,
  },
  {
    ...CommandsProvision[PROVISION_ADD_HOST],
    action: hostAdd,
  },
  {
    ...CommandsProvision[PROVISION_ADD_IP],
    action: ipAdd,
  },

  // Template
  {
    ...CommandsTemplate[PROVISIONTEMPLATE_SHOW],
    action: getListProvisionTemplates,
  },
  {
    ...CommandsTemplate[PROVISIONTEMPLATE_INSTANTIATE],
    action: instantiateProvisionTemplate,
  },
  {
    ...CommandsTemplate[PROVISIONTEMPLATE_CREATE],
    action: createProvisionTemplate,
  },
  {
    ...CommandsTemplate[PROVISIONTEMPLATE_UPDATE],
    action: updateProvisionTemplate,
  },
  {
    ...CommandsTemplate[PROVISIONTEMPLATE_DELETE],
    action: deleteProvisionTemplate,
  },

  // Provider
  {
    ...CommandsProvider[PROVIDER_CONNECTION],
    action: getConnectionProviders,
  },
  {
    ...CommandsProvider[PROVIDER_CONFIG],
    action: getProviderConfig,
  },
  {
    ...CommandsProvider[PROVIDER_LIST],
    action: getListProviders,
  },
  {
    ...CommandsProvider[PROVIDER_CREATE],
    action: createProviders,
  },
  {
    ...CommandsProvider[PROVIDER_UPDATE],
    action: updateProviders,
  },
  {
    ...CommandsProvider[PROVIDER_DELETE],
    action: deleteProvider,
  },
]
