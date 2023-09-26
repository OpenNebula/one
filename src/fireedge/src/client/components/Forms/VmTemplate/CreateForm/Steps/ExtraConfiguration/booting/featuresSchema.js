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
import { number, string } from 'yup'

import { HYPERVISORS, INPUT_TYPES, T } from 'client/constants'
import { Field, OPTION_SORTERS, arrayToOptions } from 'client/utils'

const { vcenter, lxc, firecracker } = HYPERVISORS

const commonOptions = arrayToOptions([T.Yes, T.No], {
  getValue: (o) => o.toLowerCase(),
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
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: commonOptions,
  validation: commonValidation,
}

/** @type {Field} PAE field  */
export const PAE = {
  name: 'FEATURES.PAE',
  label: T.Pae,
  tooltip: T.PaeConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: commonOptions,
  validation: commonValidation,
}

/** @type {Field} APIC field  */
export const APIC = {
  name: 'FEATURES.APIC',
  label: T.Apic,
  tooltip: T.ApicConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: commonOptions,
  validation: commonValidation,
}

/** @type {Field} HYPER-V field  */
export const HYPERV = {
  name: 'FEATURES.HYPERV',
  label: T.Hyperv,
  tooltip: T.HypervConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: commonOptions,
  validation: commonValidation,
}

/** @type {Field} Local time field  */
export const LOCALTIME = {
  name: 'FEATURES.LOCALTIME',
  label: T.Localtime,
  tooltip: T.LocaltimeConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: commonOptions,
  validation: commonValidation,
}

/** @type {Field} Guest agent field  */
export const GUEST_AGENT = {
  name: 'FEATURES.GUEST_AGENT',
  label: T.GuestAgent,
  tooltip: T.GuestAgentConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: commonOptions,
  validation: commonValidation,
}

/** @type {Field} Virtio-SCSI queues field  */
export const VIRTIO_SCSI_QUEUES = {
  name: 'FEATURES.VIRTIO_SCSI_QUEUES',
  dependOf: '$general.VCPU',
  label: T.VirtioQueues,
  tooltip: T.VirtioQueuesConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: optionsInputsVirtio,
  validation: commonValidation,
}

/** @type {Field} Virtio-BLK queues field  */
export const VIRTIO_BLK_QUEUES = {
  name: 'FEATURES.VIRTIO_BLK_QUEUES',
  dependOf: '$general.VCPU',
  label: T.VirtioBlkQueues,
  tooltip: T.VirtioBlkQueuesConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: optionsInputsVirtio,
  validation: commonValidation,
}

/** @type {Field} IO threads field  */
export const IO_THREADS = {
  name: 'FEATURES.IOTHREADS',
  label: T.IoThreads,
  tooltip: T.IoThreadsConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .positive()
    .default(() => undefined),
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
]
