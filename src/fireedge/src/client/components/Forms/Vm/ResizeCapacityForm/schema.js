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
/* eslint-disable jsdoc/require-jsdoc */
import * as yup from 'yup'
import { INPUT_TYPES } from 'client/constants'
import { getValidationFromFields } from 'client/utils'

const ENFORCE = {
  name: 'enforce',
  label: 'Enforce capacity checks',
  type: INPUT_TYPES.CHECKBOX,
  tooltip: `
    If it is set to true, the host capacity will be checked.
    This will only affect oneadmin requests, regular users
    resize requests will always be enforced`,
  validation: yup
    .boolean()
    .transform((value) => {
      if (typeof value === 'boolean') return value

      return String(value).toUpperCase() === 'YES'
    })
    .default(false),
  grid: { md: 12 },
}

const MEMORY = {
  name: 'MEMORY',
  label: 'Memory',
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  tooltip: 'Amount of RAM required for the VM',
  validation: yup
    .number()
    .typeError('Memory value must be a number')
    .required('Memory field is required')
    .positive()
    .default(undefined),
}

const PHYSICAL_CPU = {
  name: 'CPU',
  label: 'Physical CPU',
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  tooltip: `
    Percentage of CPU divided by 100 required for the
    Virtual Machine. Half a processor is written 0.5.`,
  validation: yup
    .number()
    .typeError('Physical CPU value must be a number')
    .required('Physical CPU field is required')
    .positive()
    .default(undefined),
}

const VIRTUAL_CPU = {
  name: 'VCPU',
  label: 'Virtual CPU',
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  tooltip: `
    Number of virtual cpus. This value is optional, the default
    hypervisor behavior is used, usually one virtual CPU.`,
  validation: yup
    .number()
    .typeError('Virtual CPU value must be a number')
    .default(undefined),
}

export const FIELDS = [ENFORCE, MEMORY, PHYSICAL_CPU, VIRTUAL_CPU]

export const SCHEMA = yup.object(getValidationFromFields(FIELDS))
