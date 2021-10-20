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
import { string, number } from 'yup'

import { Field, arrayToOptions, filterFieldsByHypervisor } from 'client/utils'
import { T, INPUT_TYPES, HYPERVISORS } from 'client/constants'

const { vcenter, lxc, firecracker } = HYPERVISORS

/** @type {Field} ACPI field  */
export const ACPI = {
  name: 'OS.ACPI',
  label: T.Acpi,
  tooltip: T.AcpiConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions([T.Yes, T.No]),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
}

/** @type {Field} PAE field  */
export const PAE = {
  name: 'OS.PAE',
  label: T.Pae,
  tooltip: T.PaeConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions([T.Yes, T.No]),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
}

/** @type {Field} APIC field  */
export const APIC = {
  name: 'OS.APIC',
  label: T.Apic,
  tooltip: T.ApicConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions([T.Yes, T.No]),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
}

/** @type {Field} HYPER-V field  */
export const HYPERV = {
  name: 'OS.HYPERV',
  label: T.Hyperv,
  tooltip: T.HypervConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions([T.Yes, T.No]),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
}

/** @type {Field} Local time field  */
export const LOCALTIME = {
  name: 'OS.LOCALTIME',
  label: T.Localtime,
  tooltip: T.LocaltimeConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions([T.Yes, T.No]),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
}

/** @type {Field} Guest agent field  */
export const GUEST_AGENT = {
  name: 'OS.GUEST_AGENT',
  label: T.GuestAgent,
  tooltip: T.GuestAgentConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions([T.Yes, T.No]),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
}

/** @type {Field} Virtio-SCSI queues field  */
export const VIRTIO_SCSI_QUEUES = {
  name: 'OS.VIRTIO_SCSI_QUEUES',
  label: T.VirtioQueues,
  tooltip: T.VirtioQueuesConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(Array.from({ length: 16 }, (_, i) => i + 1)),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
}

/** @type {Field} IO threads field  */
export const IO_THREADS = {
  name: 'OS.IOTHREADS',
  label: T.IoThreads,
  tooltip: T.IoThreadsConcept,
  notOnHypervisors: [vcenter, lxc, firecracker],
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .default(() => undefined)
}

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @returns {Field[]} List of Features fields
 */
export const FEATURES_FIELDS = hypervisor =>
  filterFieldsByHypervisor(
    [
      ACPI,
      PAE,
      APIC,
      HYPERV,
      LOCALTIME,
      GUEST_AGENT,
      VIRTIO_SCSI_QUEUES,
      IO_THREADS
    ],
    hypervisor
  )
