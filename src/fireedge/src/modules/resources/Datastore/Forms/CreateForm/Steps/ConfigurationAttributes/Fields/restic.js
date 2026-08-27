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
import { string, number, boolean } from 'yup'
import { Field, arrayToOptions, OPTION_SORTERS } from '@UtilsModule'
import { T, INPUT_TYPES } from '@ConstantsModule'
import { isRestic, typeIsOneOf, afterSubmitVirtioFs } from '../../functions'

const RESTIC_BACKENDS = {
  SFTP: 'SFTP',
  S3: 'S3',
}

const RESTIC_BACKEND_DEPENDENCIES = [
  '$general.STORAGE_BACKEND',
  'RESTIC_BACKEND',
]

const isResticBackend = (storageBackend, resticBackend, backend) =>
  isRestic(storageBackend) && resticBackend === backend

const isResticSftp = (storageBackend, resticBackend) =>
  isResticBackend(storageBackend, resticBackend, RESTIC_BACKENDS.SFTP)

const isResticS3 = (storageBackend, resticBackend) =>
  isResticBackend(storageBackend, resticBackend, RESTIC_BACKENDS.S3)

const getResticStringValidation = (backendCondition, required = false) =>
  string()
    .trim()
    .when(RESTIC_BACKEND_DEPENDENCIES, {
      is: backendCondition,
      then: (schema) => (required ? schema.required() : schema.notRequired()),
      otherwise: (schema) => schema.notRequired(),
    })
    .default(() => undefined)

const getResticS3BooleanValidation = () =>
  boolean()
    .yesOrNo(false)
    .notRequired()
    .default(() => false)

/** @type {Field} - Restic backend field */
const RESTIC_BACKEND = {
  name: 'RESTIC_BACKEND',
  label: T.ResticBackend,
  tooltip: T.ResticBackendConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () =>
    arrayToOptions(Object.values(RESTIC_BACKENDS), {
      addEmpty: false,
      sorter: OPTION_SORTERS.unsort,
    }),
  htmlType: (storageBackend) => !isRestic(storageBackend) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .oneOf(Object.values(RESTIC_BACKENDS))
    .required()
    .default(() => RESTIC_BACKENDS.SFTP),
  grid: { xs: 12, md: 6 },
}

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
  dependOf: RESTIC_BACKEND_DEPENDENCIES,
  type: INPUT_TYPES.TEXT,
  htmlType: ([storageBackend, resticBackend] = []) =>
    !isResticSftp(storageBackend, resticBackend) && INPUT_TYPES.HIDDEN,
  validation: getResticStringValidation(isResticSftp, true),
  grid: { xs: 12, md: 6 },
}

const RESTIC_SFTP_USER = {
  name: 'RESTIC_SFTP_USER',
  label: T.ResticSFTPUser,
  dependOf: RESTIC_BACKEND_DEPENDENCIES,
  type: INPUT_TYPES.TEXT,
  htmlType: ([storageBackend, resticBackend] = []) =>
    !isResticSftp(storageBackend, resticBackend) && INPUT_TYPES.HIDDEN,
  validation: getResticStringValidation(isResticSftp),
  grid: { xs: 12, md: 6 },
}

const RESTIC_S3_ACCESS_KEY_ID = {
  name: 'RESTIC_S3_ACCESS_KEY_ID',
  label: T.ResticS3AccessKeyId,
  tooltip: T.ResticS3AccessKeyIdConcept,
  dependOf: RESTIC_BACKEND_DEPENDENCIES,
  type: INPUT_TYPES.TEXT,
  htmlType: ([storageBackend, resticBackend] = []) =>
    !isResticS3(storageBackend, resticBackend) && INPUT_TYPES.HIDDEN,
  validation: getResticStringValidation(isResticS3, true),
  grid: { xs: 12, md: 6 },
}

const RESTIC_S3_SECRET_ACCESS_KEY = {
  name: 'RESTIC_S3_SECRET_ACCESS_KEY',
  label: T.ResticS3SecretAccessKey,
  tooltip: T.ResticS3SecretAccessKeyConcept,
  dependOf: RESTIC_BACKEND_DEPENDENCIES,
  type: INPUT_TYPES.PASSWORD,
  htmlType: ([storageBackend, resticBackend] = []) =>
    !isResticS3(storageBackend, resticBackend) && INPUT_TYPES.HIDDEN,
  validation: getResticStringValidation(isResticS3, true),
  grid: { xs: 12, md: 6 },
}

const RESTIC_S3_BUCKET = {
  name: 'RESTIC_S3_BUCKET',
  label: T.ResticS3Bucket,
  tooltip: T.ResticS3BucketConcept,
  dependOf: RESTIC_BACKEND_DEPENDENCIES,
  type: INPUT_TYPES.TEXT,
  htmlType: ([storageBackend, resticBackend] = []) =>
    !isResticS3(storageBackend, resticBackend) && INPUT_TYPES.HIDDEN,
  validation: getResticStringValidation(isResticS3, true),
  grid: { xs: 12, md: 6 },
}

