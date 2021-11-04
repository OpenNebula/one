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
import { string, boolean } from 'yup'

import { useHost } from 'client/features/One'
import { getKvmMachines, getKvmCpuModels } from 'client/models/Host'
import { Field, arrayToOptions } from 'client/utils'
import {
  T,
  INPUT_TYPES,
  CPU_ARCHITECTURES,
  SD_DISK_BUSES,
  FIRMWARE_TYPES,
  KVM_FIRMWARE_TYPES,
  VCENTER_FIRMWARE_TYPES,
  HYPERVISORS
} from 'client/constants'

const { vcenter, firecracker, lxc, kvm } = HYPERVISORS

/** @type {Field} CPU architecture field */
export const ARCH = {
  name: 'OS.ARCH',
  label: T.CpuArchitecture,
  notOnHypervisors: [vcenter, firecracker, lxc],
  type: INPUT_TYPES.SELECT,
  values: () => arrayToOptions(CPU_ARCHITECTURES),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
}

/** @type {Field} Bus for SD disks field */
export const SD_DISK_BUS = {
  name: 'OS.SD_DISK_BUS',
  label: T.BusForSdDisks,
  notOnHypervisors: [vcenter, firecracker, lxc],
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(SD_DISK_BUSES, { getText: o => o.toUpperCase() }),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
}

/** @type {Field} Machine type field */
export const MACHINE_TYPES = {
  name: 'OS.MACHINE',
  label: T.MachineType,
  notOnHypervisors: [vcenter, firecracker, lxc],
  type: INPUT_TYPES.SELECT,
  values: () => {
    const hosts = useHost()
    const kvmMachines = getKvmMachines(hosts)

    return arrayToOptions(kvmMachines)
  },
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
}

/** @type {Field} CPU Model field */
export const CPU_MODEL = {
  name: 'OS.MODEL',
  label: T.CpuModel,
  notOnHypervisors: [vcenter, firecracker, lxc],
  type: INPUT_TYPES.SELECT,
  values: () => {
    const hosts = useHost()
    const kvmCpuModels = getKvmCpuModels(hosts)

    return arrayToOptions(kvmCpuModels)
  },
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
}

/** @type {Field} Root device field */
export const ROOT_DEVICE = {
  name: 'OS.ROOT',
  label: T.RootDevice,
  notOnHypervisors: [vcenter, firecracker, lxc],
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
}

/** @type {Field} Kernel CMD field */
export const KERNEL_CMD = {
  name: 'OS.KERNEL_CMD',
  label: T.KernelBootParameters,
  notOnHypervisors: [vcenter, lxc],
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  fieldProps: { placeholder: 'ro console=tty1' }
}

/** @type {Field} Path bootloader field */
export const BOOTLOADER = {
  name: 'OS.BOOTLOADER',
  label: T.PathBootloader,
  notOnHypervisors: [vcenter, lxc],
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 }
}

/** @type {Field} UUID field */
export const UUID = {
  name: 'OS.UUID',
  label: T.UniqueIdOfTheVm,
  tooltip: T.UniqueIdOfTheVmConcept,
  notOnHypervisors: [firecracker, lxc],
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 }
}

/** @type {Field} Feature custom field  */
export const FEATURE_CUSTOM_ENABLED = {
  name: 'OS.FEATURE_CUSTOM_ENABLED',
  label: T.CustomPath,
  notOnHypervisors: [vcenter, firecracker, lxc],
  type: INPUT_TYPES.SWITCH,
  validation: boolean().strip().default(() => false),
  grid: { md: 12 }
}

/** @type {Field} Firmware field */
export const FIRMWARE = {
  name: 'OS.FIRMWARE',
  label: T.Firmware,
  tooltip: T.FirmwareConcept,
  notOnHypervisors: [firecracker, lxc],
  type: ([_, custom]) => custom ? INPUT_TYPES.TEXT : INPUT_TYPES.SELECT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  dependOf: ['$general.HYPERVISOR', FEATURE_CUSTOM_ENABLED.name],
  values: ([hypervisor] = []) => {
    const types = {
      [vcenter]: VCENTER_FIRMWARE_TYPES,
      [kvm]: KVM_FIRMWARE_TYPES
    }[hypervisor] ?? FIRMWARE_TYPES

    return arrayToOptions(types)
  },
  grid: { md: 12 }
}

/** @type {Field} Feature secure field  */
export const FIRMWARE_SECURE = {
  name: 'OS.FIRMWARE_SECURE',
  label: T.FirmwareSecure,
  notOnHypervisors: [vcenter, firecracker, lxc],
  type: INPUT_TYPES.CHECKBOX,
  dependOf: FEATURE_CUSTOM_ENABLED.name,
  htmlType: custom => !custom && INPUT_TYPES.HIDDEN,
  validation: boolean()
    .default(() => false)
    .transform(value => {
      if (typeof value === 'boolean') return value

      return String(value).toUpperCase() === 'YES'
    }),
  grid: { md: 12 }
}

/** @type {Field[]} List of Boot fields */
export const BOOT_FIELDS = [
  ARCH,
  SD_DISK_BUS,
  MACHINE_TYPES,
  CPU_MODEL,
  ROOT_DEVICE,
  KERNEL_CMD,
  BOOTLOADER,
  UUID,
  FEATURE_CUSTOM_ENABLED,
  FIRMWARE,
  FIRMWARE_SECURE
]
