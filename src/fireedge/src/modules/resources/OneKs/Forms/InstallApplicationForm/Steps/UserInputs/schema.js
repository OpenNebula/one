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

/**
 * @param {object} application - Selected application definition
 * @returns {Array} Application input fields
 */
export const FIELDS = (application = {}) =>
  (application?.user_inputs ?? []).map((userInput) => {
    const field = schemaOdsUserInputField(userInput)

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
 * @param {object} form - Form values
 * @returns {object} Application input schema
 */
export const SCHEMA = (form) =>
  getObjectSchemaFromFields(FIELDS(form?.application?.DEFINITION))