const RESTIC_S3_REGION = {
  name: 'RESTIC_S3_REGION',
  label: T.ResticS3Region,
  tooltip: T.ResticS3RegionConcept,
  dependOf: RESTIC_BACKEND_DEPENDENCIES,
  type: INPUT_TYPES.TEXT,
  htmlType: ([storageBackend, resticBackend] = []) =>
    !isResticS3(storageBackend, resticBackend) && INPUT_TYPES.HIDDEN,
  validation: getResticStringValidation(isResticS3),
  grid: { xs: 12, md: 6 },
}

const RESTIC_S3_ENDPOINT = {
  name: 'RESTIC_S3_ENDPOINT',
  label: T.ResticS3Endpoint,
  tooltip: T.ResticS3EndpointConcept,
  dependOf: RESTIC_BACKEND_DEPENDENCIES,
  type: INPUT_TYPES.TEXT,
  htmlType: ([storageBackend, resticBackend] = []) =>
    !isResticS3(storageBackend, resticBackend) && INPUT_TYPES.HIDDEN,
  validation: getResticStringValidation(isResticS3),
  grid: { xs: 12, md: 6 },
}

const RESTIC_S3_FORCE_PATH_STYLE = {
  name: 'RESTIC_S3_FORCE_PATH_STYLE',
  label: T.ResticS3ForcePathStyle,
  tooltip: T.ResticS3ForcePathStyleConcept,
  dependOf: RESTIC_BACKEND_DEPENDENCIES,
  type: INPUT_TYPES.SWITCH,
  htmlType: ([storageBackend, resticBackend] = []) =>
    !isResticS3(storageBackend, resticBackend) && INPUT_TYPES.HIDDEN,
  validation: getResticS3BooleanValidation(),
  grid: { xs: 12, md: 6 },
}

const RESTIC_S3_CACERT = {
  name: 'RESTIC_S3_CACERT',
  label: T.ResticS3CACert,
  tooltip: T.ResticS3CACertConcept,
  dependOf: RESTIC_BACKEND_DEPENDENCIES,
  type: INPUT_TYPES.TEXT,
  htmlType: ([storageBackend, resticBackend] = []) =>
    !isResticS3(storageBackend, resticBackend) && INPUT_TYPES.HIDDEN,
  validation: getResticStringValidation(isResticS3),
  grid: { xs: 12, md: 6 },
}

const RESTIC_S3_INSECURE_TLS = {
  name: 'RESTIC_S3_INSECURE_TLS',
  label: T.ResticS3InsecureTLS,
  tooltip: T.ResticS3InsecureTLSConcept,
  dependOf: RESTIC_BACKEND_DEPENDENCIES,
  type: INPUT_TYPES.SWITCH,
  htmlType: ([storageBackend, resticBackend] = []) =>
    !isResticS3(storageBackend, resticBackend) && INPUT_TYPES.HIDDEN,
  validation: getResticS3BooleanValidation(),
  grid: { xs: 12, md: 6 },
}

const TOTAL_MB = {
  name: 'TOTAL_MB',
  label: T.ResticS3TotalMB,
  tooltip: T.ResticS3TotalMBConcept,
  dependOf: RESTIC_BACKEND_DEPENDENCIES,
  type: INPUT_TYPES.TEXT,
  htmlType: ([storageBackend, resticBackend] = []) =>
    isResticS3(storageBackend, resticBackend) ? 'number' : INPUT_TYPES.HIDDEN,
  validation: number()
    .when(RESTIC_BACKEND_DEPENDENCIES, {
      is: isResticS3,
      then: (schema) => schema.positive().integer().notRequired(),
      otherwise: (schema) => schema.notRequired(),
    })
    .default(() => undefined),
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
  label: T.CPUQuota,
  tooltip: T.CPUQuotaConcept,
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
  validation: boolean().yesOrNo().afterSubmit(afterSubmitVirtioFs),
  grid: { xs: 12, md: 6 },
}

export const RESTIC_FIELDS = [
  RESTIC_BACKEND,
  RESTIC_PASSWORD,
  RESTIC_SFTP_SERVER,
  RESTIC_SFTP_USER,
  RESTIC_S3_ACCESS_KEY_ID,
  RESTIC_S3_SECRET_ACCESS_KEY,
  RESTIC_S3_BUCKET,
  RESTIC_S3_REGION,
  RESTIC_S3_ENDPOINT,
  RESTIC_S3_FORCE_PATH_STYLE,
  RESTIC_S3_CACERT,
  RESTIC_S3_INSECURE_TLS,
  TOTAL_MB,
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
