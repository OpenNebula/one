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
  ARGS_TYPES,
  INPUT_TYPES,
  ROLE_ACTIONS,
  ROLE_ACTIONS_WITH_SCHEDULE,
  T,
} from '@ConstantsModule'
import { Field, arrayToOptions, getObjectSchemaFromFields } from '@UtilsModule'
import { ObjectSchema, string } from 'yup'

import { getRequiredArgsByAction } from '@ModelsModule'

const ROLE_ACTION_LABELS = {
  [ROLE_ACTIONS.DISK_SNAPSHOT_CREATE]: T.DiskSnapshotCreate,
  [ROLE_ACTIONS.DISK_SNAPSHOT_DELETE]: T.DiskSnapshotDelete,
  [ROLE_ACTIONS.DISK_SNAPSHOT_REVERT]: T.DiskSnapshotRevert,
  [ROLE_ACTIONS.HOLD]: T.Hold,
  [ROLE_ACTIONS.POWEROFF]: T.Poweroff,
  [ROLE_ACTIONS.POWEROFF_HARD]: T.PoweroffHard,
  [ROLE_ACTIONS.REBOOT]: T.Reboot,
  [ROLE_ACTIONS.REBOOT_HARD]: T.RebootHard,
  [ROLE_ACTIONS.RELEASE]: T.Release,
  [ROLE_ACTIONS.RESUME]: T.Resume,
  [ROLE_ACTIONS.SNAPSHOT_CREATE]: T.SnapshotCreate,
  [ROLE_ACTIONS.SNAPSHOT_DELETE]: T.SnapshotDelete,
  [ROLE_ACTIONS.SNAPSHOT_REVERT]: T.SnapshotRevert,
  [ROLE_ACTIONS.STOP]: T.Stop,
  [ROLE_ACTIONS.SUSPEND]: T.Suspend,
  [ROLE_ACTIONS.TERMINATE]: T.Terminate,
  [ROLE_ACTIONS.TERMINATE_HARD]: T.TerminateHard,
  [ROLE_ACTIONS.UNDEPLOY]: T.Undeploy,
  [ROLE_ACTIONS.UNDEPLOY_HARD]: T.UndeployHard,
}

/**
 * @returns {Field} Action name field
 */
const ACTION_FIELD = {
  name: 'ACTION',
  label: T.Action,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () =>
    arrayToOptions(ROLE_ACTIONS_WITH_SCHEDULE, {
      addEmpty: false,
      getText: (action) => ROLE_ACTION_LABELS[action] ?? action,
      getValue: (action) => action,
    }),
  validation: string().trim().required(),
  grid: { xs: 12 },
}

export const ACTION_FIELD_NAME = 'ACTION'

const createArgField = (argName, htmlType) => ({
  name: `ARGS.${argName}`,
  dependOf: ACTION_FIELD_NAME,
  htmlType: (action) =>
    !getRequiredArgsByAction(action)?.includes(argName)
      ? INPUT_TYPES.HIDDEN
      : htmlType,
})

/** @type {Field} Snapshot name field */
const ARGS_NAME_FIELD = {
  ...createArgField(ARGS_TYPES.NAME),
  label: T.SnapshotName,
  type: INPUT_TYPES.TEXT,
}

/** @type {Field} Disk id field */
const ARGS_DISK_ID_FIELD = {
  ...createArgField(ARGS_TYPES.DISK_ID),
  label: T.Disk + ' ' + T.ID,
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

const ROLE_FIELD = (roles = []) => ({
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
  ARGS_DISK_ID_FIELD,
  ARGS_NAME_FIELD,
  ARGS_SNAPSHOT_ID_FIELD,
]

/** @type {ObjectSchema} Schema */
export const SCHEMA = ({ roles }) =>
  getObjectSchemaFromFields(FIELDS({ roles }))
