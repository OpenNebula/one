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
/* eslint-disable jsdoc/require-jsdoc */
import { number } from 'yup'

import { T, INPUT_TYPES, HYPERVISORS } from 'client/constants'
import { isDivisibleBy4 } from 'client/utils'

const MEMORY = hypervisor => {
  let validation = number()
    .integer('Memory should be integer number')
    .positive('Memory should be positive number')
    .typeError('Memory must be a number')
    .required('Memory field is required')
    .default(() => undefined)

  if (hypervisor === HYPERVISORS.vcenter) {
    validation = validation
      .test('is-divisible-by-4', 'Memory should be divisible by 4', isDivisibleBy4)
  }

  return {
    name: 'MEMORY',
    label: T.Memory,
    tooltip: 'Amount of RAM required for the VM.',
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    validation,
    grid: { md: 12 }
  }
}

const PHYSICAL_CPU = {
  name: 'CPU',
  label: T.PhysicalCpu,
  tooltip: `
    Percentage of CPU divided by 100 required for
    the Virtual Machine. Half a processor is written 0.5.`,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .positive('CPU should be positive number')
    .typeError('CPU must be a number')
    .required('CPU field is required')
    .default(() => undefined),
  grid: { md: 12 }
}

const VIRTUAL_CPU = {
  name: 'VCPU',
  label: T.VirtualCpu,
  tooltip: `
    Number of virtual cpus. This value is optional, the default
    hypervisor behavior is used, usually one virtual CPU`,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .positive('Virtual CPU should be positive number')
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 }
}

export const FIELDS = [
  MEMORY,
  PHYSICAL_CPU,
  VIRTUAL_CPU
]
