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
import { Field } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'
import { isRsync, typeIsOneOf } from '../../functions'

/** @type {Field} - RSync host field */
const RSYNC_HOST = {
  name: 'RSYNC_HOST',
  label: T.RsyncHost,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isRsync]) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isRsync(storageBackend),
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - RSync user field */
const RSYNC_USER = {
  name: 'RSYNC_USER',
  label: T.RsyncUser,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isRsync]) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isRsync(storageBackend),
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - Backup I/O priority field */
const RSYNC_IONICE = {
  name: 'RSYNC_IONICE',
  label: T.BackupIOPriority,
  tooltip: T.BackupIOPriorityConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) =>
    typeIsOneOf(type, [isRsync]) ? 'number' : INPUT_TYPES.HIDDEN,
  validation: number(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - Backup CPU priority field */
const RSYNC_NICE = {
  name: 'RSYNC_NICE',
  label: T.BackupCPUPriority,
  tooltip: T.BackupCPUPriorityConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) =>
    typeIsOneOf(type, [isRsync]) ? 'number' : INPUT_TYPES.HIDDEN,
  validation: number(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - Backup max read IOPS field */
const RSYNC_MAX_RIOPS = {
  name: 'RSYNC_MAX_RIOPS',
  label: T.MaximumReadIOPS,
  tooltip: T.MaximumReadIOPSConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) =>
    typeIsOneOf(type, [isRsync]) ? 'number' : INPUT_TYPES.HIDDEN,
  validation: number(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - Backup max write IOPS field */
const RSYNC_MAX_WIOPS = {
  name: 'RSYNC_MAX_WIOPS',
  label: T.MaximumWriteIOPS,
  tooltip: T.MaximumWriteIOPSConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) =>
    typeIsOneOf(type, [isRsync]) ? 'number' : INPUT_TYPES.HIDDEN,
  validation: number(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - Backup CPU quota field */
const RSYNC_CPU_QUOTA = {
  name: 'RSYNC_CPU_QUOTA',
  label: T.MaximumWriteIOPS,
  tooltip: T.MaximumWriteIOPSConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) =>
    typeIsOneOf(type, [isRsync]) ? 'number' : INPUT_TYPES.HIDDEN,
  validation: number(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - RSync arguments */
const RSYNC_ARGS = {
  name: 'RSYNC_ARGS',
  label: T.Arguments,
  tooltip: T.RsyncArgumentsConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isRsync]) && INPUT_TYPES.HIDDEN,
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - RSync temporal directory */
const RSYNC_TMP_DIR = {
  name: 'RSYNC_TMP_DIR',
  label: T.TemporalDirectory,
  tooltip: T.TemporalDirectoryConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isRsync]) && INPUT_TYPES.HIDDEN,
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - RSync sparsify */
const RSYNC_SPARSIFY = {
  name: 'RSYNC_SPARSIFY',
  label: T.Sparsify,
  tooltip: T.SparsifyConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.SWITCH,
  htmlType: (type) => !typeIsOneOf(type, [isRsync]) && INPUT_TYPES.HIDDEN,
  validation: boolean().yesOrNo(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field[]} - RSync fields */
export const RSYNC_FIELDS = [
  RSYNC_HOST,
  RSYNC_USER,
  RSYNC_IONICE,
  RSYNC_NICE,
  RSYNC_MAX_RIOPS,
  RSYNC_MAX_WIOPS,
  RSYNC_CPU_QUOTA,
  RSYNC_ARGS,
  RSYNC_TMP_DIR,
  RSYNC_SPARSIFY,
]
