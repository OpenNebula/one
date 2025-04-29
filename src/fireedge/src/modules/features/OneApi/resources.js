/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { RESOURCE_NAMES } from '@ConstantsModule'

const ONE_RESOURCES = {
  ACL: 'ACL',
  APP: 'APP',
  BACKUPJOB: 'BACKUPJOB',
  CLUSTER: 'CLUSTER',
  DATASTORE: 'DATASTORE',
  FILE: 'FILE',
  GROUP: 'GROUP',
  HOST: 'HOST',
  IMAGE: 'IMAGE',
  LOGO: 'LOGO',
  MARKETPLACE: 'MARKET',
  SECURITYGROUP: 'SECGROUP',
  SUPPORT: 'SUPPORT',
  SYSTEM: 'SYSTEM',
  TEMPLATE: 'TEMPLATE',
  USER: 'USER',
  VDC: 'VDC',
  VM: 'VM',
  VMGROUP: 'VM_GROUP',
  VNET: 'VNET',
  VNTEMPLATE: 'VNTEMPLATE',
  VROUTER: 'VROUTER',
  ZONE: 'ZONE',
}

const DOCUMENT = {
  SERVICE: 'SERVICE',
  SERVICE_TEMPLATE: 'SERVICE_TEMPLATE',
  PROVISION: 'PROVISION',
  PROVIDER: 'PROVIDER',
}

const DOCUMENT_POOL = Object.entries(DOCUMENT).reduce(
  (pools, [key, value]) => ({ ...pools, [`${key}_POOL`]: `${value}_POOL` }),
  {}
)

const RESOURCE_NAMES_TO_CACHE_TAG = {
  [RESOURCE_NAMES.APP]: ONE_RESOURCES.APP,
  [RESOURCE_NAMES.ACL]: ONE_RESOURCES.ACL,
  [RESOURCE_NAMES.BACKUPJOBS]: ONE_RESOURCES.BACKUPJOB,
  [RESOURCE_NAMES.CLUSTER]: ONE_RESOURCES.CLUSTER,
  [RESOURCE_NAMES.DATASTORE]: ONE_RESOURCES.DATASTORE,
  [RESOURCE_NAMES.HOST]: ONE_RESOURCES.HOST,
  [RESOURCE_NAMES.IMAGE]: ONE_RESOURCES.IMAGE,
  [RESOURCE_NAMES.LOGO]: ONE_RESOURCES.LOGO,
  [RESOURCE_NAMES.FILE]: ONE_RESOURCES.FILE,
  [RESOURCE_NAMES.MARKETPLACE]: ONE_RESOURCES.MARKETPLACE,
  [RESOURCE_NAMES.SEC_GROUP]: ONE_RESOURCES.SECURITYGROUP,
  [RESOURCE_NAMES.USER]: ONE_RESOURCES.USER,
  [RESOURCE_NAMES.VDC]: ONE_RESOURCES.VDC,
  [RESOURCE_NAMES.VROUTER]: ONE_RESOURCES.VROUTER,
  [RESOURCE_NAMES.VROUTER_TEMPLATE]: ONE_RESOURCES.TEMPLATE,
  [RESOURCE_NAMES.VM_TEMPLATE]: ONE_RESOURCES.TEMPLATE,
  [RESOURCE_NAMES.VM_GROUP]: ONE_RESOURCES.VMGROUP,
  [RESOURCE_NAMES.VM]: ONE_RESOURCES.VM,
  [RESOURCE_NAMES.VN_TEMPLATE]: ONE_RESOURCES.VNTEMPLATE,
  [RESOURCE_NAMES.VNET]: ONE_RESOURCES.VNET,
  [RESOURCE_NAMES.SERVICE]: ONE_RESOURCES.SERVICE,
  [RESOURCE_NAMES.SERVICE_TEMPLATE]: ONE_RESOURCES.SERVICE_TEMPLATE,
  [RESOURCE_NAMES.ZONE]: ONE_RESOURCES.ZONE,
}

const ONE_RESOURCES_POOL = Object.entries(ONE_RESOURCES).reduce(
  (pools, [key, value]) => ({ ...pools, [`${key}_POOL`]: `${value}_POOL` }),
  {}
)

const PROVISION_CONFIG = {
  PROVISION_DEFAULTS: 'PROVISION_DEFAULTS',
  PROVIDER_CONFIG: 'PROVIDER_CONFIG',
}

const PROVISION_RESOURCES = {
  CLUSTER: 'PROVISION_CLUSTER',
  DATASTORE: 'PROVISION_DATASTORE',
  HOST: 'PROVISION_HOST',
  TEMPLATE: 'PROVISION_VMTEMPLATE',
  IMAGE: 'PROVISION_IMAGE',
  NETWORK: 'PROVISION_VNET',
  VNTEMPLATE: 'PROVISION_VNTEMPLATE',
  FLOWTEMPLATE: 'PROVISION_FLOWTEMPLATE',
}

export {
  DOCUMENT,
  DOCUMENT_POOL,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
  RESOURCE_NAMES_TO_CACHE_TAG,
  PROVISION_CONFIG,
  PROVISION_RESOURCES,
}
