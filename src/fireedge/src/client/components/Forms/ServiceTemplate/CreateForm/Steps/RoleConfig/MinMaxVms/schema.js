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

import { object, number } from 'yup'
import { getValidationFromFields } from 'client/utils'
import { INPUT_TYPES } from 'client/constants'

const MAX_VALUE = 999999

/**
 * Creates fields for minmax vms schema based on a path prefix.
 *
 * @param {string} pathPrefix - Path prefix for field names.
 * @param { number } cardinality - Number of VMs defined in Role Def. step.
 * @returns {object[]} - Array of field definitions for minmax vms.
 */
export const createMinMaxVmsFields = (pathPrefix, cardinality) => {
  const getPath = (fieldName) =>
    pathPrefix ? `${pathPrefix}.${fieldName}` : fieldName

  return [
    {
      name: getPath('min_vms'),
      label: 'Min VMs',
      type: INPUT_TYPES.TEXT,
      cy: 'elasticity',
      validation: number()
        .integer('Min VMs must be an integer')
        .min(
          cardinality,
          `Min VMs cannot be less than defined cardinality: ${cardinality}`
        )
        .default(() => cardinality),
      fieldProps: {
        type: 'number',
      },
      grid: { sm: 4, md: 4 },
    },
    {
      name: getPath('max_vms'),
      label: 'Max VMs',
      type: INPUT_TYPES.TEXT,
      cy: 'elasticity',
      validation: number()
        .integer('Max VMs must be an integer')
        .min(cardinality, `Max VMs cannot be less than ${cardinality}`)
        .max(MAX_VALUE, `Max VMs cannot exceed ${MAX_VALUE}`)
        .default(() => cardinality),
      fieldProps: {
        type: 'number',
      },
      grid: { sm: 4, md: 4 },
    },
    {
      name: getPath('cooldown'),
      label: 'Cooldown',
      type: INPUT_TYPES.TEXT,
      cy: 'elasticity',
      validation: number()
        .integer('Cooldown must be an integer')
        .min(0, 'Cooldown cannot be less than 0')
        .max(MAX_VALUE, `Cooldown exceed ${MAX_VALUE}`)
        .default(() => 0),
      fieldProps: {
        type: 'number',
      },
      grid: { sm: 4, md: 4 },
    },
  ]
}

/**
 * Creates a Yup schema for minmax vms based on a given path prefix.
 *
 * @param {string} pathPrefix - Path prefix for field names in the schema.
 * @param { number } cardinality - Number of VMs defined in Role Def. step.
 * @returns {object} - Yup schema object for minmax vms.
 */
export const createMinMaxVmsSchema = (pathPrefix, cardinality = 0) => {
  const fields = createMinMaxVmsFields(pathPrefix, cardinality)

  return object(getValidationFromFields(fields))
}
