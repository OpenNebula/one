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
import { boolean, number, object } from 'yup'
import { getValidationFromFields } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'

const ENFORCE = {
  name: 'enforce',
  label: T.EnforceCapacityChecks,
  type: INPUT_TYPES.CHECKBOX,
  tooltip: T.EnforceCapacityChecksConcept,
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

const MEMORY = {
  name: 'MEMORY',
  label: T.Memory,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  tooltip: T.MemoryConcept,
  validation: number()
    .required()
    .positive()
    .default(() => undefined),
}

const PHYSICAL_CPU = {
  name: 'CPU',
  label: T.PhysicalCpu,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  tooltip: T.CpuConcept,
  validation: number()
    .required()
    .positive()
    .default(() => undefined),
}

const VIRTUAL_CPU = {
  name: 'VCPU',
  label: T.VirtualCpu,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  tooltip: T.VirtualCpuConcept,
  validation: number().default(() => undefined),
}

export const FIELDS = [ENFORCE, MEMORY, PHYSICAL_CPU, VIRTUAL_CPU]

export const SCHEMA = object(getValidationFromFields(FIELDS))
