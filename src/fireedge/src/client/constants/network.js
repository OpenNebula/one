/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'
// eslint-disable-next-line no-unused-vars
import { Permissions, LockInfo } from 'client/constants/common'
import * as ACTIONS from 'client/constants/actions'

/**
 * @typedef ARLease
 * @property {string} [IP] - IP
 * @property {string} [IP6] - IP6
 * @property {string} [IP6_GLOBAL] - IP6 global
 * @property {string} [IP6_LINK] - IP6 link
 * @property {string} [IP6_ULA] - IP6 ULA
 * @property {string} MAC - MAC
 * @property {string} [VM] - Virtual machine id
 * @property {string} [VNET] - Virtual network id
 * @property {string} [VROUTER] - Virtual router id
 */

/**
 * @typedef AddressRange
 * @property {string} AR_ID - Address range id
 * @property {string} [IP] - IP
 * @property {string} MAC - MAC
 * @property {string} SIZE - Size
 * @property {AR_TYPES} TYPE - Type
 * @property {string} USED_LEASES - Used leases
 * @property {{ LEASE: ARLease|ARLease[] }} [LEASES] - Leases information
 * @property {string} [GLOBAL_PREFIX] -Global prefix
 * @property {string} [PARENT_NETWORK_AR_ID] - Parent address range id
 * @property {string} [ULA_PREFIX] - ULA prefix
 * @property {string} [VN_MAD] - Virtual network manager
 * @property {string} [MAC_END] - MAC end
 * @property {string} [IP_END] - IP end
 * @property {string} [IP6_ULA] - IP6 ULA
 * @property {string} [IP6_ULA_END] - IP6 ULA end
 * @property {string} [IP6_GLOBAL] - IP6 global
 * @property {string} [IP6_GLOBAL_END] - IP6 global end
 * @property {string} [IP6] - IP6
 * @property {string} [IP6_END] - IP6 end
 * @property {string} [PORT_START] - Port start
 * @property {string} [PORT_SIZE] - Port size
 */

/**
 * @typedef VirtualNetwork
 * @property {string} ID - Id
 * @property {string} NAME - Name
 * @property {string} UID - User id
 * @property {string} UNAME - User name
 * @property {string} GID - Group id
 * @property {string} GNAME - Group name
 * @property {Permissions} PERMISSIONS - Permissions
 * @property {string|number} STATE - Current state
 * @property {string|number} PREV_STATE - Previous state
 * @property {LockInfo} [LOCK] - Lock information
 * @property {{ ID: string|string[] }} CLUSTERS - Clusters
 * @property {{ ID: string|string[] }} VROUTERS - Virtual routers
 * @property {string} BRIDGE - Bridge
 * @property {string} [BRIDGE_TYPE] - Bridge type
 * @property {string} PARENT_NETWORK_ID - Parent network id
 * @property {string} VN_MAD - Virtual network manager
 * @property {string} PHYDEV - Physical dev
 * @property {string} [VLAN_ID] - VLAN id
 * @property {string} [OUTER_VLAN_ID] - Outer VLAN id
 * @property {string} VLAN_ID_AUTOMATIC - VLAN id automatic
 * @property {string} OUTER_VLAN_ID_AUTOMATIC - Outer VLAN id automatic
 * @property {string} USED_LEASES - Used leases
 * @property {{ AR: AddressRange|AddressRange[] }} AR_POOL - Address range information
 * @property {object} TEMPLATE - Template
 * @property {string} [TEMPLATE.DNS] - DNS
 * @property {string} [TEMPLATE.GATEWAY] - Gateway
 * @property {string} [TEMPLATE.GATEWAY6] - Gateway6
 * @property {string} [TEMPLATE.GUEST_MTU] - Guest MTU
 * @property {string} [TEMPLATE.IP6_METHOD] - IP6 method
 * @property {string} [TEMPLATE.IP6_METRIC] - IP6 metric
 * @property {string} [TEMPLATE.METHOD] - Method
 * @property {string} [TEMPLATE.METRIC] - Metric
 * @property {string} [TEMPLATE.NETWORK_ADDRESS] - Network address
 * @property {string} [TEMPLATE.NETWORK_MASK] - Network mask
 * @property {string} [TEMPLATE.SEARCH_DOMAIN] - Domain
 * @property {string} [TEMPLATE.VCENTER_FROM_WILD] - vCenter information
 * @property {string} [TEMPLATE.VCENTER_INSTANCE_ID] - vCenter information
 * @property {string} [TEMPLATE.VCENTER_NET_REF] - vCenter information
 * @property {string} [TEMPLATE.VCENTER_PORTGROUP_TYPE] - vCenter information
 * @property {string} [TEMPLATE.VCENTER_TEMPLATE_REF] - vCenter information
 */

