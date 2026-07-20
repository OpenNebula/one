/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { lazy } from 'react'
import { RESOURCE_NAMES } from '@ConstantsModule'
import { getActionsAvailable } from '@UtilsModule'
import { getResourceName } from '@modules/containers/ResourceSingleView/stack'

const actions = ({ resourceView }) => ({
  actions: getActionsAvailable(resourceView?.actions),
})
const rawActions = ({ resourceView }) => ({
  availableActions: resourceView?.actions ?? {},
})
const viewConfig = ({ resourceView }) => ({ viewConfig: resourceView ?? {} })
const templateActions = ({ resourceView }) => ({
  actions: getActionsAvailable(resourceView),
})
const serviceTemplateActions = ({ getResourceView }) => ({
  actions: getActionsAvailable(
    getResourceView?.(RESOURCE_NAMES.VM_TEMPLATE)?.actions
  ),
})
const serviceView = ({ resourceView }) => ({
  ...actions({ resourceView }),
  ...viewConfig({ resourceView }),
})

const idArgs = (id) => ({ id })
const expandedArgs = (id) => ({ id, extended: true })
const oneKsArgs = (id) => ({ id, expand: true })
const supportArgs = () => undefined
const selectSupportTicket = (tickets = [], id) =>
  tickets.find((ticket) => String(ticket?.id) === String(id))

const lazyDrawer = (load) =>
  lazy(() => load().then(({ DetailsDrawer: Drawer }) => ({ default: Drawer })))

const drawer = (
  load,
  selectedProp,
  detailEndpoint,
  getProps,
  detailOptions
) => ({
  Component: lazyDrawer(load),
  selectedProp,
  getProps,
  detail: {
    endpoint: detailEndpoint,
    getArgs: idArgs,
    ...detailOptions,
  },
})

export const RESOURCE_SINGLE_VIEW = Object.freeze({
  [RESOURCE_NAMES.BACKUPJOBS]: drawer(
    () => import('@modules/containers/BackupJobs/Details'),
    'selectedData',
    'getBackupJob',
    rawActions
  ),
  [RESOURCE_NAMES.BACKUP]: drawer(
    () => import('@modules/containers/Backups/Details'),
    'selectedData',
    'getImage',
    rawActions
  ),
  [RESOURCE_NAMES.CLUSTER]: drawer(
    () => import('@modules/containers/Clusters/Details'),
    'selectedClusters',
    'getCluster',
    actions
  ),
  [RESOURCE_NAMES.DATASTORE]: drawer(
    () => import('@modules/containers/Datastores/Details'),
    'selectedData',
    'getDatastore',
    rawActions
  ),
  [RESOURCE_NAMES.FILE]: drawer(
    () => import('@modules/containers/Files/Details'),
    'selectedData',
    'getImage',
    rawActions
  ),
  [RESOURCE_NAMES.GROUP]: drawer(
    () => import('@modules/containers/Groups/Details'),
    'selectedGroups',
    'getGroup'
  ),
  [RESOURCE_NAMES.HOST]: drawer(
    () => import('@modules/containers/Hosts/Details'),
    'selectedHosts',
    'getHost'
  ),
  [RESOURCE_NAMES.IMAGE]: drawer(
    () => import('@modules/containers/Images/Details'),
    'selectedData',
    'getImage',
    rawActions
  ),
  [RESOURCE_NAMES.APP]: drawer(
    () => import('@modules/containers/MarketplaceApps/Details'),
    'selectedMarketplaceApps',
    'getMarketplaceApp',
    actions
  ),
  [RESOURCE_NAMES.MARKETPLACE]: drawer(
    () => import('@modules/containers/Marketplaces/Details'),
    'selectedMarketplaces',
    'getMarketplace',
    actions
  ),
  [RESOURCE_NAMES.ONEKS]: drawer(
    () => import('@modules/containers/OneKs/Details'),
    'selectedData',
    'getOneKsCluster',
    rawActions,
    { getArgs: oneKsArgs }
  ),
  [RESOURCE_NAMES.PROVIDER]: drawer(
    () => import('@modules/containers/Providers/Details'),
    'selectedProviders',
    'getProvider',
    actions
  ),
  [RESOURCE_NAMES.SEC_GROUP]: drawer(
    () => import('@modules/containers/SecurityGroups/Details'),
    'selectedSecurityGroups',
    'getSecGroup',
    actions,
    { getArgs: expandedArgs }
  ),
  [RESOURCE_NAMES.SERVICE_TEMPLATE]: drawer(
    () => import('@modules/containers/ServiceTemplates/Details'),
    'selectedTemplates',
    'getServiceTemplate',
    serviceTemplateActions
  ),
  [RESOURCE_NAMES.SERVICE]: drawer(
    () => import('@modules/containers/Services/Details'),
    'selectedServices',
    'getService',
    serviceView
  ),
  [RESOURCE_NAMES.SUPPORT]: drawer(
    () => import('@modules/containers/Support/Details'),
    'selectedTickets',
    'getTickets',
    actions,
    { getArgs: supportArgs, select: selectSupportTicket }
  ),
  [RESOURCE_NAMES.USER]: drawer(
    () => import('@modules/containers/Users/Details'),
    'selectedUsers',
    'getUser',
    actions
  ),
  [RESOURCE_NAMES.VDC]: drawer(
    () => import('@modules/containers/VDCs/Details'),
    'selectedVdcs',
    'getVDC'
  ),
  [RESOURCE_NAMES.VM]: drawer(
    () => import('@modules/containers/VirtualMachines/Details'),
    'selectedVms',
    'getVm',
    viewConfig,
    { getArgs: expandedArgs }
  ),
  [RESOURCE_NAMES.VNET]: drawer(
    () => import('@modules/containers/VirtualNetworks/Details'),
    'selectedResources',
    'getVNetwork',
    actions
  ),
  [RESOURCE_NAMES.VROUTER]: drawer(
    () => import('@modules/containers/VirtualRouters/Details'),
    'selectedResources',
    'getVr',
    actions
  ),
  [RESOURCE_NAMES.VM_GROUP]: drawer(
    () => import('@modules/containers/VmGroups/Details'),
    'selectedVmGroups',
    'getVMGroup',
    actions
  ),
  [RESOURCE_NAMES.VM_TEMPLATE]: drawer(
    () => import('@modules/containers/VmTemplates/Details'),
    'selectedTemplates',
    'getTemplate',
    templateActions
  ),
  [RESOURCE_NAMES.VN_TEMPLATE]: drawer(
    () => import('@modules/containers/VnTemplates/Details'),
    'selectedVnTemplates',
    'getVNTemplate',
    actions
  ),
  [RESOURCE_NAMES.VROUTER_TEMPLATE]: drawer(
    () => import('@modules/containers/VrTemplates/Details'),
    'selectedTemplates',
    'getVrTemplate',
    templateActions
  ),
  [RESOURCE_NAMES.ZONE]: drawer(
    () => import('@modules/containers/Zones/Details'),
    'selectedZones',
    'getZone'
  ),
})

/**
 * @param {string} resource - Resource name
 * @returns {object|undefined} Registered drawer configuration
 */
const getResourceSingleView = (resource) =>
  RESOURCE_SINGLE_VIEW[getResourceName(resource)]

/**
 * @param {string} resource - Resource name
 * @returns {boolean} Whether a resource has a registered drawer
 */
const hasResourceSingleView = (resource) =>
  getResourceSingleView(resource) !== undefined

export { getResourceSingleView, hasResourceSingleView }
