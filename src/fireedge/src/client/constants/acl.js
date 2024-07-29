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

import { T } from 'client/constants'

// ACL actions
export const ACL_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  CREATE_DIALOG_STRING: 'create_dialog_string',
  DELETE: 'delete',
}

// Types of id definition
export const ACL_TYPE_ID = {
  INDIVIDUAL: '#',
  GROUP: '@',
  ALL: '*',
  CLUSTER: '%',
}

// Hex values for different user types
export const ACL_ID = {
  '#': 0x100000000,
  '@': 0x200000000,
  '*': 0x400000000,
  '%': 0x800000000,
}

export const ACL_USERS = {
  INDIVIDUAL: { type: 'INDIVIDUAL', id: '#', value: 0x100000000 },
  GROUP: { type: 'GROUP', id: '@', value: 0x200000000 },
  ALL: { type: 'ALL', id: '*', value: 0x400000000 },
  CLUSTER: { type: 'CLUSTER', id: '%', value: 0x800000000 },
}

// Hex values for different resource types
export const ACL_RESOURCES = {
  VM: { name: 'VM', value: 0x1000000000n },
  HOST: { name: 'HOST', value: 0x2000000000n },
  NET: { name: 'NET', value: 0x4000000000n },
  IMAGE: { name: 'IMAGE', value: 0x8000000000n },
  USER: { name: 'USER', value: 0x10000000000n },
  TEMPLATE: { name: 'TEMPLATE', value: 0x20000000000n },
  GROUP: { name: 'GROUP', value: 0x40000000000n },
  DATASTORE: { name: 'DATASTORE', value: 0x100000000000n },
  CLUSTER: { name: 'CLUSTER', value: 0x200000000000n },
  DOCUMENT: { name: 'DOCUMENT', value: 0x400000000000n },
  ZONE: { name: 'ZONE', value: 0x800000000000n },
  SECGROUP: { name: 'SECGROUP', value: 0x1000000000000n },
  VDC: { name: 'VDC', value: 0x2000000000000n },
  VROUTER: { name: 'VROUTER', value: 0x4000000000000n },
  MARKETPLACE: { name: 'MARKETPLACE', value: 0x8000000000000n },
  MARKETPLACEAPP: { name: 'MARKETPLACEAPP', value: 0x10000000000000n },
  VMGROUP: { name: 'VMGROUP', value: 0x20000000000000n },
  VNTEMPLATE: { name: 'VNTEMPLATE', value: 0x40000000000000n },
  BACKUPJOB: { name: 'BACKUPJOB', value: 0x100000000000000n },
}

// Hex values for different right types
export const ACL_RIGHTS = {
  USE: { name: 'USE', value: 0x1 },
  MANAGE: { name: 'MANAGE', value: 0x2 },
  ADMIN: { name: 'ADMIN', value: 0x4 },
  CREATE: { name: 'CREATE', value: 0x8 },
}

// type of table views
export const ACL_TABLE_VIEWS = {
  ICONS: {
    type: 'ICONS',
    name: T['acls.table.types.icons'],
  },
  NAMES: {
    type: 'NAMES',
    name: T['acls.table.types.names'],
  },
  CLI: {
    type: 'CLI',
    name: T['acls.table.types.cli'],
  },
  RESOURCES: {
    type: 'RESOURCES',
    name: T['acls.table.types.resources'],
  },
  RULE: {
    type: 'RULE',
    name: T['acls.table.types.rule'],
  },
  READABLERULE: {
    type: 'READABLERULE',
    name: T['acls.table.types.readablerule'],
  },
}
