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
import { ObjectSchema, string } from 'yup'
import { getObjectSchemaFromFields, arrayToOptions, Field } from 'client/utils'
import {
  INPUT_TYPES,
  T,
  VM_ACTIONS_WITH_SCHEDULE,
  VM_ACTIONS,
  ARGS_TYPES,
} from 'client/constants'

import { getRequiredArgsByAction } from 'client/models/Scheduler'

/**
 * @returns {Field} Action name field
 */
const ACTION_FIELD = {
  name: 'ACTION',
  label: T.Action,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () => {
    const validActions = {
      ...VM_ACTIONS_WITH_SCHEDULE,
    }

    /**
     * BACKUP: Not supported by oneflow api
     */
    delete validActions[VM_ACTIONS.BACKUP]

    return arrayToOptions(
      Object.entries({
        ...validActions,
      }),
      {
        addEmpty: false,
        getText: ([, text]) => text,
        getValue: ([value]) => value,
      }
    )
  },
  validation: string().trim().required(),
  grid: { xs: 12 },
}

export const ACTION_FIELD_NAME = 'ACTION'

const createArgField = (argName, htmlType) => ({
  name: `ARGS.${argName}`,
  dependOf: ACTION_FIELD_NAME,
  htmlType: (action) => {
    const prueba = getRequiredArgsByAction(action)
    console.log(argName, prueba.includes(argName))

    return !getRequiredArgsByAction(action)?.includes(argName)
      ? INPUT_TYPES.HIDDEN
      : htmlType
  },
})

/** @type {Field} Snapshot name field */
const ARGS_NAME_FIELD = {
  ...createArgField(ARGS_TYPES.NAME),
  label: T.SnapshotName,
  type: INPUT_TYPES.TEXT,
}

/**
 * @returns {Field} Snapshot id field
 */
const ARGS_SNAPSHOT_ID_FIELD = {
  ...createArgField(ARGS_TYPES.SNAPSHOT_ID),
  label: T.Snapshot + ' ' + T.ID,
  type: INPUT_TYPES.TEXT,
}

const ROLE_FIELD = (roles) => ({
  name: 'ROLE',
  label: T.Role,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () => {
    const rolesWithAll = roles.map((role) => ({
      name: role.name,
      value: role.name,
    }))

    rolesWithAll.push({
      name: T.All,
      value: 'ALL',
    })

    return arrayToOptions(rolesWithAll, {
      addEmpty: false,
      getText: (role) => role.name,
      getValue: (role) => role.value,
    })
  },
  validation: string().trim().required(),
  grid: { xs: 12 },
})

/**
 * @param {object} props - Properties of the form
 * @param {object} props.roles - Roles of the service
 * @returns {Array} - List of fields
 */
export const FIELDS = ({ roles }) => [
  ACTION_FIELD,
  ROLE_FIELD(roles),
  ARGS_NAME_FIELD,
  ARGS_SNAPSHOT_ID_FIELD,
]

/** @type {ObjectSchema} Schema */
export const SCHEMA = ({ roles }) =>
  getObjectSchemaFromFields(FIELDS({ roles }))
