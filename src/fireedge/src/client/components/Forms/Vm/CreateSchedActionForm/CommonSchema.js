/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import * as yup from 'yup'

import { INPUT_TYPES, VM_ACTIONS, VM_ACTIONS_WITH_SCHEDULE } from 'client/constants'
import { sentenceCase } from 'client/utils'
import { getSnapshotList, getDisks } from 'client/models/VirtualMachine'

// ----------------------------------------------------------
// Constants
// ----------------------------------------------------------

const ARGS_TYPES = {
  DISK_ID: 'DISK_ID',
  NAME: 'NAME',
  SNAPSHOT_ID: 'SNAPSHOT_ID'
}

const SCHED_ACTION_OPTIONS = VM_ACTIONS_WITH_SCHEDULE
  .map(action => ({ text: sentenceCase(action), value: action }))
  .sort()

const ARGS_BY_ACTION = action => {
  const { DISK_ID, NAME, SNAPSHOT_ID } = ARGS_TYPES

  return {
    [VM_ACTIONS.SNAPSHOT_DISK_CREATE]: [DISK_ID, NAME],
    [VM_ACTIONS.SNAPSHOT_DISK_REVERT]: [DISK_ID, SNAPSHOT_ID],
    [VM_ACTIONS.SNAPSHOT_DISK_DELETE]: [DISK_ID, SNAPSHOT_ID],
    [VM_ACTIONS.SNAPSHOT_CREATE]: [NAME],
    [VM_ACTIONS.SNAPSHOT_REVERT]: [SNAPSHOT_ID],
    [VM_ACTIONS.SNAPSHOT_DELETE]: [SNAPSHOT_ID]
  }[action] ?? []
}

// ----------------------------------------------------------
// Fields
// ----------------------------------------------------------

const createArgField = type => ({
  name: `ARGS.${type}`,
  dependOf: ACTION_FIELD.name,
  htmlType: action => ARGS_BY_ACTION(action)?.includes(type)
    ? undefined
    : INPUT_TYPES.HIDDEN
})

const ACTION_FIELD = {
  name: 'ACTION',
  label: 'Action',
  type: INPUT_TYPES.SELECT,
  values: SCHED_ACTION_OPTIONS,
  validation: yup
    .string()
    .trim()
    .required('Action field is required')
    .default(() => SCHED_ACTION_OPTIONS[0]?.value),
  grid: { xs: 12 }
}

const ARGS_DISK_ID_FIELD = vm => {
  const diskOptions = getDisks(vm)
    .map(({ DISK_ID, IMAGE }) => ({ text: IMAGE, value: DISK_ID }))

  return {
    ...createArgField(ARGS_TYPES.DISK_ID),
    label: 'Disk',
    type: INPUT_TYPES.SELECT,
    values: [{ text: '', value: '' }].concat(diskOptions)
  }
}

const ARGS_NAME_FIELD = {
  ...createArgField(ARGS_TYPES.NAME),
  label: 'Snapshot name',
  type: INPUT_TYPES.TEXT
}

const ARGS_SNAPSHOT_ID_FIELD = vm => {
  const snapshotOptions = getSnapshotList(vm)
    .map(({ SNAPSHOT_ID, NAME }) => ({ text: NAME, value: SNAPSHOT_ID }))

  return {
    ...createArgField(ARGS_TYPES.SNAPSHOT_ID),
    label: 'Snapshot',
    type: INPUT_TYPES.SELECT,
    values: [{ text: '', value: '' }].concat(snapshotOptions)
  }
}

export const COMMON_FIELDS = vm => [
  ACTION_FIELD,
  ARGS_DISK_ID_FIELD(vm),
  ARGS_NAME_FIELD,
  ARGS_SNAPSHOT_ID_FIELD(vm)
].map(field => typeof field === 'function' ? field(vm) : field)

// ----------------------------------------------------------
// Schema
// ----------------------------------------------------------

const transformStringToArgs = ({ ACTION, ARGS = {} }) => {
  if (typeof ARGS !== 'string') return ARGS

  // IMPORTANT - String data from ARGS has strict order: DISK_ID, NAME, SNAPSHOT_ID
  const [arg1, arg2] = ARGS.split(',')

  return {
    [VM_ACTIONS.SNAPSHOT_DISK_CREATE]:
      { DISK_ID: arg1, NAME: arg2 },
    [VM_ACTIONS.SNAPSHOT_DISK_REVERT]:
      { DISK_ID: arg1, SNAPSHOT_ID: arg2 },
    [VM_ACTIONS.SNAPSHOT_DISK_DELETE]:
      { DISK_ID: arg1, SNAPSHOT_ID: arg2 },
    [VM_ACTIONS.SNAPSHOT_CREATE]:
      { NAME: arg1 },
    [VM_ACTIONS.SNAPSHOT_REVERT]:
      { SNAPSHOT_ID: arg1 },
    [VM_ACTIONS.SNAPSHOT_DELETE]:
      { SNAPSHOT_ID: arg1 }
  }[ACTION] ?? {}
}

const createArgSchema = field => yup
  .string()
  .trim()
  .default(() => undefined)
  .required(`${field} field is required`)

const ARG_SCHEMAS = {
  [ARGS_TYPES.DISK_ID]: createArgSchema('Disk'),
  [ARGS_TYPES.NAME]: createArgSchema('Snapshot name'),
  [ARGS_TYPES.SNAPSHOT_ID]: createArgSchema('Snapshot')
}

export const COMMON_SCHEMA = yup
  .object({
    [ACTION_FIELD.name]: ACTION_FIELD.validation,
    ARGS: yup
      .object()
      .default(() => undefined)
      .when(
        ACTION_FIELD.name,
        (action, schema) => ARGS_BY_ACTION(action)
          .map(arg => yup.object({ [arg]: ARG_SCHEMAS[arg] }))
          .reduce((result, argSchema) => result.concat(argSchema), schema)
      )
  })
  .transform(value => ({ ...value, ARGS: transformStringToArgs(value) }))
