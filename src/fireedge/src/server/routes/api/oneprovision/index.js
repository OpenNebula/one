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
  hostCommandSSH,
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
  PROVISION_CLUSTER_RESOURCE,
  PROVISION_DATASTORE_RESOURCE,
  PROVISION_HOST_RESOURCE,
  PROVISION_IMAGE_RESOURCE,
  PROVISION_NETWORK_RESOURCE,
  PROVISION_TEMPLATE_RESOURCE,
  PROVISION_VNTEMPLATE_RESOURCE,
  PROVISION_LOGS,
  PROVISION_DEFAULTS,
  PROVISION_LIST,
  PROVISION_VALIDATE,
  PROVISION_HOST_POWEROFF,
  PROVISION_HOST_REBOOT,
  PROVISION_HOST_RESUME,
  PROVISION_CREATE,
  PROVISION_HOST_SSH,
  PROVISION_DATASTORE,
  PROVISION_FLOWTEMPLATE,
  PROVISION_DELETE_HOST_RESOURCE,
  PROVISION_DELETE_IMAGE_RESOURCE,
  PROVISION_DELETE_NETWORK_RESOURCE,
  PROVISION_DELETE_VNTEMPLATE_RESOURCE,
  PROVISION_DELETE_TEMPLATE_RESOURCE,
  PROVISION_DELETE_CLUSTER_RESOURCE,
  PROVISION_DELETE_PROVISION,
  PROVISION_UPDATE_CONFIGURE,
  PROVISION_UPDATE_HOST,
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
    ...CommandsProvision[PROVISION_CLUSTER_RESOURCE],
    action: getListResourceProvision,
  },
  {
    ...CommandsProvision[PROVISION_DATASTORE_RESOURCE],
    action: getListResourceProvision,
  },
  {
    ...CommandsProvision[PROVISION_HOST_RESOURCE],
    action: getListResourceProvision,
  },
  {
    ...CommandsProvision[PROVISION_IMAGE_RESOURCE],
    action: getListResourceProvision,
  },
  {
    ...CommandsProvision[PROVISION_NETWORK_RESOURCE],
    action: getListResourceProvision,
  },
  {
    ...CommandsProvision[PROVISION_TEMPLATE_RESOURCE],
    action: getListResourceProvision,
  },
  {
    ...CommandsProvision[PROVISION_VNTEMPLATE_RESOURCE],
    action: getListResourceProvision,
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
    ...CommandsProvision[PROVISION_HOST_POWEROFF],
    action: hostCommand,
  },
  {
    ...CommandsProvision[PROVISION_HOST_REBOOT],
    action: hostCommand,
  },
  {
    ...CommandsProvision[PROVISION_HOST_RESUME],
    action: hostCommand,
  },
  {
    ...CommandsProvision[PROVISION_CREATE],
    action: createProvision,
  },
  {
    ...CommandsProvision[PROVISION_HOST_SSH],
    action: hostCommandSSH,
  },
  {
    ...CommandsProvision[PROVISION_DATASTORE],
    action: deleteResource,
  },
  {
    ...CommandsProvision[PROVISION_FLOWTEMPLATE],
    action: deleteResource,
  },
  {
    ...CommandsProvision[PROVISION_DELETE_HOST_RESOURCE],
    action: deleteResource,
  },
  {
    ...CommandsProvision[PROVISION_DELETE_IMAGE_RESOURCE],
    action: deleteResource,
  },
  {
    ...CommandsProvision[PROVISION_DELETE_NETWORK_RESOURCE],
    action: deleteResource,
  },
  {
    ...CommandsProvision[PROVISION_DELETE_VNTEMPLATE_RESOURCE],
    action: deleteResource,
  },
  {
    ...CommandsProvision[PROVISION_DELETE_TEMPLATE_RESOURCE],
    action: deleteResource,
  },
  {
    ...CommandsProvision[PROVISION_DELETE_CLUSTER_RESOURCE],
    action: deleteResource,
  },
  {
    ...CommandsProvision[PROVISION_DELETE_PROVISION],
    action: deleteProvision,
  },
  {
    ...CommandsProvision[PROVISION_UPDATE_CONFIGURE],
    action: configureProvision,
  },
  {
    ...CommandsProvision[PROVISION_UPDATE_HOST],
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
