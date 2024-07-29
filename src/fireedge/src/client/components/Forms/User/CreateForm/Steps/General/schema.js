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
import { INPUT_TYPES, T, AUTH_DRIVER } from 'client/constants'
import { Field, getObjectSchemaFromFields, arrayToOptions } from 'client/utils'
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

/** @type {Field} Authentication Type field */
const AUTH_TYPE_FIELD = {
  name: 'authType',
  label: T.AuthType,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () =>
    arrayToOptions(Object.keys(AUTH_DRIVER), {
      addEmpty: false,
      getText: (key) => AUTH_DRIVER[key],
      getValue: (key) => AUTH_DRIVER[key],
    }),
  validation: string()
    .trim()
    .required()
    .default(() => 'core'),
  grid: { md: 12 },
}

/** @type {Field} Password field */
const PASSWORD_FIELD = {
  name: 'password',
  label: T.Password,
  type: INPUT_TYPES.PASSWORD,
  dependOf: AUTH_TYPE_FIELD.name,
  htmlType: (authType) =>
    authType && authType === AUTH_DRIVER.LDAP && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when(AUTH_TYPE_FIELD.name, (authType, schema) =>
      authType === AUTH_DRIVER.LDAP ? schema.strip() : schema.required()
    )
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Confirm Password field */
const CONFIRM_PASSWORD_FIELD = {
  name: 'confirmPassword',
  label: T.ConfirmPassword,
  type: INPUT_TYPES.PASSWORD,
  dependOf: AUTH_TYPE_FIELD.name,
  htmlType: (authType) =>
    authType && authType === AUTH_DRIVER.LDAP && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when(AUTH_TYPE_FIELD.name, (authType, schema) =>
      authType === AUTH_DRIVER.LDAP ? schema.strip() : schema.required()
    )
    .test('passwords-match', T.PasswordsMustMatch, function (value) {
      return this.parent.password === value
    })
    .default(() => undefined),
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
