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
import { string, number } from 'yup'
import { INPUT_TYPES, T, HYPERVISORS, Field } from 'client/constants'
import { useDisableInputByUserAndConfig } from 'client/features/Auth'

const { lxc } = HYPERVISORS

/** @type {Field[]} List of general fields */
export const GENERAL_FIELDS = [
  {
    name: 'TARGET',
    label: T.TargetDevice,
    tooltip: T.TargetDeviceConcept,
    type: INPUT_TYPES.TEXT,
    notOnHypervisors: [lxc],
    validation: string().trim().notRequired().default(undefined),
    fieldProps: { placeholder: 'sdc' },
  },
  {
    name: 'READONLY',
    label: T.ReadOnly,
    type: INPUT_TYPES.AUTOCOMPLETE,
    optionsOnly: true,
    values: [
      { text: T.Yes, value: 'YES' },
      { text: T.No, value: 'NO' },
    ],
    validation: string()
      .trim()
      .notRequired()
      .default(() => 'NO'),
  },
  {
    name: 'DEV_PREFIX',
    label: T.Bus,
    notOnHypervisors: [lxc],
    type: INPUT_TYPES.AUTOCOMPLETE,
    optionsOnly: true,
    values: [
      { text: '', value: '' },
      { text: 'Virtio', value: 'vd' },
      { text: 'SCSI/SATA', value: 'sd' },
      { text: 'Parallel ATA (IDE)', value: 'hd' },
      { text: 'Custom', value: 'custom' },
    ],
    validation: string().trim().notRequired().default(undefined),
  },
  {
    name: 'CACHE',
    label: T.Cache,
    notOnHypervisors: [lxc],
    type: INPUT_TYPES.AUTOCOMPLETE,
    optionsOnly: true,
    values: [
      { text: '', value: '' },
      { text: 'Default', value: 'default' },
      { text: 'Writethrough', value: 'writethrough' },
      { text: 'Writeback', value: 'writeback' },
      { text: 'Directsync', value: 'directsync' },
      { text: 'Unsafe', value: 'unsafe' },
    ],
    validation: string().trim().notRequired().default(undefined),
  },
  {
    name: 'IO',
    label: T.IoPolicy,
    notOnHypervisors: [lxc],
    type: INPUT_TYPES.AUTOCOMPLETE,
    optionsOnly: true,
    values: [
      { text: '', value: '' },
      { text: 'Threads', value: 'threads' },
      { text: 'Native', value: 'native' },
      { text: 'io_uring', value: 'io_uring' },
    ],
    validation: string().trim().notRequired().default(undefined),
  },
  {
    name: 'DISCARD',
    label: T.Discard,
    notOnHypervisors: [lxc],
    type: INPUT_TYPES.AUTOCOMPLETE,
    optionsOnly: true,
    values: [
      { text: '', value: '' },
      { text: 'Ignore', value: 'ignore' },
      { text: 'Unmap', value: 'unmap' },
    ],
    validation: string().trim().notRequired().default(undefined),
  },
  {
    name: 'SIZE_IOPS_SEC',
    label: T.IopsSize,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'IOTHREADS',
    label: T.IoThreadId,
    tooltip: T.IoThreadIdConcept,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
]

/** @type {Field[]} List of throttling bytes fields */
export const THROTTLING_BYTES_FIELDS = [
  {
    name: 'TOTAL_BYTES_SEC',
    label: T.TotalValue,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'TOTAL_BYTES_SEC_MAX',
    label: T.TotalMaximum,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'TOTAL_BYTES_SEC_MAX_LENGTH',
    label: T.TotalMaximumLength,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'READ_BYTES_SEC',
    label: T.ReadValue,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'READ_BYTES_SEC_MAX',
    label: T.ReadMaximum,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'READ_BYTES_SEC_MAX_LENGTH',
    label: T.ReadMaximumLength,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    fieldProps: () =>
      useDisableInputByUserAndConfig('DISK/READ_BYTES_SEC_MAX_LENGTH'),
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'WRITE_BYTES_SEC',
    label: T.WriteValue,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    fieldProps: () => useDisableInputByUserAndConfig('DISK/WRITE_BYTES_SEC'),
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'WRITE_BYTES_SEC_MAX',
    label: T.WriteMaximum,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    fieldProps: () =>
      useDisableInputByUserAndConfig('DISK/WRITE_BYTES_SEC_MAX'),
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'WRITE_BYTES_SEC_MAX_LENGTH',
    label: T.WriteMaximumLength,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    fieldProps: () =>
      useDisableInputByUserAndConfig('DISK/WRITE_BYTES_SEC_MAX_LENGTH'),
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
]

/** @type {Field[]} List of throttling IOPS fields */
export const THROTTLING_IOPS_FIELDS = [
  {
    name: 'TOTAL_IOPS_SEC',
    label: T.TotalValue,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    fieldProps: () => useDisableInputByUserAndConfig('DISK/TOTAL_IOPS_SEC'),
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'TOTAL_IOPS_SEC_MAX',
    label: T.TotalMaximum,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    fieldProps: () => useDisableInputByUserAndConfig('DISK/TOTAL_IOPS_SEC_MAX'),
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'TOTAL_IOPS_SEC_MAX_LENGTH',
    label: T.TotalMaximumLength,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    fieldProps: () =>
      useDisableInputByUserAndConfig('DISK/TOTAL_IOPS_SEC_MAX_LENGTH'),
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'READ_IOPS_SEC',
    label: T.ReadValue,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    fieldProps: () => useDisableInputByUserAndConfig('DISK/READ_IOPS_SEC'),
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'READ_IOPS_SEC_MAX',
    label: T.ReadMaximum,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    fieldProps: () => useDisableInputByUserAndConfig('DISK/READ_IOPS_SEC_MAX'),
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'READ_IOPS_SEC_MAX_LENGTH',
    label: T.ReadMaximumLength,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    fieldProps: () =>
      useDisableInputByUserAndConfig('DISK/READ_IOPS_SEC_MAX_LENGTH'),
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'WRITE_IOPS_SEC',
    label: T.WriteValue,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    fieldProps: () => useDisableInputByUserAndConfig('DISK/WRITE_IOPS_SEC'),
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'WRITE_IOPS_SEC_MAX',
    label: T.WriteMaximum,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    fieldProps: () => useDisableInputByUserAndConfig('DISK/WRITE_IOPS_SEC_MAX'),
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'WRITE_IOPS_SEC_MAX_LENGTH',
    label: T.WriteMaximumLength,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    fieldProps: () =>
      useDisableInputByUserAndConfig('DISK/WRITE_IOPS_SEC_MAX_LENGTH'),
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
  },
]

/** @type {Field[]} List of edge cluster fields */
export const EDGE_CLUSTER_FIELDS = [
  {
    name: 'RECOVERY_SNAPSHOT_FREQ',
    label: T.SnapshotFrequency,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    notOnHypervisors: [lxc],
    validation: number()
      .min(0)
      .notRequired()
      .default(() => undefined),
    grid: { md: 12 },
  },
]
