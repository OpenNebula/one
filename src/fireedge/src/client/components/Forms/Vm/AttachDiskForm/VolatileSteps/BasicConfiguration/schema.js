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
import { number, string, object, ObjectSchema } from 'yup'

import {
  Field,
  getValidationFromFields,
  filterFieldsByHypervisor,
  arrayToOptions,
} from 'client/utils'
import { T, INPUT_TYPES, HYPERVISORS, SERVER_CONFIG } from 'client/constants'

const { vcenter } = HYPERVISORS

/** @type {Field} Size field */
const SIZE = {
  name: 'SIZE',
  label: [T.SizeOnUnits, 'MB'],
  tooltip: T.SizeConcept,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .required()
    .default(() => undefined),
}

/**
 * @param {HYPERVISORS} hypervisor - hypervisor
 * @returns {Field} Disk type field
 */
const TYPE = (hypervisor) => ({
  name: 'TYPE',
  label: T.DiskType,
  type: INPUT_TYPES.SELECT,
  values:
    hypervisor === vcenter
      ? [{ text: 'FS', value: 'fs' }]
      : [
          { text: 'FS', value: 'fs' },
          { text: 'Swap', value: 'swap' },
        ],
  validation: string().trim().notRequired().default('fs'),
})

/**
 * @param {HYPERVISORS} hypervisor - hypervisor
 * @returns {Field} Format field
 */
const FORMAT = (hypervisor) => ({
  name: 'FORMAT',
  label: T.Format,
  type: INPUT_TYPES.SELECT,
  dependOf: 'TYPE',
  htmlType: (type) => type === 'swap' && INPUT_TYPES.HIDDEN,
  values:
    hypervisor === vcenter
      ? [{ text: 'Raw', value: 'raw' }]
      : [
          { text: 'Raw', value: 'raw' },
          { text: 'qcow2', value: 'qcow2' },
        ],
  validation: string()
    .trim()
    .when('TYPE', (type, schema) =>
      type === 'swap' ? schema.notRequired() : schema.required()
    )
    .default('raw'),
})

/** @type {Field} Filesystem field */
const FILESYSTEM = {
  name: 'FS',
  label: T.FileSystemType,
  notOnHypervisors: [vcenter],
  type: INPUT_TYPES.SELECT,
  dependOf: 'TYPE',
  htmlType: (type) => type === 'swap' && INPUT_TYPES.HIDDEN,
  values: () => arrayToOptions(SERVER_CONFIG?.supported_fs),
  validation: string().trim().notRequired().default(undefined),
}

/**
 * @param {HYPERVISORS} hypervisor - hypervisor
 * @returns {Field[]} List of fields
 */
export const FIELDS = (hypervisor) =>
  filterFieldsByHypervisor([SIZE, TYPE, FORMAT, FILESYSTEM], hypervisor)

/**
 * @param {HYPERVISORS} hypervisor - hypervisor
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = (hypervisor) =>
  object(getValidationFromFields(FIELDS(hypervisor)))
