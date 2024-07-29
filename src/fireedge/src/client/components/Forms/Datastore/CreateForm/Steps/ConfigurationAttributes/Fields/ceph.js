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
import { string, array } from 'yup'
import { Field } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'
import { isCeph, typeIsOneOf } from '../../functions'

/** @type {Field} - Ceph pool field */
const POOL_NAME = {
  name: 'POOL_NAME',
  label: T.CephPoolToStoreImages,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isCeph]) && INPUT_TYPES.HIDDEN,
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - Ceph hosts field */
const CEPH_HOST = {
  name: 'CEPH_HOST',
  label: T.CephHost,
  tooltip: [T.PressKeysToAddAValue, ['ENTER']],
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.AUTOCOMPLETE,
  multiple: true,
  htmlType: (type) => !typeIsOneOf(type, [isCeph]) && INPUT_TYPES.HIDDEN,
  validation: array(string().trim())
    .compact()
    .default(() => [])
    .when('$general.STORAGE_BACKEND', (storageBackend, schema) =>
      isCeph(storageBackend)
        ? schema.min(1, 'Is a required field').required()
        : schema
    ),
  fieldProps: {
    freeSolo: true,
    placeholder: 'host1 host2 host3',
  },
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - Ceph user field */
const CEPH_USER = {
  name: 'CEPH_USER',
  label: T.CephUser,
  tooltip: T.CephUserConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isCeph]) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isCeph(storageBackend),
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} - Ceph secret field */
const CEPH_SECRET = {
  name: 'CEPH_SECRET',
  label: T.CephSecret,
  tooltip: T.CephSecretConcept,
  dependOf: '$general.STORAGE_BACKEND',
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !typeIsOneOf(type, [isCeph]) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when('$general.STORAGE_BACKEND', {
      is: (storageBackend) => isCeph(storageBackend),
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { xs: 12, md: 6 },
}

const RDB_FORMAT = {
  name: 'RDB_FORMAT',
  label: T.RDBFormat,
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.STORAGE_BACKEND',
  htmlType: (type) => !typeIsOneOf(type, [isCeph]) && INPUT_TYPES.HIDDEN,
  validation: string().trim().notRequired(),
  grid: { xs: 12, md: 6 },
}

const CEPH_CONF = {
  name: 'CEPH_CONF',
  label: T.CephConfigurationFilePath,
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.STORAGE_BACKEND',
  htmlType: (type) => !typeIsOneOf(type, [isCeph]) && INPUT_TYPES.HIDDEN,
  validation: string().trim().notRequired(),
  grid: { xs: 12, md: 6 },
}

const CEPH_KEY = {
  name: 'CEPH_KEY',
  label: T.CephKeyfile,
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.STORAGE_BACKEND',
  htmlType: (type) => !typeIsOneOf(type, [isCeph]) && INPUT_TYPES.HIDDEN,
  validation: string().trim().notRequired(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field[]} - CEPH fields */
export const CEPH_FIELDS = [
  POOL_NAME,
  CEPH_HOST,
  CEPH_USER,
  CEPH_SECRET,
  RDB_FORMAT,
  CEPH_CONF,
  CEPH_KEY,
]
