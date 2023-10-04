/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
 * @property {string} [TEMPLATE.VCENTER_CCR_REF] - vCenter information
 * @property {string} [TEMPLATE.VCENTER_INSTANCE_ID] - vCenter information
 * @property {string} [TEMPLATE.VCENTER_TEMPLATE_REF] - vCenter information
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

export const FIRMWARE_TYPES = ['BIOS']

export const KVM_FIRMWARE_TYPES = FIRMWARE_TYPES.concat([
  '/usr/share/OVMF/OVMF_CODE.fd',
  '/usr/share/OVMF/OVMF_CODE.secboot.fd',
])

export const PCI_TYPES = { MANUAL: 'pci_manual', AUTOMATIC: 'pci_automatic' }

export const VCENTER_FIRMWARE_TYPES = FIRMWARE_TYPES.concat(['uefi'])

export const DEFAULT_TEMPLATE_LOGO = 'images/logos/default.png'

export const TEMPLATE_LOGOS = {
  'Alpine Linux': 'images/logos/alpine.png',
  ALT: 'images/logos/alt.png',
  Arch: 'images/logos/arch.png',
  CentOS: 'images/logos/centos.png',
  Debian: 'images/logos/debian.png',
  Devuan: 'images/logos/devuan.png',
  Fedora: 'images/logos/fedora.png',
  FreeBSD: 'images/logos/freebsd.png',
  HardenedBSD: 'images/logos/hardenedbsd.png',
  Knoppix: 'images/logos/knoppix.png',
  Linux: 'images/logos/linux.png',
  Oracle: 'images/logos/oracle.png',
  RedHat: 'images/logos/redhat.png',
  Suse: 'images/logos/suse.png',
  Ubuntu: 'images/logos/ubuntu.png',
  'Windows xp': 'images/logos/windowsxp.png',
  'Windows 10': 'images/logos/windows8.png',
}

/** @enum {string} FS freeze options type */
export const FS_FREEZE_OPTIONS = {
  [T.None]: 'NONE',
  [T.QEMUAgent]: 'QEMU-AGENT',
  [T.Suspend]: 'SUSPEND',
}

/** @enum {string} Backup mode options type */
export const BACKUP_MODE_OPTIONS = {
  [T.Full]: 'FULL',
  [T.Increment]: 'INCREMENT',
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
