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
import { number, string, object, ObjectSchema } from 'yup'

import {
  Field,
  getValidationFromFields,
  filterFieldsByHypervisor,
  arrayToOptions,
  disableFields,
} from 'client/utils'
import {
  T,
  INPUT_TYPES,
  HYPERVISORS,
  SERVER_CONFIG,
  UNITS,
} from 'client/constants'

/** @type {Field} Size field */
const SIZE = {
  name: 'SIZE',
  label: [T.Size, 'MB'],
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .required()
    .default(() => undefined),
  grid: { xs: 12, md: 3 },
}

/**
 * @type {Field} size field
 * ISSUE#6136: Add unit size. Use only MB, GB, and TB (other values do not apply to create image).
 */
export const SIZEUNIT = {
  name: 'SIZEUNIT',
  label: T.SizeUnit,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  tooltip: T.SizeUnitTooltip,
  values: arrayToOptions([UNITS.MB, UNITS.GB, UNITS.TB], {
    addEmpty: false,
    getText: (type) => type,
    getValue: (type) => type,
  }),
  validation: string()
    .trim()
    .default(() => UNITS.MB),
  grid: { xs: 12, md: 3 },
}

/**
 * @param {HYPERVISORS} hypervisor - hypervisor
 * @returns {Field} Disk type field
 */
const TYPE = (hypervisor) => ({
  name: 'TYPE',
  label: T.DiskType,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: [
    { text: '-', value: undefined },
    { text: 'FS', value: 'fs' },
    { text: 'Swap', value: 'swap' },
  ],
  validation: string().trim().required().default(undefined),
})

/**
 * @param {HYPERVISORS} hypervisor - hypervisor
 * @returns {Field} Format field
 */
const FORMAT = (hypervisor) => ({
  name: 'FORMAT',
  label: T.Format,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: 'TYPE',
  htmlType: (type) => type === 'swap' && INPUT_TYPES.HIDDEN,
  values: [
    { text: '-', value: undefined },
    { text: 'Raw', value: 'raw' },
    { text: 'qcow2', value: 'qcow2' },
  ],
  validation: string()
    .trim()
    .when('TYPE', (type, schema) =>
      type === 'swap'
        ? schema.notRequired().default(undefined)
        : schema.required().default(undefined)
    ),
})

/** @type {Field} Filesystem field */
const FILESYSTEM = {
  name: 'FS',
  label: T.FileSystemType,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: 'TYPE',
  htmlType: (type) => type === 'swap' && INPUT_TYPES.HIDDEN,
  values: () => arrayToOptions(SERVER_CONFIG?.supported_fs),
  validation: string().trim().notRequired().default(undefined),
}

/**
 * @param {HYPERVISORS} hypervisor - hypervisor
 * @param {object} oneConfig - Config of oned.conf
 * @param {boolean} adminGroup - User is admin or not
 * @returns {Field[]} List of fields
 */
export const FIELDS = (hypervisor, oneConfig, adminGroup) =>
  disableFields(
    filterFieldsByHypervisor(
      [SIZE, SIZEUNIT, TYPE, FORMAT, FILESYSTEM],
      hypervisor
    ),
    'DISK',
    oneConfig,
    adminGroup
  )

/**
 * @param {HYPERVISORS} hypervisor - hypervisor
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = (hypervisor) =>
  object(getValidationFromFields(FIELDS(hypervisor)))