/** @type {STATES.StateInfo[]} Virtual Network states */
export const VN_STATES = [
  {
    // 0
    name: STATES.INIT,
    color: COLOR.info.light,
    meaning: 'Initialization state, the Virtual Network object was created',
  },
  {
    // 1
    name: STATES.READY,
    color: COLOR.success.main,
    meaning: 'Virtual Network is ready, can execute any action',
  },
  {
    // 2
    name: STATES.LOCK_CREATE,
    color: COLOR.error.light,
    meaning: 'The driver initialization action is in progress',
  },
  {
    // 3
    name: STATES.LOCK_DELETE,
    color: COLOR.error.light,
    meaning: 'The driver delete action is in progress',
  },
  {
    // 4
    name: STATES.DONE,
    color: COLOR.debug.light,
    meaning: 'Network driver delete successful',
  },
  {
    // 5
    name: STATES.ERROR,
    color: COLOR.error.dark,
    meaning: 'Driver action failed.',
  },
]

/** @enum {string} Virtual network actions */
export const VN_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  DELETE: 'delete',
  RECOVER: 'recover',
  UPDATE: 'update',

  // INFORMATION
  RENAME: ACTIONS.RENAME,
  CHANGE_MODE: ACTIONS.CHANGE_MODE,
  CHANGE_OWNER: ACTIONS.CHANGE_OWNER,
  CHANGE_GROUP: ACTIONS.CHANGE_GROUP,
}

/** @enum {string} Virtual network actions by state */
export const VN_ACTIONS_BY_STATE = {
  [VN_ACTIONS.DELETE]: [STATES.READY],
  [VN_ACTIONS.RECOVER]: [
    STATES.INIT,
    STATES.LOCK_CREATE,
    STATES.LOCK_DELETE,
    STATES.LOCKED,
    STATES.ERROR,
  ],
  [VN_ACTIONS.UPDATE]: [STATES.READY],

  // INFORMATION
  [VN_ACTIONS.RENAME]: [],
  [VN_ACTIONS.CHANGE_MODE]: [],
  [VN_ACTIONS.CHANGE_OWNER]: [],
  [VN_ACTIONS.CHANGE_GROUP]: [],
}

/** @enum {string} Type of Addresses defined by this address range */
export const AR_TYPES = {
  NONE: 'NONE',
  ETHER: 'ETHER',
  IP4: 'IP4',
  IP6: 'IP6',
  IP6_STATIC: 'IP6_STATIC',
  IP4_6: 'IP4_6',
  IP4_6_STATIC: 'IP4_6_STATIC',
}

/** @enum {string} Virtual Network Drivers */
export const VN_DRIVERS = {
  dummy: 'dummy',
  dot1Q: '802.1Q',
  ebtables: 'ebtables',
  fw: 'fw',
  ovswitch: 'ovswitch',
  vxlan: 'vxlan',
  vcenter: 'vcenter',
  ovswitch_vxlan: 'ovswitch_vxlan',
  bridge: 'bridge',
  elastic: 'elastic',
  nodeport: 'nodeport',
}

/**
 * @enum {{ high: number, low: number }}
 * Virtual Network threshold to specify the maximum and minimum of the bar range
 */
export const VNET_THRESHOLD = {
  LEASES: { high: 66, low: 33 },
}
