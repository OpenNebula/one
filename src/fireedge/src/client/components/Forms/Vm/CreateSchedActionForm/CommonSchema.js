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
import { getValidationFromFields, capitalize, clearString } from 'client/utils'
import { getSnapshotList, getDisks } from 'client/models/VirtualMachine'

const ARGS_TYPES = {
  DISK_ID: 'DISK_ID',
  NAME: 'NAME',
  SNAPSHOT_ID: 'SNAPSHOT_ID'
}

const SCHED_ACTION_OPTIONS = VM_ACTIONS_WITH_SCHEDULE
  .map(action => ({
    text: capitalize(clearString(action)),
    value: action
  }))
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
  }[action]
}

export const ACTION_FIELD = {
  name: 'ACTION',
  label: 'Action',
  type: INPUT_TYPES.SELECT,
  values: SCHED_ACTION_OPTIONS,
  validation: yup
    .string()
    .trim()
    .required('Action field is required')
    .default(SCHED_ACTION_OPTIONS[0]?.value),
  grid: { xs: 12 }
}

export const ARGS_DISK_ID_FIELD = vm => {
  const diskOptions = getDisks(vm)
    .map(({ DISK_ID, IMAGE }) => ({ text: IMAGE, value: DISK_ID }))

  return {
    name: ARGS_TYPES.DISK_ID,
    label: 'Disk',
    type: INPUT_TYPES.SELECT,
    dependOf: ACTION_FIELD.name,
    htmlType: action => ARGS_BY_ACTION(action)?.includes(ARGS_TYPES.DISK_ID)
      ? undefined
      : INPUT_TYPES.HIDDEN,
    values: diskOptions,
    validation: yup
      .string()
      .trim()
      .default(() => diskOptions[0]?.value)
      .when(
        ACTION_FIELD.name,
        (action, schema) => ARGS_BY_ACTION(action)?.includes(ARGS_TYPES.DISK_ID)
          ? schema.required('Disk field is required')
          : schema.notRequired().strip()
      )
  }
}

export const ARGS_NAME_FIELD = () => ({
  name: ARGS_TYPES.NAME,
  label: 'Snapshot name',
  type: INPUT_TYPES.TEXT,
  dependOf: ACTION_FIELD.name,
  htmlType: action => ARGS_BY_ACTION(action)?.includes(ARGS_TYPES.NAME)
    ? undefined
    : INPUT_TYPES.HIDDEN,
  validation: yup
    .string()
    .trim()
    .default(() => undefined)
    .when(
      ACTION_FIELD.name,
      (action, schema) => ARGS_BY_ACTION(action)?.includes(ARGS_TYPES.NAME)
        ? schema.required('Snapshot name field is required')
        : schema.notRequired().strip()
    )
})

export const ARGS_SNAPSHOT_ID_FIELD = vm => {
  const snapshotOptions = getSnapshotList(vm)
    .map(({ SNAPSHOT_ID, NAME }) => ({ text: NAME, value: SNAPSHOT_ID }))

  return {
    name: ARGS_TYPES.SNAPSHOT_ID,
    label: 'Snapshot',
    type: INPUT_TYPES.SELECT,
    dependOf: ACTION_FIELD.name,
    htmlType: action => ARGS_BY_ACTION(action)?.includes(ARGS_TYPES.SNAPSHOT_ID)
      ? undefined
      : INPUT_TYPES.HIDDEN,
    values: snapshotOptions,
    validation: yup
      .string()
      .trim()
      .default(() => snapshotOptions[0]?.value)
      .when(
        ACTION_FIELD.name,
        (action, schema) => ARGS_BY_ACTION(action)?.includes(ARGS_TYPES.SNAPSHOT_ID)
          ? schema.required('Snapshot field is required')
          : schema.notRequired().strip()
      )
  }
}

export const COMMON_FIELDS = vm => [
  ACTION_FIELD,
  ARGS_DISK_ID_FIELD,
  ARGS_NAME_FIELD,
  ARGS_SNAPSHOT_ID_FIELD
].map(field => typeof field === 'function' ? field(vm) : field)

export const COMMON_SCHEMA = vm => yup
  .object(getValidationFromFields(COMMON_FIELDS(vm)))
  .transform(value => {
    const {
      ARGS,
      [ACTION_FIELD.name]: ACTION,
      [ARGS_TYPES.NAME]: NAME,
      [ARGS_TYPES.SNAPSHOT_ID]: SNAPSHOT_ID,
      [ARGS_TYPES.DISK_ID]: DISK_ID,
      ...rest
    } = value

    let argsValues = {}

    if (ARGS) {
      // IMPORTANT - String data from ARGS has strict order: DISK_ID, NAME, SNAPSHOT_ID
      const splittedArgs = ARGS.split(',')

      argsValues = {
        [VM_ACTIONS.SNAPSHOT_DISK_CREATE]:
          { DISK_ID: splittedArgs[0], NAME: splittedArgs[1] },
        [VM_ACTIONS.SNAPSHOT_DISK_REVERT]:
          { DISK_ID: splittedArgs[0], SNAPSHOT_ID: splittedArgs[1] },
        [VM_ACTIONS.SNAPSHOT_DISK_DELETE]:
          { DISK_ID: splittedArgs[0], SNAPSHOT_ID: splittedArgs[1] },
        [VM_ACTIONS.SNAPSHOT_CREATE]:
          { NAME: splittedArgs[0] },
        [VM_ACTIONS.SNAPSHOT_REVERT]:
          { SNAPSHOT_ID: splittedArgs[0] },
        [VM_ACTIONS.SNAPSHOT_DELETE]:
          { SNAPSHOT_ID: splittedArgs[0] }
      }[ACTION]
    } else {
      // Transform to send form data
      const argsAsString = Object.entries({ DISK_ID, NAME, SNAPSHOT_ID })
        .map(([name, val]) => ARGS_BY_ACTION(ACTION)?.includes(name) && val)
        .filter(Boolean)
        .join(',')

      argsAsString !== '' && (argsValues = { ARGS: argsAsString })
    }

    return { ...rest, ACTION, ...argsValues }
  })
