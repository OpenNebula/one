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

const commonValidation = number()
  .positive()
  .default(() => undefined)

/** @type {Field} Memory field */
export const MEMORY = {
  name: 'MEMORY',
  label: T.Memory,
  tooltip: T.MemoryConcept,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: commonValidation
    .required()
    .when('HYPERVISOR', (hypervisor, schema) => hypervisor === HYPERVISORS.vcenter
      ? schema.isDivisibleBy(4)
      : schema
    ),
  grid: { md: 12 }
}

/** @type {Field} Hot reloading on memory field */
export const ENABLE_HR_MEMORY = {
  name: 'HOT_RESIZE.MEMORY_HOT_ADD_ENABLED',
  label: T.EnableHotResize,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().yesOrNo(),
  grid: { xs: 4, md: 6 }
}

/** @type {Field} Maximum memory field */
export const MEMORY_MAX = {
  name: 'MEMORY_MAX',
  label: T.MaxMemory,
  dependOf: ENABLE_HR_MEMORY.name,
  type: INPUT_TYPES.TEXT,
  htmlType: enabledHr => enabledHr ? 'number' : INPUT_TYPES.HIDDEN,
  validation: commonValidation
    .when(ENABLE_HR_MEMORY.name, (enabledHr, schema) =>
      enabledHr ? schema.required() : schema.strip().notRequired()
    ),
  grid: { xs: 8, md: 6 }
}

/** @type {Field} Physical CPU field */
export const PHYSICAL_CPU = {
  name: 'CPU',
  label: T.PhysicalCpu,
  tooltip: T.CpuConcept,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: commonValidation.required(),
  grid: { md: 12 }
}

/** @type {Field} Virtual CPU field */
export const VIRTUAL_CPU = {
  name: 'VCPU',
  label: T.VirtualCpu,
  tooltip: T.VirtualCpuConcept,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: commonValidation,
  grid: { md: 12 }
}

/** @type {Field} Hot reloading on virtual CPU field */
export const ENABLE_HR_VCPU = {
  name: 'HOT_RESIZE.CPU_HOT_ADD_ENABLED',
  label: T.EnableHotResize,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().yesOrNo(),
  grid: { xs: 4, md: 6 }
}

/** @type {Field} Maximum virtual CPU field */
export const VCPU_MAX = {
  name: 'VCPU_MAX',
  label: T.MaxVirtualCpu,
  dependOf: ENABLE_HR_VCPU.name,
  type: INPUT_TYPES.TEXT,
  htmlType: enabledHr => enabledHr ? 'number' : INPUT_TYPES.HIDDEN,
  validation: commonValidation
    .when(ENABLE_HR_VCPU.name, (enabledHr, schema) =>
      enabledHr ? schema.required() : schema.strip().notRequired()
    ),
  grid: { xs: 8, md: 6 }
}

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
