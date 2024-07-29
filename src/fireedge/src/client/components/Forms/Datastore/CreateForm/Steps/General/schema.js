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
import { string, object, ObjectSchema } from 'yup'
import {
  Field,
  getValidationFromFields,
  arrayToOptions,
  OPTION_SORTERS,
} from 'client/utils'
import {
  T,
  INPUT_TYPES,
  DATASTORE_TYPES,
  DATASTORE_OPTIONS,
  TRANSFER_OPTIONS,
  DS_STORAGE_BACKENDS,
} from 'client/constants'

function getStorageBackendsFromDStype(type) {
  const ds = Object.values(DATASTORE_TYPES).filter(
    ({ value }) => value === type
  )

  return ds[0]?.storageBackends
}

/** @type {Field} Toggle select type image */
const TYPE = {
  name: 'TYPE',
  label: T.DatastoreType,
  type: INPUT_TYPES.TOGGLE,
  values: arrayToOptions(Object.values(DATASTORE_TYPES), {
    addEmpty: false,
    getText: ({ name }) => name.toUpperCase(),
    getValue: ({ value }) => value,
  }),
  validation: string()
    .trim()
    .required()
    .default(() => DATASTORE_TYPES.IMAGE.value),
  grid: { md: 12 },
  notNull: true,
}

/** @type {Field} name field */
const NAME = {
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().required(),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} Type field */
const STORAGE_BACKEND = {
  name: 'STORAGE_BACKEND',
  label: T.StorageBackend,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: TYPE.name,
  values: (type) =>
    arrayToOptions(getStorageBackendsFromDStype(type), {
      addEmpty: true,
      getText: ({ name }) => name,
      getValue: ({ value }) => value,
      sorter: OPTION_SORTERS.unsort,
    }),
  validation: string()
    .trim()
    .default(() => undefined)
    .required(),
  grid: { md: 6 },
}

const DS_MAD = {
  name: 'DS_MAD',
  label: T.Datastore,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: STORAGE_BACKEND.name,
  values: arrayToOptions(Object.values(DATASTORE_OPTIONS), {
    addEmpty: false,
    getText: ({ name }) => name,
    getValue: ({ value }) => value,
    sorter: OPTION_SORTERS.unsort,
  }),
  htmlType: (storageBackend) =>
    storageBackend !== DS_STORAGE_BACKENDS.CUSTOM.value && INPUT_TYPES.HIDDEN,
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

const TM_MAD = {
  name: 'TM_MAD',
  label: T.Transfer,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: STORAGE_BACKEND.name,
  values: arrayToOptions(Object.values(TRANSFER_OPTIONS), {
    addEmpty: false,
    getText: ({ name }) => name,
    getValue: ({ value }) => value,
    sorter: OPTION_SORTERS.unsort,
  }),
  htmlType: (storageBackend) =>
    storageBackend !== DS_STORAGE_BACKENDS.CUSTOM.value && INPUT_TYPES.HIDDEN,
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

const CUSTOM_DS_MAD = {
  name: 'CUSTOM_DS_MAD',
  label: T.CustomDSMAD,
  type: INPUT_TYPES.TEXT,
  dependOf: [DS_MAD.name, STORAGE_BACKEND.name],
  htmlType: ([dsMad, storageBackend] = []) =>
    (dsMad !== DATASTORE_OPTIONS.CUSTOM.value ||
      storageBackend !== DS_STORAGE_BACKENDS.CUSTOM.value) &&
    INPUT_TYPES.HIDDEN,
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

const CUSTOM_TM_MAD = {
  name: 'CUSTOM_TM_MAD',
  label: T.CustomTMMAD,
  type: INPUT_TYPES.TEXT,
  dependOf: [TM_MAD.name, STORAGE_BACKEND.name],
  htmlType: ([tmMad, storageBackend] = []) =>
    (tmMad !== TRANSFER_OPTIONS.CUSTOM.value ||
      storageBackend !== DS_STORAGE_BACKENDS.CUSTOM.value) &&
    INPUT_TYPES.HIDDEN,
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

/**
 * @returns {Field[]} Fields
 */
export const FIELDS = [
  TYPE,
  NAME,
  STORAGE_BACKEND,
  DS_MAD,
  TM_MAD,
  CUSTOM_DS_MAD,
  CUSTOM_TM_MAD,
]

/**
 * @param {object} [stepProps] - Step props
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = object(getValidationFromFields(FIELDS))
