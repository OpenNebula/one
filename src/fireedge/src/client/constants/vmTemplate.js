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
import * as ACTIONS from 'client/constants/actions'

export const VM_TEMPLATE_ACTIONS = {
  REFRESH: ACTIONS.REFRESH,
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

export const NUMA_PIN_POLICIES = ['NONE', 'THREAD', 'SHARED', 'CORE']

export const NUMA_MEMORY_ACCESS = ['shared', 'private']

export const CPU_ARCHITECTURES = ['i686', 'x86_64']

export const DEFAULT_CPU_MODELS = ['host-passthrough']

export const SD_DISK_BUSES = ['scsi', 'sata']

export const DEVICE_TYPES = { mouse: 'mouse', tablet: 'tablet' }
export const DEVICE_BUS_TYPES = { usb: 'usb', ps2: 'ps2' }

export const FIRMWARE_TYPES = ['BIOS']

export const KVM_FIRMWARE_TYPES = FIRMWARE_TYPES.concat([
  '/usr/share/OVMF/OVMF_CODE.fd',
  '/usr/share/OVMF/OVMF_CODE.secboot.fd',
])

export const VCENTER_FIRMWARE_TYPES = FIRMWARE_TYPES.concat(['uefi'])
