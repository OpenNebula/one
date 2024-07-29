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
import { object, string, array, number } from 'yup'
import { Field } from 'client/utils'

/** @type {Field} Name field for role */
const ROLE_NAME_FIELD = {
  name: 'name',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required('Role name cannot be empty')
    .default(() => ''),
  grid: { md: 12 },
}

const CARDINALITY_FIELD = {
  name: 'cardinality',
  label: T.NumberOfVms,

  validation: number()
    .test(
      'Is positive?',
      'Number of VMs cannot be negative!',
      (value) => value >= 0
    )
    .default(() => 0),
}

const PARENTS_FIELD = {
  name: 'parents',
  label: T.ParentRoles,
  validation: array()
    .notRequired()
    .default(() => []),
}

const SELECTED_VM_TEMPLATE_ID_FIELD = {
  name: 'selected_vm_template_id',
  validation: array()
    .required('VM Template ID is required')
    .min(1, 'At least one VM Template ID is required')
    .default(() => []),
}

/** @type {object} Role schema */
const ROLE_SCHEMA = object().shape({
  NAME: ROLE_NAME_FIELD.validation,
  CARDINALITY: CARDINALITY_FIELD.validation,
  PARENTS: PARENTS_FIELD.validation,
  SELECTED_VM_TEMPLATE_ID: SELECTED_VM_TEMPLATE_ID_FIELD.validation,
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
  .test('non-negative', 'Number of VMs must be non-negative', (roles) =>
    roles.every((role) => role?.CARDINALITY >= 0)
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
export const FIELDS = [ROLE_NAME_FIELD, ROLE_SCHEMA]
