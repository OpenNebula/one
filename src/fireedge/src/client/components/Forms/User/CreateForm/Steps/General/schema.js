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
import { INPUT_TYPES, T } from 'client/constants'
import { Field, getObjectSchemaFromFields } from 'client/utils'
import { string } from 'yup'

/** @type {Field} Username field */
const USERNAME_FIELD = {
  name: 'username',
  label: T.Username,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Password field */
const PASSWORD_FIELD = {
  name: 'password',
  label: T.Password,
  type: INPUT_TYPES.PASSWORD,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
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
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Authentication Type field */
const AUTH_TYPE_FIELD = {
  name: 'authType',
  label: T.AuthType,
  type: INPUT_TYPES.SELECT,
  values: [
    { text: 'core', value: 'core' },
    { text: 'public', value: 'public' },
    { text: 'ssh', value: 'ssh' },
    { text: 'x509', value: 'x509' },
    { text: 'ldap', value: 'ldap' },
    { text: 'server_cipher', value: 'server_cipher' },
    { text: 'server_x509', value: 'server_x509' },
    { text: 'custom', value: 'custom' },
  ],
  validation: string()
    .trim()
    .required()
    .default(() => 'core'),
  grid: { md: 12 },
}

const SCHEMA = getObjectSchemaFromFields([
  USERNAME_FIELD,
  AUTH_TYPE_FIELD,
  PASSWORD_FIELD,
  CONFIRM_PASSWORD_FIELD,
])

export {
  SCHEMA,
  USERNAME_FIELD,
  AUTH_TYPE_FIELD,
  PASSWORD_FIELD,
  CONFIRM_PASSWORD_FIELD,
}
