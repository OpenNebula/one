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
import { object, string, array, mixed } from 'yup'
import { Field } from 'client/utils'

/** @type {Field} Name field for role */
const ROLE_NAME_FIELD = {
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required('Role name cannot be empty')
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} VM-VM Affinity field for role */
const POLICY_FIELD = {
  name: 'POLICY',
  label: 'VM-VM Affinity',
  type: INPUT_TYPES.SELECT,
  validation: string()
    .required('No valid policy selected')
    .default(() => 'None'),
  grid: { md: 12 },
  values: [
    { text: 'None', value: 'None' },
    { text: 'Affined', value: 'AFFINED' },
    { text: 'Anti-Affined', value: 'ANTI_AFFINED' },
  ],
}

const AFFINED_FIELD = {
  name: 'HOST_AFFINED',
  validation: array()
    .of(mixed().notRequired())
    .default(() => []),
}

const ANTI_AFFINED_FIELD = {
  name: 'HOST_ANTI_AFFINED',
  validation: array()
    .of(mixed().notRequired())
    .default(() => []),
}

/** @type {object} Role schema */
const ROLE_SCHEMA = object().shape({
  NAME: ROLE_NAME_FIELD.validation,
  POLICY: POLICY_FIELD.validation,
  HOST_AFFINED: AFFINED_FIELD.validation,
  HOST_ANTI_AFFINED: ANTI_AFFINED_FIELD.validation,
})

/** @type {object} Roles schema for the step */
export const SCHEMA = array()
  .of(ROLE_SCHEMA)
  .test(
    'is-non-empty',
    'Define at least one role!',
    (value) => value !== undefined && value.length > 0
  )
  .test(
    'has-valid-role-names',
    'Some roles have invalid names, max 128 characters',
    (roles) =>
      roles.every(
        (role) =>
          role.NAME &&
          role.NAME.trim().length > 0 &&
          role.NAME.trim().length <= 128
      )
  )
  .test(
    'valid-characters',
    'Role names can only contain letters and numbers',
    (roles) =>
      roles.every((role) => role.NAME && /^[a-zA-Z0-9]+$/.test(role.NAME))
  )
  .test(
    'has-unique-name',
    'All roles must have unique names',
    (roles) => new Set(roles.map((role) => role.NAME)).size === roles.length
  )

/**
 * @returns {Field[]} Fields
 */
export const FIELDS = [ROLE_NAME_FIELD, POLICY_FIELD, ROLE_SCHEMA]
