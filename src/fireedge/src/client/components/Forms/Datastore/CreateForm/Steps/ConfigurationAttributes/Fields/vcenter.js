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
import { string } from 'yup'
import { Field, arrayToOptions, OPTION_SORTERS } from 'client/utils'
import {
  T,
  INPUT_TYPES,
  DATASTORE_TYPES,
  DS_VCENTER_ADAPTER_TYPE_OPTIONS,
  DS_VCENTER_DISK_TYPE_OPTIONS,
} from 'client/constants'
import { isVcenter, typeIsOneOf } from '../../functions'

const VCENTER_ADAPTER_TYPE = {
  name: 'VCENTER_ADAPTER_TYPE',
  label: T.AdapterTypeUsedByVirtualDisksVMs,
  type: INPUT_TYPES.SELECT,
  values: () =>
    arrayToOptions(Object.values(DS_VCENTER_ADAPTER_TYPE_OPTIONS), {
      addEmpty: true,
      sorter: OPTION_SORTERS.unsort,
    }),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  dependOf: '$general.STORAGE_BACKEND',
  htmlType: (type) => !typeIsOneOf(type, [isVcenter]) && INPUT_TYPES.HIDDEN,
  grid: { sm: 12, md: 6 },
}

const VCENTER_DISK_TYPE = {
  name: 'VCENTER_DISK_TYPE',
  label: T.TypeOfDiskToBeCreated,
  type: INPUT_TYPES.SELECT,
  values: () =>
    arrayToOptions(Object.values(DS_VCENTER_DISK_TYPE_OPTIONS), {
      addEmpty: true,
      sorter: OPTION_SORTERS.unsort,
    }),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  dependOf: '$general.STORAGE_BACKEND',
  htmlType: (type) => !typeIsOneOf(type, [isVcenter]) && INPUT_TYPES.HIDDEN,
  grid: { sm: 12, md: 6 },
}

const VCENTER_DS_REF = {
  name: 'VCENTER_DS_REF',
  label: T.ManagedObjectReferenceOfTheDatastore,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(['$general.STORAGE_BACKEND', '$general.TYPE'], {
      is: (storageBackend, type) =>
        isVcenter(storageBackend) && type === DATASTORE_TYPES.IMAGE.value,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  dependOf: '$general.STORAGE_BACKEND',
  htmlType: (type) => !typeIsOneOf(type, [isVcenter]) && INPUT_TYPES.HIDDEN,
  grid: { sm: 12, md: 6 },
}

const VCENTER_DS_NAME = {
  name: 'VCENTER_DS_NAME',
  label: T.NameOfTheVcenterDatastore,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  dependOf: '$general.STORAGE_BACKEND',
  htmlType: (type) => !typeIsOneOf(type, [isVcenter]) && INPUT_TYPES.HIDDEN,
  grid: { sm: 12, md: 6 },
}

const VCENTER_DC_REF = {
  name: 'VCENTER_DC_REF',
  label: T.ManagedObjectReferenceOfTheDatacenter,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(['$general.STORAGE_BACKEND', '$general.TYPE'], {
      is: (storageBackend, type) =>
        isVcenter(storageBackend) && type === DATASTORE_TYPES.IMAGE.value,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  dependOf: '$general.STORAGE_BACKEND',
  htmlType: (type) => !typeIsOneOf(type, [isVcenter]) && INPUT_TYPES.HIDDEN,
  grid: { sm: 12, md: 6 },
}

const VCENTER_DC_NAME = {
  name: 'VCENTER_DC_NAME',
  label: T.NameOfTheVcenterDatacenter,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  dependOf: '$general.STORAGE_BACKEND',
  htmlType: (type) => !typeIsOneOf(type, [isVcenter]) && INPUT_TYPES.HIDDEN,
  grid: { sm: 12, md: 6 },
}

const VCENTER_INSTANCE_ID = {
  name: 'VCENTER_INSTANCE_ID',
  label: T.vCenterInstanceId,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(['$general.STORAGE_BACKEND', '$general.TYPE'], {
      is: (storageBackend, type) =>
        isVcenter(storageBackend) && type === DATASTORE_TYPES.IMAGE.value,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  dependOf: '$general.STORAGE_BACKEND',
  htmlType: (type) => !typeIsOneOf(type, [isVcenter]) && INPUT_TYPES.HIDDEN,
  grid: { sm: 12, md: 6 },
}

const VCENTER_DS_IMAGE_DIR = {
  name: 'VCENTER_DS_IMAGE_DIR',
  label: T.vCenterImageDirectory,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  dependOf: '$general.STORAGE_BACKEND',
  htmlType: (type) => !typeIsOneOf(type, [isVcenter]) && INPUT_TYPES.HIDDEN,
  grid: { sm: 12, md: 6 },
}

const VCENTER_DS_VOLATILE_DIR = {
  name: 'VCENTER_DS_VOLATILE_DIR',
  label: T.vCenterVolatileDirectory,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  dependOf: '$general.STORAGE_BACKEND',
  htmlType: (type) => !typeIsOneOf(type, [isVcenter]) && INPUT_TYPES.HIDDEN,
  grid: { sm: 12, md: 6 },
}

/** @type {Field} - vCenter host field */
const VCENTER_HOST = {
  name: 'VCENTER_HOST',
  label: T.HostnameOrIPOfTheVcenterHost,
  type: INPUT_TYPES.TEXT,
  dependOf: '$general.STORAGE_BACKEND',
  validation: string().default(() => undefined),
  htmlType: (type) => !typeIsOneOf(type, [isVcenter]) && INPUT_TYPES.HIDDEN,
  grid: { sm: 12, md: 6 },
}

/** @type {Field[]} - vCenter fields */
export const VCENTER_FIELDS = [
  VCENTER_INSTANCE_ID,
  VCENTER_DS_REF,
  VCENTER_DC_REF,
  VCENTER_ADAPTER_TYPE,
  VCENTER_DISK_TYPE,
  VCENTER_DS_NAME,
  VCENTER_DC_NAME,
  VCENTER_DS_IMAGE_DIR,
  VCENTER_DS_VOLATILE_DIR,
  VCENTER_HOST,
]
