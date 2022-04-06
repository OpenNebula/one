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
import { NumberSchema } from 'yup'
import { getUserInputParams } from 'client/models/Helper'
import {
  Field,
  schemaUserInput,
  prettyBytes,
  isDivisibleBy,
} from 'client/utils'
import { T, HYPERVISORS, VmTemplate } from 'client/constants'

const TRANSLATES = {
  MEMORY: { name: 'MEMORY', label: T.Memory, tooltip: T.MemoryConcept },
  CPU: { name: 'CPU', label: T.PhysicalCpu, tooltip: T.CpuConcept },
  VCPU: { name: 'VCPU', label: T.VirtualCpu, tooltip: T.VirtualCpuConcept },
}

const valueLabelFormat = (value) => prettyBytes(value, 'MB')

/**
 * @param {VmTemplate} [vmTemplate] - VM Template
 * @returns {Field[]} Basic configuration fields
 */
export const FIELDS = (vmTemplate) => {
  const {
    HYPERVISOR,
    USER_INPUTS = {},
    MEMORY = '',
    CPU = '',
    VCPU = '',
  } = vmTemplate?.TEMPLATE || {}

  const {
    MEMORY: memoryInput = `M|number|||${MEMORY}`,
    CPU: cpuInput = `M|number-float|||${CPU}`,
    VCPU: vcpuInput = `O|number|||${VCPU}`,
  } = USER_INPUTS

  return [
    { name: 'MEMORY', ...getUserInputParams(memoryInput) },
    { name: 'CPU', ...getUserInputParams(cpuInput) },
    { name: 'VCPU', ...getUserInputParams(vcpuInput) },
  ].map(({ name, options, ...userInput }) => {
    const isMemory = name === 'MEMORY'
    const isVCenter = HYPERVISOR === HYPERVISORS.vcenter
    const divisibleBy4 = isVCenter && isMemory

    const ensuredOptions = divisibleBy4
      ? options?.filter((value) => isDivisibleBy(+value, 4))
      : options

    const schemaUi = schemaUserInput({ options: ensuredOptions, ...userInput })
    const isNumber = schemaUi.validation instanceof NumberSchema

    if (isNumber) {
      // add positive number validator
      isNumber && (schemaUi.validation &&= schemaUi.validation.positive())

      // add label format on pretty bytes
      isMemory &&
        (schemaUi.fieldProps = { ...schemaUi.fieldProps, valueLabelFormat })

      if (divisibleBy4) {
        schemaUi.validation &&= schemaUi.validation.isDivisibleBy(4)
        schemaUi.fieldProps = { ...schemaUi.fieldProps, step: 4 }
      }
    }

    return { ...TRANSLATES[name], ...schemaUi, grid: { md: 12 } }
  })
}
