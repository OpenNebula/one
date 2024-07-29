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

import { BOOT_FIELDS } from './bootSchema'
import { CPU_MODEL_FIELDS } from './cpuModelSchema'
import { FEATURES_FIELDS } from './featuresSchema'
import { KERNEL_FIELDS } from './kernelSchema'
import { RAMDISK_FIELDS } from './ramdiskSchema'
import { RAW_FIELDS } from './rawSchema'

import { HYPERVISORS, T } from 'client/constants'
import {
  Field,
  Section,
  disableFields,
  filterFieldsByHypervisor,
  getObjectSchemaFromFields,
} from 'client/utils'

/**
 * @param {HYPERVISORS} [hypervisor] - Template hypervisor
 * @param {object} oneConfig - Config of oned.conf
 * @param {boolean} adminGroup - User is admin or not
 * @returns {Section[]} Sections
 */
const SECTIONS = (hypervisor, oneConfig, adminGroup) => [
  {
    id: 'os-cpu-model',
    legend: T.CpuModel,
    fields: disableFields(
      filterFieldsByHypervisor(CPU_MODEL_FIELDS, hypervisor),
      'OS',
      oneConfig,
      adminGroup
    ),
  },
  {
    id: 'os-features',
    legend: T.Features,
    fields: disableFields(
      filterFieldsByHypervisor(FEATURES_FIELDS, hypervisor),
      'OS',
      oneConfig,
      adminGroup
    ),
  },
  {
    id: 'os-kernel',
    legend: T.Kernel,
    fields: disableFields(
      filterFieldsByHypervisor(KERNEL_FIELDS, hypervisor),
      'OS',
      oneConfig,
      adminGroup
    ),
  },
  {
    id: 'os-ramdisk',
    legend: T.Ramdisk,
    fields: disableFields(
      filterFieldsByHypervisor(RAMDISK_FIELDS, hypervisor),
      'OS',
      oneConfig,
      adminGroup
    ),
  },
  {
    id: 'os-boot',
    legend: T.Boot,
    fields: disableFields(
      filterFieldsByHypervisor(BOOT_FIELDS, hypervisor),
      'OS',
      oneConfig,
      adminGroup
    ),
  },
  {
    id: 'os-raw',
    legend: T.RawData,
    legendTooltip: T.RawDataConcept,
    fields: disableFields(
      filterFieldsByHypervisor(RAW_FIELDS, hypervisor),
      'OS',
      oneConfig,
      adminGroup
    ),
  },
]

/** @type {Field} Boot order field */
const BOOT_ORDER_FIELD = {
  name: 'OS.BOOT',
  validation: string()
    .trim()
    .notRequired()
    .default(() => ''),
}

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @returns {Field[]} All 'OS & CPU' fields
 */
const FIELDS = (hypervisor) => [
  BOOT_ORDER_FIELD,
  ...SECTIONS(hypervisor)
    .map(({ fields }) => fields)
    .flat(),
]

/**
 * @param {HYPERVISORS} [hypervisor] - VM hypervisor
 * @returns {BaseSchema} Step schema
 */
const SCHEMA = (hypervisor) => getObjectSchemaFromFields(FIELDS(hypervisor))

export * from './bootSchema'
export * from './cpuModelSchema'
export * from './featuresSchema'
export * from './kernelSchema'
export * from './ramdiskSchema'
export * from './rawSchema'
export { BOOT_ORDER_FIELD, FIELDS, SCHEMA, SECTIONS }
