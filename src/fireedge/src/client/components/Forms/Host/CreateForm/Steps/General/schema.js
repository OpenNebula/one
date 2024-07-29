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
import { BaseSchema, string } from 'yup'

import { T, INPUT_TYPES, CUSTOM_HOST_HYPERVISOR } from 'client/constants'

import {
  Field,
  getObjectSchemaFromFields,
  OPTION_SORTERS,
  arrayToOptions,
} from 'client/utils'

import { getHostHypervisors } from 'client/models/Host'

/** @type {Field} Hypervisor field */
const HYPERVISOR_FIELD = {
  name: 'vmmMad',
  type: INPUT_TYPES.TOGGLE,
  values: () =>
    arrayToOptions(getHostHypervisors({ includeCustom: true }), {
      addEmpty: false,
      getText: (hypervisor) => hypervisor.displayName,
      getValue: (hypervisor) => hypervisor.driverName,
      sorter: OPTION_SORTERS.unsort,
    }),
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Name field */
const INFORMATION_FIELD = {
  name: 'hostname',
  label: T['host.form.create.general.name'],
  tooltip: T['host.form.create.general.name.tooltip'],
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Custom virtualization selector field */
const CUSTOM_VM_MAD = {
  name: 'customVmmMad',
  label: T.Virtualization,
  type: INPUT_TYPES.AUTOCOMPLETE,
  dependOf: HYPERVISOR_FIELD.name,
  htmlType: (vmmMad) =>
    vmmMad !== CUSTOM_HOST_HYPERVISOR.NAME && INPUT_TYPES.HIDDEN,
  values: () =>
    arrayToOptions(getHostHypervisors({ includeCustom: true }), {
      addEmpty: false,
      getText: (item) => item.displayName,
      getValue: (item) => item.driverName,
      sorter: OPTION_SORTERS.unsort,
    }),
  validation: string()
    .trim()
    .default(() => undefined)
    .when(HYPERVISOR_FIELD.name, (vmmMad, schema) =>
      vmmMad === CUSTOM_HOST_HYPERVISOR.NAME
        ? schema.required()
        : schema.strip().notRequired()
    ),
  grid: { md: 7 },
}

/** @type {Field} Custom information selector field */
const CUSTOM_IM_MAD = {
  name: 'customImMad',
  label: T.Information,
  type: INPUT_TYPES.AUTOCOMPLETE,
  dependOf: HYPERVISOR_FIELD.name,
  htmlType: (vmmMad) =>
    vmmMad !== CUSTOM_HOST_HYPERVISOR.NAME && INPUT_TYPES.HIDDEN,
  values: () =>
    arrayToOptions(getHostHypervisors({ includeCustom: true }), {
      addEmpty: false,
      getText: (item) => item.displayName,
      getValue: (item) => item.driverName,
      sorter: OPTION_SORTERS.unsort,
    }),
  validation: string()
    .trim()
    .default(() => undefined)
    .when(HYPERVISOR_FIELD.name, (vmmMad, schema) =>
      vmmMad === CUSTOM_HOST_HYPERVISOR.NAME
        ? schema.required()
        : schema.strip().notRequired()
    ),
  grid: { md: 7 },
}

/** @type {Field} Custom Virtualization field */
const CUSTOM_VIRTUALIZATION = {
  name: 'customVmm',
  label: T.CustomVirtualization,
  type: INPUT_TYPES.TEXT,
  dependOf: CUSTOM_VM_MAD.name,
  htmlType: (vmm) => vmm !== CUSTOM_HOST_HYPERVISOR.NAME && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(CUSTOM_VM_MAD.name, (vmm, schema) =>
      vmm === CUSTOM_HOST_HYPERVISOR.NAME
        ? schema.required()
        : schema.strip().notRequired()
    ),
  grid: { md: 5 },
}

/** @type {Field} Custom Information field */
const CUSTOM_INFORMATION = {
  name: 'customIm',
  label: T.CustomInformation,
  type: INPUT_TYPES.TEXT,
  dependOf: CUSTOM_IM_MAD.name,
  htmlType: (im) => im !== CUSTOM_HOST_HYPERVISOR.NAME && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(CUSTOM_IM_MAD.name, (im, schema) =>
      im === CUSTOM_HOST_HYPERVISOR.NAME
        ? schema.required()
        : schema.notRequired()
    ),
  grid: { md: 5 },
}

/** @type {Field[]} List of drivers fields */
const DRIVERS_FIELDS = [
  CUSTOM_VM_MAD,
  CUSTOM_VIRTUALIZATION,
  CUSTOM_IM_MAD,
  CUSTOM_INFORMATION,
]

/** @type {BaseSchema} General step schema */
const SCHEMA = getObjectSchemaFromFields([
  HYPERVISOR_FIELD,
  INFORMATION_FIELD,
  ...DRIVERS_FIELDS,
])

export { SCHEMA, HYPERVISOR_FIELD, INFORMATION_FIELD, DRIVERS_FIELDS }
