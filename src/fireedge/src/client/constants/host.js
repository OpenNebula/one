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
import * as ACTIONS from 'client/constants/actions'
import COLOR from 'client/constants/color'
import * as STATES from 'client/constants/states'
import * as T from 'client/constants/translates'

/**
 * @typedef {object} PciDevice - PCI device
 * @property {string} ADDRESS - Address, bus, slot and function
 * @property {string} BUS - Address bus
 * @property {string} CLASS - Id of PCI device class
 * @property {string} CLASS_NAME - Name of PCI device class
 * @property {string} DEVICE - Id of PCI device
 * @property {string} DEVICE_NAME - Name of PCI device
 * @property {string} DOMAIN - Address domain
 * @property {string} FUNCTION - Address function
 * @property {string} NUMA_NODE - Numa node
 * @property {string} PROFILES - Available vGPU Profiles
 * @property {string} SHORT_ADDRESS - Short address
 * @property {string} SLOT - Address slot
 * @property {string} [UUID] - UUID
 * @property {string} TYPE - Type
 * @property {string} VENDOR - Id of PCI device vendor
 * @property {string} VENDOR_NAME - Name of PCI device vendor
 * @property {string|number} VMID - Id using this device, -1 if free
 */

/**
 * @typedef {object} Core - Core
 * @property {string} ID -
 * @property {string} CPUS -
 * @property {string} DEDICATED -
 * @property {string} FREE -
 */

/**
 * @typedef {object} HugePage - HugePage
 * @property {string} FREE -
 * @property {string} SIZE -
 * @property {string} USAGE -
 * @property {string} DEDICATED -
 */

/**
 * @typedef {object} NumaNode - Numa node
 * @property {string|number} NODE_ID -
 * @property {Core|Core[]} CORE -
 * @property {HugePage|HugePage[]} HUGEPAGE -
 * @property {object} MEMORY -
 * @property {string} MEMORY.DISTANCE -
 * @property {string|number} MEMORY.FREE -
 * @property {string|number} MEMORY.TOTAL -
 * @property {string|number} MEMORY.USAGE -
 * @property {string|number} MEMORY.USED -
 */

/**
 * @typedef Host
 * @property {string|number} ID - Id
 * @property {string} NAME - Name
 * @property {string|number} STATE - State
 * @property {string|number} PREV_STATE - Previously state
 * @property {string} IM_MAD - Name of the Information Manager
 * @property {string} VM_MAD - Name of the VM Manager
 * @property {string|number} CLUSTER_ID - Cluster id
 * @property {string} CLUSTER - Cluster name
 * @property {object} HOST_SHARE - Host shared information
 * @property {string|number} HOST_SHARE.MEM_USAGE - Memory used by all VMs running in the host
 * @property {string|number} HOST_SHARE.CPU_USAGE - CPU used by all VMs running in the host
 * @property {string|number} HOST_SHARE.TOTAL_MEM - Maximum memory that could be used for VMs
 * @property {string|number} HOST_SHARE.TOTAL_CPU -  Number of CPU’s multiplied by 100. For example, a 16 cores machine will have a value of 1600
 * @property {string|number} HOST_SHARE.MAX_MEM - Total memory in the host
 * @property {string|number} HOST_SHARE.MAX_CPU - Percentage, Total CPU in the host (cores * 100)
 * @property {string|number} HOST_SHARE.RUNNING_VMS - Running VMs
 * @property {string|number} HOST_SHARE.VMS_THREAD - Thread VMs
 * @property {object} HOST_SHARE.DATASTORES - Datastores information
 * @property {string|number} HOST_SHARE.DATASTORES.DISK_USAGE - Disk used by all datastores
 * @property {string|number} HOST_SHARE.DATASTORES.FREE_DISK - Free disk in the datastores
 * @property {string|number} HOST_SHARE.DATASTORES.MAX_DISK - Maximum of disk in the datastores
 * @property {string|number} HOST_SHARE.DATASTORES.USED_DISK - Used disk
 * @property {{ PCI: PciDevice|PciDevice[] }} HOST_SHARE.PCI_DEVICES - List of PCI devices
 * @property {{ NODE: NumaNode|NumaNode[] }} HOST_SHARE.NUMA_NODES - List of NUMA nodes
 * @property {{ ID: string|string[] }} VMS - List of VM ids
 * @property {object} TEMPLATE - Host template
 * @property {string} [TEMPLATE.ARCH] - Architecture
 * @property {string} [TEMPLATE.CPUSPEED] - CPU speed
 * @property {string} [TEMPLATE.HOSTNAME] - Host name
 * @property {string} [TEMPLATE.HYPERVISOR] - Hypervisor name
 * @property {string} [TEMPLATE.IM_MAD] - Information manager
 * @property {string} [TEMPLATE.VM_MAD] - VM manager
 * @property {string} [TEMPLATE.KVM_CPU_MODEL] - KVM CPU model
 * @property {string} [TEMPLATE.KVM_CPU_MODELS] - KVM CPU models
 * @property {string} [TEMPLATE.VERSION] - Version
 * @property {object} MONITORING - Monitoring information
 * @property {string} [MONITORING.TIMESTAMP] - Timestamp
 * @property {object} [MONITORING.CAPACITY] - Capacity information
 * @property {string} [MONITORING.CAPACITY.FREE_CPU] - Percentage, Free CPU as returned by the probes
 * @property {string} [MONITORING.CAPACITY.FREE_MEMORY] - Free MEMORY returned by the probes
 * @property {string} [MONITORING.CAPACITY.USED_CPU] - Percentage of CPU used by all host processes (including VMs) over a total of (cores * 100)
 * @property {string} [MONITORING.CAPACITY.USED_MEMORY] - Memory used by all host processes (including VMs) over a total of MAX_MEM
 * @property {object} [MONITORING.SYSTEM] - System information
 * @property {object} [MONITORING.SYSTEM.NETRX] - Received bytes from the network
 * @property {object} [MONITORING.SYSTEM.NETTX] - Sent bytes to the network
 */

