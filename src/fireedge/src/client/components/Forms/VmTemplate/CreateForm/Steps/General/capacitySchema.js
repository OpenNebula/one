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
import { number, boolean } from 'yup'

import { T, INPUT_TYPES, HYPERVISORS } from 'client/constants'
import { Field } from 'client/utils'

/**
 * @param {Field} field - Field params
 * @param {boolean} field.required - If `true`, add to validation if it's required
 * @param {boolean} field.divBy4 - If `true`, add to validation if it's divisible by 4
 * @returns {Field} Capacity field params
 */
const CAPACITY_FIELD = ({ dependOf, required, divBy4, ...field }) => {
  let validation = number()
    .integer('Should be integer number')
    .positive('Should be positive number')
    .typeError('Must be a number')
    .default(() => undefined)

  if (required) {
    validation = validation.required()
  }

  if (dependOf) {
    validation = validation.when(
      dependOf,
      (enabledHr, schema) => enabledHr
        ? schema.required()
        : schema.strip().notRequired()
    )
  }

  if (divBy4) {
    validation = validation.when(
      'HYPERVISOR',
      (hypervisor, schema) => hypervisor === HYPERVISORS.vcenter
        ? schema.isDivisibleBy(4)
        : schema
    )
  }

  return {
    ...field,
    dependOf,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    ...(dependOf && {
      htmlType: dependValue =>
        dependValue ? 'number' : INPUT_TYPES.HIDDEN
    }),
    validation
  }
}

/** @type {Field} Memory field */
export const MEMORY = CAPACITY_FIELD({
  name: 'MEMORY',
  label: T.Memory,
  tooltip: T.MemoryConcept,
  divBy4: true,
  required: true,
  grid: { md: 12 }
})

/** @type {Field} Hot reloading on memory field */
export const ENABLE_HR_MEMORY = {
  name: 'ENABLE_HR_MEMORY',
  label: T.EnableHotResize,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { xs: 4, md: 6 }
}

/** @type {Field} Maximum memory field */
export const MEMORY_MAX = CAPACITY_FIELD({
  name: 'MEMORY_MAX',
  label: T.MaxMemory,
  dependOf: ENABLE_HR_MEMORY.name,
  grid: { xs: 8, md: 6 }
})

/** @type {Field} Physical CPU field */
export const PHYSICAL_CPU = CAPACITY_FIELD({
  name: 'CPU',
  label: T.PhysicalCpu,
  tooltip: T.CpuConcept,
  required: true,
  grid: { md: 12 }
})

/** @type {Field} Virtual CPU field */
export const VIRTUAL_CPU = CAPACITY_FIELD({
  name: 'VCPU',
  label: T.VirtualCpu,
  tooltip: T.VirtualCpuConcept,
  grid: { md: 12 }
})

/** @type {Field} Hot reloading on virtual CPU field */
export const ENABLE_HR_VCPU = {
  name: 'ENABLE_HR_VCPU',
  label: T.EnableHotResize,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { xs: 4, md: 6 }
}

/** @type {Field} Maximum virtual CPU field */
export const VCPU_MAX = CAPACITY_FIELD({
  name: 'VCPU_MAX',
  label: T.MaxVirtualCpu,
  dependOf: ENABLE_HR_VCPU.name,
  grid: { xs: 8, md: 6 }
})

/** @type {Field[]} List of capacity fields */
export const FIELDS = [
  MEMORY,
  ENABLE_HR_MEMORY,
  MEMORY_MAX,
  PHYSICAL_CPU,
  VIRTUAL_CPU,
  ENABLE_HR_VCPU,
  VCPU_MAX
]
