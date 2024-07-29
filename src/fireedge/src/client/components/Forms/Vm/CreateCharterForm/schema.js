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
import { array, object, ObjectSchema } from 'yup'

import {
  PUNCTUAL_FIELDS,
  RELATIVE_FIELDS,
} from 'client/components/Forms/Vm/CreateSchedActionForm/fields'
import {
  getEditableLeases,
  getFixedLeases,
  transformChartersToSchedActions,
} from 'client/models/Scheduler'
import { Field, getObjectSchemaFromFields } from 'client/utils'

const punctualFields = [
  PUNCTUAL_FIELDS.ACTION_FIELD_FOR_CHARTERS,
  PUNCTUAL_FIELDS.TIME_FIELD,
]
const relativeFields = [
  PUNCTUAL_FIELDS.ACTION_FIELD_FOR_CHARTERS,
  RELATIVE_FIELDS.RELATIVE_TIME_FIELD,
  RELATIVE_FIELDS.PERIOD_FIELD,
]

/**
 * @param {leases} leases - Leases from configuration yaml
 * @param {Field[]} fields - Fields to map with charter index
 * @returns {Field[]} Fields
 */
const mapFieldsWithIndex = (leases, fields) =>
  getEditableLeases(leases)
    ?.map((_, idx) =>
      fields.map(({ name, ...field }) => ({
        ...field,
        name: `CHARTERS.${idx}.${name}`,
      }))
    )
    .flat()

/**
 * @param {leases} leases - Leases from configuration yaml
 * @param {Field[]} fields - Fields
 * @param {boolean} [relative]
 * - If `true`, the result will be transformed to relative times
 * @returns {ObjectSchema} Charter schema
 */
const createCharterSchema = (leases, fields, relative = false) =>
  object({
    CHARTERS: array(getObjectSchemaFromFields(fields))
      .ensure()
      .afterSubmit((values) => {
        const fixedLeases = transformChartersToSchedActions(
          getFixedLeases(leases),
          relative
        )

        return [...values, ...fixedLeases]
      }),
  })

/**
 * @param {object} leases - Leases from conf yaml
 * @returns {Field[]} Punctual fields
 */
export const CHARTER_FIELDS = (leases) =>
  mapFieldsWithIndex(leases, punctualFields)

/**
 * @param {object} leases - Leases from conf yaml
 * @returns {Field[]} Relative fields
 */
export const RELATIVE_CHARTER_FIELDS = (leases) =>
  mapFieldsWithIndex(leases, relativeFields)

/**
 * @param {object} leases - Leases from conf yaml
 * @returns {ObjectSchema} Punctual Schema
 */
export const CHARTER_SCHEMA = (leases) =>
  createCharterSchema(leases, punctualFields)

/**
 * @param {object} leases - Leases from conf yaml
 * @returns {ObjectSchema} Relative Schema
 */
export const RELATIVE_CHARTER_SCHEMA = (leases) =>
  createCharterSchema(leases, relativeFields, true)
