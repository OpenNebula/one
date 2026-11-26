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
import {
  getObjectSchemaFromFields,
  schemaOdsUserInputField,
  sentenceCase,
} from '@UtilsModule'
import { INPUT_TYPES, T } from '@ConstantsModule'
import { number } from 'yup'

/**
 * @param {object} application - Selected application definition
 * @returns {Array} Application input fields
 */
export const FIELDS = (application = {}) =>
  (application?.user_inputs ?? []).map((userInput) => {
    const field = schemaOdsUserInputField(userInput)
    const regex = userInput.match?.values?.regex
    const units = regex
      ?.match(/\(((?:[KMGTPE]i\|)*[KMGTPE]i)\)\\z$/)?.[1]
      .split('|')

    if (
      userInput.type === 'string' &&
      !userInput.sensitive &&
      units?.includes('Mi')
    ) {
      const match = new RegExp(regex.replace(/\\A/g, '^').replace(/\\z/g, '$'))
      const defaultQuantity = userInput.default?.match(/^(\d+)([KMGTPE]i)$/)
      const defaultValue = defaultQuantity
        ? Number(defaultQuantity[1]) *
          1024 ** ('KMGTPE'.indexOf(defaultQuantity[2][0]) - 1)
        : undefined

      field.type = INPUT_TYPES.UNITS
      field.defaultValue = defaultValue
      field.validation = number()
        .positive()
        .integer()
        .test(
          'memory-quantity',
          T.PositiveNumber,
          (value) => value == null || match.test(`${value}Mi`)
        )
        .default(defaultValue)
      if (userInput.mandatory) field.validation = field.validation.required()
      field.fieldProps = {
        ...field.fieldProps,
        min: 1,
        step: 1,
        isRequired: !!userInput.mandatory,
        isOptional: !userInput.mandatory,
      }
    }

    return {
      ...field,
      label: sentenceCase(userInput.name),
      fieldProps: {
        ...field.fieldProps,
        placeholder: userInput.description,
      },
    }
  })

/**
 * Serializes memory inputs stored by the unit controller in MB.
 *
 * @param {object} application - Selected application definition
 * @param {object} values - Form input values
 * @returns {object} Application input values ready for submission
 */
export const toUserInputValues = (application, values = {}) => {
  const result = { ...values }
  FIELDS(application).forEach(({ name, type }) => {
    if (
      type === INPUT_TYPES.UNITS &&
      result[name] != null &&
      result[name] !== ''
    ) {
      result[name] = `${result[name]}Mi`
    }
  })

  return result
}

/**
 * @param {object} form - Form values
 * @returns {object} Application input schema
 */
export const SCHEMA = (form) =>
  getObjectSchemaFromFields(FIELDS(form?.application?.DEFINITION))
