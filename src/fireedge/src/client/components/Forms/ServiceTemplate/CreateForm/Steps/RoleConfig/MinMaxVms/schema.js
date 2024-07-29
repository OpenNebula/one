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

import { object, number } from 'yup'
import { getValidationFromFields } from 'client/utils'
import { INPUT_TYPES, T } from 'client/constants'

const MAX_VALUE = 999999

/**
 * Creates fields for minmax vms schema based on a path prefix.
 *
 * @param {string} pathPrefix - Path prefix for field names.
 * @returns {object[]} - Array of field definitions for minmax vms.
 */
export const createMinMaxVmsFields = (pathPrefix) => {
  const getPath = (fieldName) =>
    pathPrefix ? `${pathPrefix}.${fieldName}` : fieldName

  return [
    {
      name: getPath('min_vms'),
      label: T.RolesMinVms,
      type: INPUT_TYPES.TEXT,
      cy: 'elasticity',
      validation: number()
        .integer('Min VMs must be an integer')
        .default(() => undefined),
      fieldProps: {
        type: 'number',
      },
      grid: { sm: 4, md: 4 },
    },
    {
      name: getPath('max_vms'),
      label: T.RolesMaxVms,
      type: INPUT_TYPES.TEXT,
      cy: 'elasticity',
      validation: number()
        .integer('Max VMs must be an integer')
        .max(MAX_VALUE, `Max VMs cannot exceed ${MAX_VALUE}`)
        .default(() => undefined),
      fieldProps: {
        type: 'number',
      },
      grid: { sm: 4, md: 4 },
    },
    {
      name: getPath('cooldown'),
      label: T.Cooldown,
      type: INPUT_TYPES.TEXT,
      cy: 'elasticity',
      validation: number()
        .integer('Cooldown must be an integer')
        .min(0, 'Cooldown cannot be less than 0')
        .max(MAX_VALUE, `Cooldown exceed ${MAX_VALUE}`)
        .default(() => undefined),
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
 * @returns {object} - Yup schema object for minmax vms.
 */
export const createMinMaxVmsSchema = (pathPrefix) => {
  const fields = createMinMaxVmsFields(pathPrefix)

  return object(getValidationFromFields(fields))
}
