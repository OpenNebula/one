/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { string, number } from 'yup'
import { getObjectSchemaFromFields, arrayToOptions } from '@UtilsModule'
import { INPUT_TYPES, T } from '@ConstantsModule'

export const SECTION_ID = 'elasticity_policies'

// Define the CA types
export const ELASTICITY_TYPES = {
  CHANGE: 'Change',
  CARDINALITY: 'Cardinality',
  PERCENTAGE_CHANGE: 'Percentage',
}

const type = {
  name: 'type',
  label: T.Type,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  cy: 'roleconfig-elasticitypolicies',
  values: arrayToOptions(Object.keys(ELASTICITY_TYPES), {
    addEmpty: false,
    getText: (key) => ELASTICITY_TYPES?.[key],
    getValue: (key) => key,
  }),
  validation: string()
    .trim()
    .required()
    .oneOf(Object.keys(ELASTICITY_TYPES))
    .default(() => undefined),
  grid: { md: 3 },
}

const adjust = {
  name: 'adjust',
  label: T.Adjust,
  type: INPUT_TYPES.TEXT,
  cy: 'roleconfig-elasticitypolicies',
  dependOf: 'type',
  fieldProps: {
    type: 'number',
  },
  validation: number().required(),

  grid: (policyType) => ({
    md: policyType !== Object.keys(ELASTICITY_TYPES)[2] ? 2.75 : 2,
  }),
}

const min = {
  name: 'min',
  label: T.Min,
  dependOf: 'type',
  htmlType: (policyType) =>
    policyType !== Object.keys(ELASTICITY_TYPES)[2] && INPUT_TYPES.HIDDEN,
  type: INPUT_TYPES.TEXT,
  cy: 'roleconfig-elasticitypolicies',
  fieldProps: {
    type: 'number',
  },
  validation: number()
    .nullable()
    .notRequired()
    .default(() => undefined),
  grid: { md: 1.5 },
}

const expression = {
  name: 'expression',
  dependOf: 'type',
  label: T.Expression,
  type: INPUT_TYPES.TEXT,
  cy: 'roleconfig-elasticitypolicies',
  validation: string().trim().required(),
  grid: { md: 12 },
}

const periodNumber = {
  name: 'period_number',
  label: '#',
  type: INPUT_TYPES.TEXT,
  cy: 'roleconfig-elasticitypolicies',
  fieldProps: {
    type: 'number',
  },
  validation: number(),
  grid: { md: 1.5 },
}

const period = {
  name: 'period',
  label: 'Period',
  type: INPUT_TYPES.TEXT,
  cy: 'roleconfig-elasticitypolicies',
  fieldProps: {
    type: 'number',
  },
  validation: number(),
  grid: { md: 2 },
}

const cooldown = {
  name: 'cooldown',
  label: 'Cooldown',
  type: INPUT_TYPES.TEXT,
  cy: 'roleconfig-elasticitypolicies',
  dependOf: 'type',
  fieldProps: {
    type: 'number',
  },
  validation: number(),
  grid: (policyType) => ({
    md: policyType !== Object.keys(ELASTICITY_TYPES)[2] ? 2.75 : 2,
  }),
}

export const ELASTICITY_POLICY_FIELDS = [
  type,
  adjust,
  min,
  periodNumber,
  period,
  cooldown,
  expression,
]

export const ELASTICITY_POLICY_SCHEMA = getObjectSchemaFromFields(
  ELASTICITY_POLICY_FIELDS
)
