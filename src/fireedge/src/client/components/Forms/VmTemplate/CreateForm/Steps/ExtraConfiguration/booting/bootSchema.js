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
import { string, boolean } from 'yup'

import { useGetHostsQuery } from 'client/features/OneApi/host'
import { useGetVmmConfigQuery } from 'client/features/OneApi/system'
import { getKvmMachines } from 'client/models/Host'
import { Field, arrayToOptions } from 'client/utils'
import {
  T,
  INPUT_TYPES,
  CPU_ARCHITECTURES,
  SD_DISK_BUSES,
  FIRMWARE_TYPES,
  HYPERVISORS,
} from 'client/constants'

const { lxc, kvm } = HYPERVISORS

/** @type {Field} CPU architecture field */
export const ARCH = {
  name: 'OS.ARCH',
  label: T.CpuArchitecture,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () => arrayToOptions(CPU_ARCHITECTURES),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

/** @type {Field} Bus for SD disks field */
export const SD_DISK_BUS = {
  name: 'OS.SD_DISK_BUS',
  label: T.BusForSdDisks,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(SD_DISK_BUSES, { getText: (o) => o.toUpperCase() }),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

/** @type {Field} Machine type field */
export const MACHINE_TYPES = {
  name: 'OS.MACHINE',
  label: T.MachineType,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () => {
    const { data: hosts = [] } = useGetHostsQuery()
    const kvmMachines = getKvmMachines(hosts)

    return arrayToOptions(kvmMachines)
  },
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

/** @type {Field} Root device field */
export const ROOT_DEVICE = {
  name: 'OS.ROOT',
  label: T.RootDevice,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

/** @type {Field} Kernel CMD field */
export const KERNEL_CMD = {
  name: 'OS.KERNEL_CMD',
  label: T.KernelBootParameters,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  fieldProps: { placeholder: 'ro console=tty1' },
}

/** @type {Field} Path bootloader field */
export const BOOTLOADER = {
  name: 'OS.BOOTLOADER',
  label: T.PathBootloader,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} UUID field */
export const UUID = {
  name: 'OS.UUID',
  label: T.UniqueIdOfTheVm,
  tooltip: T.UniqueIdOfTheVmConcept,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Firmware field */
export const FIRMWARE = {
  name: 'OS.FIRMWARE',
  label: T.Firmware,
  tooltip: T.FirmwareConcept,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: false,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  dependOf: ['HYPERVISOR', '$general.HYPERVISOR'],
  values: ([templateHyperv, hypervisor = templateHyperv] = []) => {
    const configurableHypervisors = [kvm]
    const { data: { OVMF_UEFIS = '' } = {} } =
      configurableHypervisors?.includes(hypervisor) &&
      useGetVmmConfigQuery({ hypervisor })

    const types = FIRMWARE_TYPES.concat(
      OVMF_UEFIS?.replace(/"/g, '')?.split(' ') ?? []
    )

    return arrayToOptions(types)
  },
  fieldProps: {
    freeSolo: true,
  },
  grid: { md: 12 },
}

/** @type {Field} Firmware secure field  */
export const FIRMWARE_SECURE = {
  name: 'OS.FIRMWARE_SECURE',
  label: T.FirmwareSecure,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

/** @type {Field[]} List of Boot fields */
export const BOOT_FIELDS = [
  ARCH,
  SD_DISK_BUS,
  MACHINE_TYPES,
  ROOT_DEVICE,
  KERNEL_CMD,
  BOOTLOADER,
  UUID,
  FIRMWARE,
  FIRMWARE_SECURE,
]
