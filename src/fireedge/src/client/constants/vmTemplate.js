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
import * as ACTIONS from 'client/constants/actions'
// eslint-disable-next-line no-unused-vars
import { LockInfo, Permissions } from 'client/constants/common'

/**
 * @typedef VmTemplate
 * @property {string|number} ID - Id
 * @property {string} NAME - Name
 * @property {string|number} UID - User id
 * @property {string|number} GID - Group id
 * @property {string} UNAME - User name
 * @property {string} GNAME - Group name
 * @property {Permissions} PERMISSIONS - Permissions
 * @property {LockInfo} [LOCK] - Lock information
 * @property {string|number} REGTIME - Registration time
 * @property {object} TEMPLATE - Template information
 * @property {string} [TEMPLATE.CONTEXT] - Context
 */

/**
 * @typedef VmTemplateFeatures
 * @property {boolean} hide_cpu - If `true`, the CPU fields is hidden
 * @property {false|number} cpu_factor - Scales CPU by VCPU
 * - ``1``: Set it to 1 to tie CPU and vCPU
 * - ``{number}``: CPU = cpu_factor * VCPU
 * - ``{false}``: False to not scale the CPU
 */

export const VM_TEMPLATE_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  IMPORT_DIALOG: 'import_dialog',
  UPDATE_DIALOG: 'update_dialog',
  INSTANTIATE_DIALOG: 'instantiate_dialog',
  CREATE_APP_DIALOG: 'create_app_dialog',
  CLONE: 'clone',
  DELETE: 'delete',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  SHARE: 'share',
  UNSHARE: 'unshare',

  RENAME: ACTIONS.RENAME,
  CHANGE_OWNER: ACTIONS.CHANGE_OWNER,
  CHANGE_GROUP: ACTIONS.CHANGE_GROUP,
}

export const NUMA_PIN_POLICIES = {
  NONE: 'NONE',
  THREAD: 'THREAD',
  SHARED: 'SHARED',
  CORE: 'CORE',
  NODE_AFFINITY: 'NODE_AFFINITY',
}

export const NUMA_MEMORY_ACCESS = ['shared', 'private']

export const CPU_ARCHITECTURES = ['i686', 'x86_64']

export const DEFAULT_CPU_MODELS = ['host-passthrough']

export const SD_DISK_BUSES = ['scsi', 'sata']

export const DEVICE_TYPES = { mouse: 'mouse', tablet: 'tablet' }
export const DEVICE_BUS_TYPES = { usb: 'usb', ps2: 'ps2' }
export const VIDEO_TYPES = {
  auto: 'auto',
  none: 'none',
  vga: 'vga',
  cirrus: 'cirrus',
  virtio: 'virtio',
}
export const COMMON_RESOLUTIONS = {
  '1920x1080': '1920x1080',
  '1366x768': '1366x768',
  '1536x864': '1536x864',
  '1440x900': '1440x900',
  '1280x720': '1280x720',
  custom: 'custom',
}

export const FIRMWARE_TYPES = ['BIOS', 'EFI']

export const PCI_TYPES = { MANUAL: 'pci_manual', AUTOMATIC: 'pci_automatic' }

export const VCENTER_FIRMWARE_TYPES = FIRMWARE_TYPES.concat(['uefi'])

export const DEFAULT_TEMPLATE_LOGO = 'images/logos/default.png'

/** @enum {string} FS freeze options type */
export const FS_FREEZE_OPTIONS = {
  [T.None]: 'NONE',
  [T.QEMUAgent]: 'AGENT',
  [T.Suspend]: 'SUSPEND',
}

/** @enum {string} Excution options type */
export const EXECUTION_OPTIONS = {
  [T.Sequential]: 'SEQUENTIAL',
  [T.Parallel]: 'PARALLEL',
}

/** @enum {string} Backup mode options type */
export const BACKUP_MODE_OPTIONS = {
  [T.Full]: 'FULL',
  [T.Increment]: 'INCREMENT',
}

/** @enum {string} Backup increment mode options type */
export const BACKUP_INCREMENT_MODE_OPTIONS = {
  [T.Cbt]: 'CBT',
  [T.Snapshot]: 'SNAPSHOT',
}

/** @enum {string} NIC Hardware options */
export const NIC_HARDWARE = {
  EMULATED: 'emulated',
  PCI_PASSTHROUGH_AUTOMATIC: 'pci_automatic',
  PCI_PASSTHROUGH_MANUAL: 'pci_manual',
}

/** @enum {string} NIC Hardware options names */
export const NIC_HARDWARE_STR = {
  [NIC_HARDWARE.EMULATED]: T.Emulated,
  [NIC_HARDWARE.PCI_PASSTHROUGH_AUTOMATIC]: T.PCIPassthroughAutomatic,
  [NIC_HARDWARE.PCI_PASSTHROUGH_MANUAL]: T.PCIPassthroughManual,
}

/** @enum {string} Memory resize options */
export const MEMORY_RESIZE_OPTIONS = {
  [T.Ballooning]: 'BALLOONING',
  [T.Hotplug]: 'HOTPLUG',
}

export const TAB_FORM_MAP = {
  Storage: ['DISK', 'TM_MAD_SYSTEM'],
  Network: ['NIC', 'NIC_ALIAS', 'PCI', 'NIC_DEFAULT'],
  OsCpu: ['OS', 'CPU_MODEL', 'FEATURES', 'RAW'],
  PciDevices: ['PCI'],
  InputOutput: ['INPUT', 'GRAPHICS', 'VIDEO'],
  Context: ['CONTEXT', 'USER_INPUTS', 'INPUTS_ORDER'],
  ScheduleAction: ['SCHED_ACTION'],
  Placement: [
    'SCHED_DS_RANK',
    'SCHED_DS_REQUIREMENTS',
    'SCHED_RANK',
    'SCHED_REQUIREMENTS',
  ],
  NUMA: ['TOPOLOGY'],
  Backup: ['BACKUP_CONFIG'],
}

/** @enum {string} Methods on IP v4 options type */
export const IPV4_METHODS = {
  [T.Ipv4Static]: 'static',
  [T.Ipv4Dhcp]: 'dhcp',
  [T.Ipv4Skip]: 'skip',
}

/** @enum {string} Methods on IP v6 options type */
export const IPV6_METHODS = {
  [T.Ipv4Static]: 'static',
  [T.Ipv6Auto]: 'auto',
  [T.Ipv4Dhcp]: 'dhcp',
  [T.Ipv6Disable]: 'disable',
  [T.Ipv4Skip]: 'skip',
}
