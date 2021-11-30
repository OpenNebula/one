/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { KERNEL_FIELDS } from './kernelSchema'
import { RAMDISK_FIELDS } from './ramdiskSchema'
import { FEATURES_FIELDS } from './featuresSchema'
import { RAW_FIELDS } from './rawSchema'

import {
  Field,
  Section,
  getObjectSchemaFromFields,
  filterFieldsByHypervisor,
} from 'client/utils'
import { T, HYPERVISORS } from 'client/constants'

/**
 * @param {HYPERVISORS} [hypervisor] - Template hypervisor
 * @returns {Section[]} Sections
 */
const SECTIONS = (hypervisor) => [
  {
    id: 'os-boot',
    legend: T.Boot,
    fields: filterFieldsByHypervisor(BOOT_FIELDS, hypervisor),
  },
  {
    id: 'os-features',
    legend: T.Features,
    fields: filterFieldsByHypervisor(FEATURES_FIELDS, hypervisor),
  },
  {
    id: 'os-kernel',
    legend: T.Kernel,
    fields: filterFieldsByHypervisor(KERNEL_FIELDS, hypervisor),
  },
  {
    id: 'os-ramdisk',
    legend: T.Ramdisk,
    fields: filterFieldsByHypervisor(RAMDISK_FIELDS, hypervisor),
  },
  {
    id: 'os-raw',
    legend: T.RawData,
    legendTooltip: T.RawDataConcept,
    fields: filterFieldsByHypervisor(RAW_FIELDS, hypervisor),
  },
]

/** @type {Field} Boot order field */
const BOOT_ORDER = {
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
  BOOT_ORDER,
  ...SECTIONS(hypervisor)
    .map(({ fields }) => fields)
    .flat(),
]

/**
 * @param {HYPERVISORS} [hypervisor] - VM hypervisor
 * @returns {BaseSchema} Step schema
 */
const SCHEMA = (hypervisor) => getObjectSchemaFromFields(FIELDS(hypervisor))

export { SECTIONS, FIELDS, SCHEMA }
