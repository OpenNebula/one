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
import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, getValidationFromFields, ObjectSchema } from '@UtilsModule'
import { object, string } from 'yup'

/** @type {Field} Password field */
const PASSWORD_FIELD = {
  name: 'password',
  label: T.Password,
  type: INPUT_TYPES.PASSWORD,
  validation: string()
    .trim()
    .required()
    .default(() => ''),
  grid: { xs: 12, md: 6 },
}

/** @type {Field} Confirm Password field */
const CONFIRM_PASSWORD_FIELD = {
  name: 'confirmPassword',
  label: T.ConfirmPassword,
  type: INPUT_TYPES.PASSWORD,
  validation: string()
    .trim()
    .required()
    .test('passwords-match', T.PasswordsMustMatch, function (value) {
      return this.parent.password === value
    })
    .default(() => ''),
  grid: { xs: 12, md: 6 },
}

/**
 * @returns {Field[]} List of change password form inputs fields
 */
export const FIELDS = [PASSWORD_FIELD, CONFIRM_PASSWORD_FIELD]

/** @type {ObjectSchema} Change password form object schema */
export const SCHEMA = object(getValidationFromFields(FIELDS))