/** @type {STATES.StateInfo[]} Host states */
export const HOST_STATES = [
  {
    name: STATES.INIT,
    shortName: 'init',
    color: COLOR.info.main,
  },
  {
    name: STATES.MONITORING_MONITORED,
    shortName: 'update',
    color: COLOR.info.main,
  },
  {
    name: STATES.MONITORED,
    shortName: 'on',
    color: COLOR.success.main,
  },
  {
    name: STATES.ERROR,
    shortName: 'err',
    color: COLOR.error.dark,
  },
  {
    name: STATES.DISABLED,
    shortName: 'dsbl',
    color: COLOR.error.light,
  },
  {
    name: STATES.MONITORING_ERROR,
    shortName: 'retry',
    color: COLOR.error.dark,
  },
  {
    name: STATES.MONITORING_INIT,
    shortName: 'init',
    color: COLOR.info.main,
  },
  {
    name: STATES.MONITORING_DISABLED,
    shortName: 'dsbl',
    color: COLOR.error.light,
  },
  {
    name: STATES.OFFLINE,
    shortName: 'off',
    color: COLOR.error.dark,
  },
]

/** @enum {string} Host actions */
export const HOST_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  RENAME: ACTIONS.RENAME,
  CHANGE_CLUSTER: 'change_cluster',
  ENABLE: 'enable',
  DISABLE: 'disable',
  OFFLINE: 'offline',
  DELETE: 'delete',
}

/** @enum {string} Numa Node CPU Status */
export const CPU_STATUS = {
  '-1': 'FREE',
  '-2': 'ISOLATED',
}

/** @enum {string} Pin Policy  */
export const PIN_POLICY = {
  NONE: 'NONE',
  PINNED: 'PINNED',
}

/** @enum {string} Custom Hypervisor */
export const CUSTOM_HOST_HYPERVISOR = {
  NAME: 'Custom',
  SUNSTONE_NAME: T.Custom,
}

/**
 * @enum {{ high: number, low: number }}
 * Host threshold to specify the maximum and minimum of the bar range
 */
export const HOST_THRESHOLD = {
  CPU: { high: 66, low: 33 },
  MEMORY: { high: 90, low: 40 },
}
