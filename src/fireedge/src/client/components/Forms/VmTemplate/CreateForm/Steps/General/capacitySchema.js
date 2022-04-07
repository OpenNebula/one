/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { number } from 'yup'

import {
  generateModificationInputs,
  generateHotResizeInputs,
  generateCapacityInput,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/General/capacityUtils'
import { Field } from 'client/utils'
import { T, HYPERVISORS } from 'client/constants'

const commonValidation = number()
  .positive()
  .default(() => undefined)

// --------------------------------------------------------
// MEMORY fields
// --------------------------------------------------------

/** @type {Field} Memory field */
export const MEMORY = generateCapacityInput({
  name: 'MEMORY',
  label: T.Memory,
  tooltip: T.MemoryConcept,
  validation: commonValidation
    .required()
    .when('HYPERVISOR', (hypervisor, schema) =>
      hypervisor === HYPERVISORS.vcenter ? schema.isDivisibleBy(4) : schema
    ),
})

/** @type {Field[]} Hot resize on memory field */
export const HR_MEMORY_FIELDS = generateHotResizeInputs(
  { fieldName: MEMORY.name },
  {
    name: `${MEMORY.name}_MAX`,
    label: T.MaxMemory,
    tooltip: T.MaxMemoryConcept,
  }
)

/** @type {Field[]} Modification inputs on memory field */
export const MOD_MEMORY_FIELDS = generateModificationInputs(MEMORY.name)

/** @type {Field[]} List of memory fields */
export const MEMORY_FIELDS = [MEMORY, ...HR_MEMORY_FIELDS, ...MOD_MEMORY_FIELDS]

// --------------------------------------------------------
// CPU fields
// --------------------------------------------------------

/** @type {Field} Physical CPU field */
export const PHYSICAL_CPU = generateCapacityInput({
  name: 'CPU',
  label: T.PhysicalCpu,
  tooltip: T.CpuConcept,
  validation: commonValidation.required(),
})

/** @type {Field[]} Modification inputs on CPU field */
export const MOD_CPU_FIELDS = generateModificationInputs(PHYSICAL_CPU.name)

/** @type {Field[]} List of CPU fields */
export const CPU_FIELDS = [PHYSICAL_CPU, ...MOD_CPU_FIELDS]

// --------------------------------------------------------
// Virtual CPU fields
// --------------------------------------------------------

/** @type {Field} Virtual CPU field */
export const VIRTUAL_CPU = generateCapacityInput({
  name: 'VCPU',
  label: T.VirtualCpu,
  tooltip: T.VirtualCpuConcept,
  validation: commonValidation,
  grid: { md: 3 },
})

/** @type {Field[]} Hot resize on memory field */
export const HR_CPU_FIELDS = generateHotResizeInputs(
  { name: PHYSICAL_CPU.name },
  {
    name: `${VIRTUAL_CPU.name}_MAX`,
    label: T.MaxVirtualCpu,
    tooltip: T.MaxVirtualCpuConcept,
  }
)

/** @type {Field[]} Modification inputs on Virtual CPU field */
export const MOD_VCPU_FIELDS = generateModificationInputs(VIRTUAL_CPU.name)

/** @type {Field[]} List of Virtual CPU fields */
export const VCPU_FIELDS = [VIRTUAL_CPU, ...HR_CPU_FIELDS, ...MOD_VCPU_FIELDS]
