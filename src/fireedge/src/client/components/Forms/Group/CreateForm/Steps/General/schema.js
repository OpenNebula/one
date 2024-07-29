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
import { INPUT_TYPES, T } from 'client/constants'
import { Field, getObjectSchemaFromFields } from 'client/utils'
import { string, boolean } from 'yup'
import {
  USERNAME_FIELD,
  AUTH_TYPE_FIELD,
  PASSWORD_FIELD,
  CONFIRM_PASSWORD_FIELD,
} from 'client/components/Forms/User/CreateForm/Steps/General/schema'

/** @type {Field} Name field */
const NAME = {
  name: 'name',
  label: T['groups.name'],
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Name field */
const ADMIN_USER = {
  name: 'adminUser',
  label: T['groups.adminUser.title'],
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const ADMIN_USERNAME_FIELD = {
  ...USERNAME_FIELD,
  name: `username`,
  dependOf: ADMIN_USER.name,
  type: INPUT_TYPES.TEXT,
  htmlType: (type) => !type && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(ADMIN_USER.name, {
      is: (adminUser) => adminUser,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.strip(),
    }),
}

const ADMIN_AUTH_TYPE_FIELD = {
  ...AUTH_TYPE_FIELD,
  name: `authType`,
  dependOf: ADMIN_USER.name,
  htmlType: (type) => !type && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(ADMIN_USER.name, {
      is: (adminUser) => adminUser,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.strip(),
    }),
}

const ADMIN_PASSWORD_FIELD = {
  ...PASSWORD_FIELD,
  name: `password`,
  dependOf: ADMIN_USER.name,
  htmlType: (type) => !type && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(ADMIN_USER.name, {
      is: (adminUser) => adminUser,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.strip(),
    }),
}

const ADMIN_CONFIRM_PASSWORD_FIELD = {
  ...CONFIRM_PASSWORD_FIELD,
  name: `confirmPassword`,
  dependOf: ADMIN_USER.name,
  htmlType: (type) => !type && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(ADMIN_USER.name, {
      is: (adminUser) => adminUser,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.strip(),
    })
    .test('passwords-match', T.PasswordsMustMatch, function (value) {
      return this.parent.password === value
    }),
}

const FIELDS = [
  NAME,
  ADMIN_USER,
  ADMIN_USERNAME_FIELD,
  ADMIN_AUTH_TYPE_FIELD,
  ADMIN_PASSWORD_FIELD,
  ADMIN_CONFIRM_PASSWORD_FIELD,
]

const SCHEMA = getObjectSchemaFromFields(FIELDS)

export { SCHEMA, FIELDS }
