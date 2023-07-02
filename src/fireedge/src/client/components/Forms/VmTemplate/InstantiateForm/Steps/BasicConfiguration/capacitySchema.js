/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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

import {
  HYPERVISORS,
  T,
  USER_INPUT_TYPES,
  VmTemplate,
  VmTemplateFeatures,
} from 'client/constants'
import { getUserInputParams } from 'client/models/Helper'
import { scaleVcpuByCpuFactor } from 'client/models/VirtualMachine'
import {
  Field,
  isDivisibleBy,
  prettyBytes,
  schemaUserInput,
} from 'client/utils'

const { number, numberFloat, range, rangeFloat } = USER_INPUT_TYPES

const TRANSLATES = {
  MEMORY: {
    name: 'MEMORY',
    label: [T.MemoryWithUnit, '(MB)'],
    tooltip: T.MemoryConcept,
  },
  CPU: { name: 'CPU', label: T.PhysicalCpuWithPercent, tooltip: T.CpuConcept },
  VCPU: {
    name: 'VCPU',
    label: T.VirtualCpuWithDecimal,
    tooltip: T.VirtualCpuConcept,
  },
}

const valueLabelFormat = (value) => prettyBytes(value, 'MB')

/**
 * @param {VmTemplate} [vmTemplate] - VM Template
 * @param {VmTemplateFeatures} [features] - Features
 * @returns {Field[]} Basic configuration fields
 */
export const FIELDS = (
  vmTemplate,
  { hide_cpu: hideCpu, cpu_factor: cpuFactor } = {}
) => {
  const {
    HYPERVISOR,
    USER_INPUTS = {},
    MEMORY = '',
    CPU = '',
    VCPU = '',
  } = vmTemplate?.TEMPLATE || {}

  const {
    MEMORY: memoryInput = `M|${number}|| |${MEMORY}`,
    CPU: cpuInput = `M|${numberFloat}|| |${CPU}`,
    VCPU: vcpuInput = `O|${number}|| |${VCPU}`,
  } = USER_INPUTS

  const fields = [
    { name: 'MEMORY', ...getUserInputParams(memoryInput) },
    !hideCpu && { name: 'CPU', ...getUserInputParams(cpuInput) },
    { name: 'VCPU', ...getUserInputParams(vcpuInput) },
  ].filter(Boolean)

  return fields.map(({ name, options, ...userInput }) => {
    const isMemory = name === 'MEMORY'
    const isCPU = name === 'CPU'
    const isVCenter = HYPERVISOR === HYPERVISORS.vcenter
    const divisibleBy4 = isVCenter && isMemory
    const isRange = [range, rangeFloat].includes(userInput.type)

    // set default type to number
    userInput.type ??= isCPU ? numberFloat : number

    const ensuredOptions = divisibleBy4
      ? options?.filter((value) => isDivisibleBy(+value, 4))
      : options

    const schemaUi = schemaUserInput({ options: ensuredOptions, ...userInput })
    const isNumber = schemaUi.validation instanceof NumberSchema

    // add positive number validator
    isNumber && (schemaUi.validation &&= schemaUi.validation.positive())

    if (isMemory && isRange) {
      // add label format on pretty bytes
      schemaUi.fieldProps = { ...schemaUi.fieldProps, valueLabelFormat }
    }

    if (isNumber && divisibleBy4) {
      schemaUi.validation &&= schemaUi.validation.isDivisibleBy(4)
      schemaUi.fieldProps = { ...schemaUi.fieldProps, step: 4 }
    }

    if (cpuFactor && isCPU) {
      schemaUi.readOnly = true
      schemaUi.dependOf = 'VCPU'
      schemaUi.watcher = (vcpu) => scaleVcpuByCpuFactor(vcpu, cpuFactor)
    }

    return { ...TRANSLATES[name], ...schemaUi, grid: { md: 12 } }
  })
}
