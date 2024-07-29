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
import { object, ObjectSchema } from 'yup'
import { Field, getValidationFromFields, schemaUserInput } from 'client/utils'
import { UserInputOneProvisionObject } from 'client/constants'

/**
 * @param {UserInputOneProvisionObject[]} inputs - Inputs
 * @returns {Field[]} Inputs in Field format
 */
export const FORM_FIELDS = (inputs) =>
  inputs?.map(
    ({
      mandatory = true,
      name,
      description,
      type,
      default: defaultValue,
      min_value: min,
      max_value: max,
      options,
    }) => ({
      name,
      label: `${description ?? name} ${mandatory ? '*' : ''}`,
      ...schemaUserInput({
        mandatory,
        name,
        type,
        min,
        max,
        options,
        default: defaultValue,
      }),
    })
  )

/**
 * @param {UserInputOneProvisionObject[]} inputs - Inputs
 * @returns {ObjectSchema} Inputs step schema
 */
export const STEP_FORM_SCHEMA = (inputs) =>
  object(getValidationFromFields(FORM_FIELDS(inputs)))
