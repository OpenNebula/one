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
import { number } from 'yup'

import { Field } from 'client/utils'
import { T, INPUT_TYPES, HYPERVISORS } from 'client/constants'

const commonValidation = number()
  .positive()
  .default(() => undefined)

/** @type {Field} Memory field */
const MEMORY = (hypervisor) => {
  let validation = commonValidation.required()

  if (hypervisor === HYPERVISORS.vcenter) {
    validation = validation.isDivisibleBy(4)
  }

  return {
    name: 'MEMORY',
    label: T.Memory,
    tooltip: T.MemoryConcept,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    validation,
    grid: { md: 12 },
  }
}

/** @type {Field} Physical CPU field */
const PHYSICAL_CPU = {
  name: 'CPU',
  label: T.PhysicalCpu,
  tooltip: T.PhysicalCpuConcept,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: commonValidation.required(),
  grid: { md: 12 },
}

/** @type {Field} Virtual CPU field */
const VIRTUAL_CPU = {
  name: 'VCPU',
  label: T.VirtualCpu,
  tooltip: T.VirtualCpuConcept,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: commonValidation.notRequired(),
  grid: { md: 12 },
}

export const FIELDS = [MEMORY, PHYSICAL_CPU, VIRTUAL_CPU]
