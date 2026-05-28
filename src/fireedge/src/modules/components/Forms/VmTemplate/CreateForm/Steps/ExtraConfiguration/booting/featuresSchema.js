/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { number, string } from 'yup'

import { HYPERVISORS, INPUT_TYPES, T } from '@ConstantsModule'
import { Field, OPTION_SORTERS, arrayToOptions } from '@UtilsModule'

const { lxc } = HYPERVISORS

const commonOptions = arrayToOptions([T.Yes, T.No], {
  getValue: (o) => o.toLowerCase(),
})
const gicOptions = arrayToOptions(['2', '3', 'host'], {
  getValue: (o) => o.toLowerCase(),
  sorter: OPTION_SORTERS.unsort,
})

const commonValidation = string()
  .trim()
  .notRequired()
  .default(() => undefined)

const optionsInputsVirtio = (vcpu) => {
  const limit = vcpu ? 2 * vcpu : 4
  const options = Array.from({ length: limit }, (_, i) => i + 1)
  options.unshift('auto')

  return arrayToOptions(options, { sorter: OPTION_SORTERS.unsort })
}

/** @type {Field} ACPI field  */
export const ACPI = {
  name: 'FEATURES.ACPI',
  label: T.Acpi,
  tooltip: T.AcpiConcept,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: commonOptions,
  validation: commonValidation,
}

/** @type {Field} PAE field  */
export const PAE = {
  name: 'FEATURES.PAE',
  label: T.Pae,
  tooltip: T.PaeConcept,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: commonOptions,
  validation: commonValidation,
}

/** @type {Field} APIC field  */
export const APIC = {
  name: 'FEATURES.APIC',
  label: T.Apic,
  tooltip: T.ApicConcept,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: commonOptions,
  validation: commonValidation,
}

/** @type {Field} HYPER-V field  */
export const HYPERV = {
  name: 'FEATURES.HYPERV',
  label: T.Hyperv,
  tooltip: T.HypervConcept,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: commonOptions,
  validation: commonValidation,
}

/** @type {Field} Local time field  */
export const LOCALTIME = {
  name: 'FEATURES.LOCALTIME',
  label: T.Localtime,
  tooltip: T.LocaltimeConcept,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: commonOptions,
  validation: commonValidation,
}

/** @type {Field} Guest agent field  */
export const GUEST_AGENT = {
  name: 'FEATURES.GUEST_AGENT',
  label: T.GuestAgent,
  tooltip: T.GuestAgentConcept,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: commonOptions,
  validation: commonValidation,
}

/** @type {Field} Virtio-SCSI queues field  */
export const VIRTIO_SCSI_QUEUES = {
  name: 'FEATURES.VIRTIO_SCSI_QUEUES',
  dependOf: '$general.VCPU',
  label: T.VirtioQueues,
  tooltip: T.VirtioQueuesConcept,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: optionsInputsVirtio,
  validation: commonValidation,
}

/** @type {Field} Virtio-BLK queues field  */
export const VIRTIO_BLK_QUEUES = {
  name: 'FEATURES.VIRTIO_BLK_QUEUES',
  dependOf: '$general.VCPU',
  label: T.VirtioBlkQueues,
  tooltip: T.VirtioBlkQueuesConcept,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: optionsInputsVirtio,
  validation: commonValidation,
}

/** @type {Field} IO threads field  */
export const IO_THREADS = {
  name: 'FEATURES.IOTHREADS',
  label: T.IoThreads,
  tooltip: T.IoThreadsConcept,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .positive()
    .default(() => undefined),
}

/** @type {Field} RAS field  */
export const RAS = {
  name: 'FEATURES.RAS',
  label: T.Ras,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: commonOptions,
  validation: commonValidation,
}

/** @type {Field} GIC field  */
export const GIC = {
  name: 'FEATURES.GIC',
  label: T.Gic,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: gicOptions,
  validation: commonValidation,
}

/** @type {Field} PCIHOLE64 field  */
export const PCIHOLE64 = {
  name: 'FEATURES.PCIHOLE64',
  label: T.PciHole64,
  tooltip: T.PciHole64Concept,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.UNITSKB,
  htmlType: 'number',
  validation: number()
    .positive()
    .notRequired()
    .default(() => undefined),
}

/** @type {Field} MIGRATE_AUTO_CONVERGE_INITIAL field  */
export const MIGRATE_AUTO_CONVERGE_INITIAL = {
  name: 'FEATURES.MIGRATE_AUTO_CONVERGE_INITIAL',
  label: T.MigrateAutoConvergeInitial,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  fieldProps: { min: 1, max: 100 },
  validation: number()
    .min(1)
    .max(100)
    .notRequired()
    .default(() => undefined),
}

/** @type {Field} MIGRATE_AUTO_CONVERGE_INCREMENT field  */
export const MIGRATE_AUTO_CONVERGE_INCREMENT = {
  name: 'FEATURES.MIGRATE_AUTO_CONVERGE_INCREMENT',
  label: T.MigrateAutoConvergeIncrement,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  fieldProps: { min: 1, max: 100 },
  validation: number()
    .min(1)
    .max(100)
    .notRequired()
    .default(() => undefined),
}

/** @type {Field} MIGRATE_COMPRESSED field  */
export const MIGRATE_COMPRESSED = {
  name: 'FEATURES.MIGRATE_COMPRESSED',
  label: T.MigrateCompressed,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: commonOptions,
  validation: commonValidation,
}

/** @type {Field[]} List of Features fields */
export const FEATURES_FIELDS = [
  ACPI,
  PAE,
  APIC,
  HYPERV,
  LOCALTIME,
  GUEST_AGENT,
  VIRTIO_SCSI_QUEUES,
  VIRTIO_BLK_QUEUES,
  IO_THREADS,
  RAS,
  GIC,
  PCIHOLE64,
  MIGRATE_AUTO_CONVERGE_INITIAL,
  MIGRATE_AUTO_CONVERGE_INCREMENT,
  MIGRATE_COMPRESSED,
]
