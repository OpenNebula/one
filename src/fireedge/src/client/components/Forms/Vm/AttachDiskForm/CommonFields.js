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
import * as yup from 'yup'
import { INPUT_TYPES, T, HYPERVISORS } from 'client/constants'

const { kvm, vcenter, firecracker, lxc } = HYPERVISORS

export const TARGET = {
  name: 'TARGET',
  label: 'Target device',
  notOnHypervisors: [vcenter, firecracker, lxc],
  tooltip: `
    Device to map image disk.
    If set, it will overwrite the default device mapping.`,
  type: INPUT_TYPES.TEXT,
  validation: yup.string().trim().notRequired().default(undefined),
}

export const READONLY = {
  name: 'READONLY',
  label: 'Read only',
  notOnHypervisors: [vcenter],
  type: INPUT_TYPES.SELECT,
  values: [
    { text: T.Yes, value: 'YES' },
    { text: T.No, value: 'NO' },
  ],
  validation: yup
    .string()
    .trim()
    .notRequired()
    .default(() => 'NO'),
}

export const DEV_PREFIX = {
  name: 'DEV_PREFIX',
  label: 'BUS',
  notOnHypervisors: [vcenter, firecracker, lxc],
  type: INPUT_TYPES.SELECT,
  values: [
    { text: '', value: '' },
    { text: 'Virtio', value: 'vd' },
    { text: 'CSI/SATA', value: 'sd' },
    { text: 'Parallel ATA (IDE)', value: 'hd' },
    { text: 'Custom', value: 'custom' },
  ],
  validation: yup.string().trim().notRequired().default(undefined),
}

export const VCENTER_ADAPTER_TYPE = {
  name: 'VCENTER_ADAPTER_TYPE',
  label: 'Bus adapter controller',
  notOnHypervisors: [kvm, firecracker],
  type: INPUT_TYPES.SELECT,
  values: [
    { text: '', value: '' },
    { text: 'lsiLogic', value: 'lsiLogic' },
    { text: 'ide', value: 'ide' },
    { text: 'busLogic', value: 'busLogic' },
    { text: 'Custom', value: 'custom' },
  ],
  validation: yup.string().trim().notRequired().default(undefined),
}

export const VCENTER_DISK_TYPE = {
  name: 'VCENTER_DISK_TYPE',
  label: 'Disk provisioning type',
  notOnHypervisors: [kvm, firecracker],
  type: INPUT_TYPES.SELECT,
  values: [
    { text: '', value: '' },
    { text: 'Thin', value: 'thin' },
    { text: 'Thick', value: 'thick' },
    { text: 'Eager Zeroed Thick', value: 'eagerZeroedThick' },
    { text: 'Custom', value: 'custom' },
  ],
  validation: yup.string().trim().notRequired().default(undefined),
}

export const CACHE = {
  name: 'CACHE',
  label: 'Cache',
  notOnHypervisors: [vcenter, firecracker, lxc],
  type: INPUT_TYPES.SELECT,
  values: [
    { text: '', value: '' },
    { text: 'Default', value: 'default' },
    { text: 'Writethrough', value: 'writethrough' },
    { text: 'Writeback', value: 'writeback' },
    { text: 'Directsync', value: 'directsync' },
    { text: 'Unsafe', value: 'unsafe' },
  ],
  validation: yup.string().trim().notRequired().default(undefined),
}

export const IO = {
  name: 'IO',
  label: 'IO Policy',
  notOnHypervisors: [vcenter, firecracker, lxc],
  type: INPUT_TYPES.SELECT,
  values: [
    { text: '', value: '' },
    { text: 'Threads', value: 'threads' },
    { text: 'Native', value: 'native' },
  ],
  validation: yup.string().trim().notRequired().default(undefined),
}

export const DISCARD = {
  name: 'DISCARD',
  label: 'Discard',
  notOnHypervisors: [vcenter, firecracker, lxc],
  type: INPUT_TYPES.SELECT,
  values: [
    { text: '', value: '' },
    { text: 'Ignore', value: 'ignore' },
    { text: 'Unmap', value: 'unmap' },
  ],
  validation: yup.string().trim().notRequired().default(undefined),
}
