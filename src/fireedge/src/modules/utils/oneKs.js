/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { schemaOdsUserInputField } from '@modules/utils/ods'
import { isPlainObject, mapValues, isArray } from 'lodash'

/**
 * Create a list of fields to use in the schema and in forms from the list of ODS User Inputs.
 *
 * @param {Array} families - List of drivers.
 * @returns {Array} - List of fields.
 */
const createFieldsFromOneKsOdsUserInputs = (families = []) => {
  const groupedFamilyValues = families.map((family) => ({
    ...family,
    fields: {},
  }))

  groupedFamilyValues.forEach(
    ({ flavours, user_inputs: userInputs, fields }) => {
      flavours.forEach(
        ({ name, defaults, override_defaults: overrideDefaults }) => {
          if (!fields[name]) fields[name] = []

          userInputs.forEach((userInput) => {
            const defaultValue = defaults?.[userInput.name]

            const odsParams = {
              ...userInput,
            }

            if (defaultValue) {
              odsParams.default = defaultValue
              if (!overrideDefaults) {
                odsParams.disable = true
              }
            }

            fields[name].push(schemaOdsUserInputField(odsParams))
          })
        }
      )
    }
  )

  return groupedFamilyValues
}

/**
 * Recursively casts numeric strings in an object to numbers.
 *
 * @param {any} data - The data to cast numeric strings to numbers.
 * @returns {any} - The data with numeric strings cast to numbers.
 */
const castNumericStrings = (data) => {
  if (isArray(data)) {
    return data.map((item) => castNumericStrings(item))
  }

  if (isPlainObject(data)) {
    return mapValues(data, (value) => castNumericStrings(value))
  }

  if (typeof data === 'string' && data.trim() !== '') {
    const parsed = Number(data)

    return isNaN(parsed) ? data : parsed
  }

  return data
}

export { createFieldsFromOneKsOdsUserInputs, castNumericStrings }
