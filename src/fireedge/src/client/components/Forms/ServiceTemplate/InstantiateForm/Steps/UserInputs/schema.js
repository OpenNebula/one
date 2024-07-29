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
import { string, boolean, number } from 'yup'
import { INPUT_TYPES } from 'client/constants'

const getTypeProp = (type) => {
  switch (type) {
    case 'boolean':
      return INPUT_TYPES.SWITCH
    case 'text':
    case 'text64':
    case 'number':
    case 'numberfloat':
      return INPUT_TYPES.TEXT
    default:
      return INPUT_TYPES.TEXT
  }
}

const getFieldProps = (type) => {
  switch (type) {
    case 'text':
    case 'text64':
      return { type: 'text' }
    case 'number':
    case 'numberfloat':
    case 'range':
    case 'rangefloat':
      return { type: 'number' }
    default:
      return {}
  }
}

const getValidation = (type, mandatory, defaultValue = undefined) => {
  const isMandatory = mandatory === 'M'

  switch (type) {
    case 'text':
    case 'text64':
      return isMandatory
        ? string()
            .trim()
            .required()
            .default(() => defaultValue)
        : string()
            .trim()
            .notRequired()
            .default(() => defaultValue)
    case 'number':
    case 'numberfloat':
      return isMandatory
        ? number()
            .required()
            .default(() => defaultValue)
        : number()
            .notRequired()
            .default(() => defaultValue)
    case 'boolean':
      return isMandatory
        ? boolean().yesOrNo().required()
        : boolean().yesOrNo().notRequired()
    default:
      return isMandatory
        ? string()
            .trim()
            .required()
            .default(() => defaultValue)
        : string()
            .trim()
            .notRequired()
            .default(() => defaultValue)
  }
}

const generateField = (input) => {
  const { key, description, type, defaultValue, mandatory } = input

  return {
    name: key.toLowerCase(),
    label: description ?? key,
    type: getTypeProp(type),
    fieldProps: getFieldProps(type),
    validation: getValidation(type, mandatory, defaultValue),
    defaultValue: defaultValue,
    grid: { md: 12 },
  }
}

/**
 * @param {Array} inputs - Array of user inputs
 * @returns {Array} - User input fields
 */
export const generateFormFields = (inputs) =>
  inputs.map((input) => generateField(input))
