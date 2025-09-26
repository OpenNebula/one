/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { Field } from '@UtilsModule'
import { InputAdornment } from '@mui/material'
import { T, INPUT_TYPES } from '@ConstantsModule'
import { isNetapp, typeIsOneOf } from '../../functions'

/** @type {Field} - NetApp host field */
const NETAPP_HOST = {
  name: 'NETAPP_HOST',
  label: T.NetappHost,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isNetapp]) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isNetapp(storageBackend),
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - NetApp user field */
const NETAPP_USER = {
  name: 'NETAPP_USER',
  label: T.NetappUser,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isNetapp]) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isNetapp(storageBackend),
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - NetApp password field */
const NETAPP_PASS = {
  name: 'NETAPP_PASS',
  label: T.NetappPass,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.PASSWORD,
  htmlType: (type) => !typeIsOneOf(type, [isNetapp]) && INPUT_TYPES.HIDDEN,
  validation: string().when('$general.STORAGE_BACKEND', {
    is: (storageBackend) => isNetapp(storageBackend),
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.notRequired(),
  }),
  grid: { xs: 12, md: 6 },
}

const NETAPP_SVM = {
  name: 'NETAPP_SVM',
  label: T.NetappSVM,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isNetapp]) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isNetapp(storageBackend),
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
}

const NETAPP_AGGREGATES = {
  name: 'NETAPP_AGGREGATES',
  label: T.NetappAgg,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isNetapp]) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isNetapp(storageBackend),
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
}

const NETAPP_IGROUP = {
  name: 'NETAPP_IGROUP',
  label: T.NetappIgroup,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isNetapp]) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isNetapp(storageBackend),
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
}

const NETAPP_TARGET = {
  name: 'NETAPP_TARGET',
  label: T.NetappTarget,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isNetapp]) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isNetapp(storageBackend),
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
}

const NETAPP_SUFFIX = {
  name: 'NETAPP_SUFFIX',
  label: T.NetappSuffix,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isNetapp]) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isNetapp(storageBackend),
      then: (schema) => schema.notRequired(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
}

const NETAPP_GROW_THRESHOLD = {
  name: 'NETAPP_GROW_THRESHOLD',
  label: T.NetappGrowThresh,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.SLIDER,
  htmlType: (type) => !typeIsOneOf(type, [isNetapp]) && INPUT_TYPES.HIDDEN,
  validation: number()
    .positive()
    .min(0)
    .max(100)
    .default(() => 0)
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isNetapp(storageBackend),
      then: (schema) => schema.notRequired(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
  fieldProps: {
    min: 0,
    max: 100,
    step: 1,
    startAdornment: <InputAdornment position="start">%</InputAdornment>,
  },
}

const NETAPP_GROW_RATIO = {
  name: 'NETAPP_GROW_RATIO',
  label: T.NetappGrowRatio,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isNetapp]) && INPUT_TYPES.HIDDEN,
  validation: number()
    .positive()
    .default(() => 2)
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isNetapp(storageBackend),
      then: (schema) => schema.notRequired(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
}

const NETAPP_SNAPSHOT_RESERVE = {
  name: 'NETAPP_SNAPSHOT_RESERVE',
  label: T.NetappSnapshotReserve,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.SLIDER,
  htmlType: (type) => !typeIsOneOf(type, [isNetapp]) && INPUT_TYPES.HIDDEN,
  validation: number()
    .positive()
    .min(0)
    .max(100)
    .default(() => 10)
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isNetapp(storageBackend),
      then: (schema) => schema.notRequired(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
  fieldProps: {
    min: 0,
    max: 100,
    step: 1,
    startAdornment: <InputAdornment position="start">%</InputAdornment>,
  },
}

/** @type {Field[]} - NetApp fields */
export const NETAPP_FIELDS = [
  NETAPP_HOST,
  NETAPP_USER,
  NETAPP_PASS,
  NETAPP_SVM,
  NETAPP_AGGREGATES,
  NETAPP_IGROUP,
  NETAPP_TARGET,
  NETAPP_SUFFIX,
  NETAPP_GROW_THRESHOLD,
  NETAPP_GROW_RATIO,
  NETAPP_SNAPSHOT_RESERVE,
]
