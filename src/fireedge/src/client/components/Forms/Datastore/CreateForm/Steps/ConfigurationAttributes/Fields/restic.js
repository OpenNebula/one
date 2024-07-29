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
import { string, number, boolean } from 'yup'
import { Field, arrayToOptions, OPTION_SORTERS } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'
import { isRestic, typeIsOneOf } from '../../functions'

/** @type {Field} - Restic password field */
const RESTIC_PASSWORD = {
  name: 'RESTIC_PASSWORD',
  label: T.ResticPassword,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isRestic]) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isRestic(storageBackend),
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
}

const RESTIC_SFTP_SERVER = {
  name: 'RESTIC_SFTP_SERVER',
  label: T.ResticSFTPServer,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isRestic]) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isRestic(storageBackend),
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
}

const RESTIC_SFTP_USER = {
  name: 'RESTIC_SFTP_USER',
  label: T.ResticSFTPUser,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isRestic]) && INPUT_TYPES.HIDDEN,
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

const RESTIC_BWLIMIT = {
  name: 'RESTIC_BWLIMIT',
  label: T.BandwidthLimit,
  tooltip: T.BandwidthLimitConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) =>
    typeIsOneOf(type, [isRestic]) ? 'number' : INPUT_TYPES.HIDDEN,
  validation: number(),
  grid: { xs: 12, md: 6 },
}

const RESTIC_CONNECTIONS = {
  name: 'RESTIC_CONNECTIONS',
  label: T.BandwidthLimit,
  tooltip: T.BandwidthLimitConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) =>
    typeIsOneOf(type, [isRestic]) ? 'number' : INPUT_TYPES.HIDDEN,
  validation: number(),
  grid: { xs: 12, md: 6 },
}

const RESTIC_COMPRESSION = {
  name: 'RESTIC_COMPRESSION',
  label: T.CompressionLevel,
  tooltip: T.CompressionLevelConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () =>
    arrayToOptions(['OFF', 'AUTO', 'MAX'], {
      addEmpty: true,
      sorter: OPTION_SORTERS.unsort,
    }),
  htmlType: (type) => !typeIsOneOf(type, [isRestic]) && INPUT_TYPES.HIDDEN,
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - Backup I/O priority field */
const RESTIC_IONICE = {
  name: 'RESTIC_IONICE',
  label: T.BackupIOPriority,
  tooltip: T.BackupIOPriorityConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) =>
    typeIsOneOf(type, [isRestic]) ? 'number' : INPUT_TYPES.HIDDEN,
  validation: number(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - Backup CPU priority field */
const RESTIC_NICE = {
  name: 'RESTIC_NICE',
  label: T.BackupCPUPriority,
  tooltip: T.BackupCPUPriorityConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) =>
    typeIsOneOf(type, [isRestic]) ? 'number' : INPUT_TYPES.HIDDEN,
  validation: number(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - Backup max read IOPS field */
const RESTIC_MAX_RIOPS = {
  name: 'RESTIC_MAX_RIOPS',
  label: T.MaximumReadIOPS,
  tooltip: T.MaximumReadIOPSConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) =>
    typeIsOneOf(type, [isRestic]) ? 'number' : INPUT_TYPES.HIDDEN,
  validation: number(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - Backup max write IOPS field */
const RESTIC_MAX_WIOPS = {
  name: 'RESTIC_MAX_WIOPS',
  label: T.MaximumWriteIOPS,
  tooltip: T.MaximumWriteIOPSConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) =>
    typeIsOneOf(type, [isRestic]) ? 'number' : INPUT_TYPES.HIDDEN,
  validation: number(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - Backup CPU quota field */
const RESTIC_CPU_QUOTA = {
  name: 'RESTIC_CPU_QUOTA',
  label: T.MaximumWriteIOPS,
  tooltip: T.MaximumWriteIOPSConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) =>
    typeIsOneOf(type, [isRestic]) ? 'number' : INPUT_TYPES.HIDDEN,
  validation: number(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - RSync sparsify */
const RESTIC_MAXPROC = {
  name: 'RESTIC_MAXPROC',
  label: T.MaxNumberOSThreads,
  tooltip: T.MaxNumberOSThreadsConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) =>
    typeIsOneOf(type, [isRestic]) ? 'number' : INPUT_TYPES.HIDDEN,
  validation: number(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - RSync sparsify */
const RESTIC_SPARSIFY = {
  name: 'RESTIC_SPARSIFY',
  label: T.Sparsify,
  tooltip: T.SparsifyConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.SWITCH,
  htmlType: (type) => !typeIsOneOf(type, [isRestic]) && INPUT_TYPES.HIDDEN,
  validation: boolean().yesOrNo(),
  grid: { xs: 12, md: 6 },
}

export const RESTIC_FIELDS = [
  RESTIC_PASSWORD,
  RESTIC_SFTP_SERVER,
  RESTIC_SFTP_USER,
  RESTIC_BWLIMIT,
  RESTIC_CONNECTIONS,
  RESTIC_COMPRESSION,
  RESTIC_IONICE,
  RESTIC_NICE,
  RESTIC_MAX_RIOPS,
  RESTIC_MAX_WIOPS,
  RESTIC_CPU_QUOTA,
  RESTIC_MAXPROC,
  RESTIC_SPARSIFY,
]
