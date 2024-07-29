/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { object, string, number } from 'yup'
import { getValidationFromFields, arrayToOptions } from 'client/utils'
import { INPUT_TYPES, T } from 'client/constants'

// Define the CA types
export const ELASTICITY_TYPES = {
  CHANGE: 'Change',
  CARDINALITY: 'Cardinality',
  PERCENTAGE_CHANGE: 'Percentage',
}

/**
 * Creates fields for elasticity policies schema based on a path prefix.
 *
 * @param {string} pathPrefix - Path prefix for field names.
 * @returns {object[]} - Array of field definitions for elasticity policies.
 */
export const createElasticityPolicyFields = (pathPrefix) => {
  const getPath = (fieldName) =>
    pathPrefix ? `${pathPrefix}.${fieldName}` : fieldName

  return [
    {
      name: getPath('TYPE'),
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
        .default(() => Object.keys(ELASTICITY_TYPES)[0]),
      grid: { xs: 12, sm: 6, md: 6 },
    },
    {
      name: getPath('ADJUST'),
      label: T.Adjust,
      type: INPUT_TYPES.TEXT,
      cy: 'roleconfig-elasticitypolicies',
      fieldProps: {
        type: 'number',
      },
      validation: number().required(),
      grid: { xs: 12, sm: 6, md: 6 },
    },
    {
      name: getPath('MIN'),
      label: T.Min,
      dependOf: getPath('TYPE'),
      htmlType: (type) =>
        // ONLY DISPLAY ON PERCENTAGE_CHANGE
        type !== Object.keys(ELASTICITY_TYPES)[2] && INPUT_TYPES.HIDDEN,
      type: INPUT_TYPES.TEXT,
      cy: 'roleconfig-elasticitypolicies',
      fieldProps: {
        type: 'number',
      },
      validation: number().when(getPath('TYPE'), {
        is: (type) => type === Object.keys(ELASTICITY_TYPES)[2],
        then: number().required(),
        otherwise: number().notRequired().nullable(),
      }),
      grid: { xs: 12, sm: 6, md: 6 },
    },
    {
      name: getPath('EXPRESSION'),
      dependOf: getPath('TYPE'),
      label: T.Expression,
      type: INPUT_TYPES.TEXT,
      cy: 'roleconfig-elasticitypolicies',
      validation: string().trim().required(),
      grid: (type) => ({
        xs: 12,
        ...(type !== Object.keys(ELASTICITY_TYPES)[2]
          ? { sm: 12, md: 12 }
          : { sm: 6, md: 6 }),
      }),
    },
    {
      name: getPath('PERIOD_NUMBER'),
      label: '#',
      type: INPUT_TYPES.TEXT,
      cy: 'roleconfig-elasticitypolicies',
      fieldProps: {
        type: 'number',
      },
      validation: number(),
      grid: { xs: 12, sm: 6, md: 4 },
    },
    {
      name: getPath('PERIOD'),
      label: 'Period',
      type: INPUT_TYPES.TEXT,
      cy: 'roleconfig-elasticitypolicies',
      fieldProps: {
        type: 'number',
      },
      validation: number(),
      grid: { xs: 12, sm: 6, md: 4 },
    },
    {
      name: getPath('COOLDOWN'),
      label: 'Cooldown',
      type: INPUT_TYPES.TEXT,
      cy: 'roleconfig-elasticitypolicies',
      fieldProps: {
        type: 'number',
      },
      validation: number(),
      grid: { xs: 12, sm: 12, md: 4 },
    },
  ]
}

/**
 * Creates a Yup schema for elasticity policies based on a given path prefix.
 *
 * @param {string} pathPrefix - Path prefix for field names in the schema.
 * @returns {object} - Yup schema object for elasticity policies.
 */
export const createElasticityPoliciesSchema = (pathPrefix) => {
  const fields = createElasticityPolicyFields(pathPrefix)

  return object(getValidationFromFields(fields))
}
