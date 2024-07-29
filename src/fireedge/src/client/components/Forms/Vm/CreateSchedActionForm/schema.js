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
import { ObjectSchema, object, string } from 'yup'

import {
  ACTION_FIELD_NAME,
  ACTION_FIELD_VALIDATION,
  PUNCTUAL_FIELDS,
  RELATIVE_FIELDS,
} from 'client/components/Forms/Vm/CreateSchedActionForm/fields'
import { ARGS_TYPES } from 'client/constants'
import { getRequiredArgsByAction } from 'client/models/Scheduler'
import { Field, disableFields, getObjectSchemaFromFields } from 'client/utils'

const ARG_SCHEMA = string()
  .trim()
  .required()
  .default(() => undefined)

const ARG_SCHEMAS = {
  [ARGS_TYPES.DISK_ID]: ARG_SCHEMA,
  [ARGS_TYPES.NAME]: ARG_SCHEMA,
  [ARGS_TYPES.SNAPSHOT_ID]: ARG_SCHEMA,
  [ARGS_TYPES.DS_ID]: ARG_SCHEMA,
}

/**
 * @param {object} vm - Vm resource
 * @param {boolean} isVM - is VM form
 * @returns {Field[]} Common fields
 */
const COMMON_FIELDS = (vm, isVM = false) => [
  PUNCTUAL_FIELDS.ARGS_NAME_FIELD,
  PUNCTUAL_FIELDS.ARGS_DISK_ID_FIELD(vm),
  PUNCTUAL_FIELDS.ARGS_SNAPSHOT_ID_FIELD(vm),
  PUNCTUAL_FIELDS.ARGS_DS_ID_FIELD,
  PUNCTUAL_FIELDS.PERIODIC_FIELD(isVM),
  PUNCTUAL_FIELDS.REPEAT_FIELD,
  PUNCTUAL_FIELDS.WEEKLY_FIELD,
  PUNCTUAL_FIELDS.MONTHLY_FIELD,
  PUNCTUAL_FIELDS.YEARLY_FIELD,
  PUNCTUAL_FIELDS.HOURLY_FIELD,
]

/** @type {ObjectSchema} Common schema with relative */
const COMMON_SCHEMA = object({
  [ACTION_FIELD_NAME]: ACTION_FIELD_VALIDATION,
  ARGS: object().when(ACTION_FIELD_NAME, (action) =>
    getRequiredArgsByAction(action)
      .map((arg) => object({ [arg]: ARG_SCHEMAS[arg] }))
      .reduce((result, argSchema) => result.concat(argSchema), object())
  ),
})

/**
 * @param {object} props - Props
 * @param {object} props.vm - Vm resource
 * @param {object} props.oneConfig - Config of oned.conf
 * @param {boolean} props.adminGroup - User is admin or not
 * @returns {Field[]} Fields
 */
export const VM_SCHED_FIELDS = ({ vm, oneConfig, adminGroup }) =>
  disableFields(
    [
      PUNCTUAL_FIELDS.ACTION_FIELD(vm),
      ...COMMON_FIELDS(vm, true),
      PUNCTUAL_FIELDS.TIME_FIELD,
      PUNCTUAL_FIELDS.END_TYPE_FIELD,
      PUNCTUAL_FIELDS.END_VALUE_FIELD,
    ],
    'SCHED_ACTION',
    oneConfig,
    adminGroup
  )

/** @type {ObjectSchema} Schema */
export const VM_SCHED_SCHEMA = COMMON_SCHEMA.concat(
  getObjectSchemaFromFields([
    PUNCTUAL_FIELDS.TIME_FIELD,
    PUNCTUAL_FIELDS.PERIODIC_FIELD(true),
    PUNCTUAL_FIELDS.REPEAT_FIELD,
    PUNCTUAL_FIELDS.WEEKLY_FIELD,
    PUNCTUAL_FIELDS.MONTHLY_FIELD,
    PUNCTUAL_FIELDS.YEARLY_FIELD,
    PUNCTUAL_FIELDS.HOURLY_FIELD,
    PUNCTUAL_FIELDS.DAYS_FIELD,
    PUNCTUAL_FIELDS.END_TYPE_FIELD,
    PUNCTUAL_FIELDS.END_VALUE_FIELD,
  ])
)

/** @type {Field[]} Fields for relative actions */
export const TEMPLATE_SCHED_FIELDS = ({ vm, oneConfig, adminGroup }) =>
  disableFields(
    [
      PUNCTUAL_FIELDS.ACTION_FIELD(vm),
      ...COMMON_FIELDS(vm),
      PUNCTUAL_FIELDS.TIME_FIELD,
      RELATIVE_FIELDS.RELATIVE_TIME_FIELD,
      RELATIVE_FIELDS.PERIOD_FIELD,
      RELATIVE_FIELDS.END_TYPE_FIELD,
      PUNCTUAL_FIELDS.END_VALUE_FIELD,
    ],
    'SCHED_ACTION',
    oneConfig,
    adminGroup
  )

/** @type {ObjectSchema} Relative Schema */
export const TEMPLATE_SCHED_SCHEMA = COMMON_SCHEMA.concat(
  getObjectSchemaFromFields([
    PUNCTUAL_FIELDS.TIME_FIELD,
    RELATIVE_FIELDS.RELATIVE_TIME_FIELD,
    RELATIVE_FIELDS.PERIOD_FIELD,
    PUNCTUAL_FIELDS.PERIODIC_FIELD(),
    PUNCTUAL_FIELDS.REPEAT_FIELD,
    PUNCTUAL_FIELDS.WEEKLY_FIELD,
    PUNCTUAL_FIELDS.MONTHLY_FIELD,
    PUNCTUAL_FIELDS.YEARLY_FIELD,
    PUNCTUAL_FIELDS.HOURLY_FIELD,
    PUNCTUAL_FIELDS.DAYS_FIELD,
    RELATIVE_FIELDS.END_TYPE_FIELD,
    PUNCTUAL_FIELDS.END_VALUE_FIELD,
  ])
)

/**
 * @param {object} props - Props
 * @param {object} props.vm - Vm resource
 * @returns {Field[]} Fields
 */
export const BACKUPJOB_SCHED_FIELDS = ({ vm }) => [
  ...COMMON_FIELDS(vm, true),
  PUNCTUAL_FIELDS.TIME_FIELD,
  PUNCTUAL_FIELDS.END_TYPE_FIELD,
  PUNCTUAL_FIELDS.END_VALUE_FIELD,
]

/** @type {ObjectSchema} Schema */
export const BACKUPJOB_SCHED_SCHEMA = getObjectSchemaFromFields([
  PUNCTUAL_FIELDS.TIME_FIELD,
  PUNCTUAL_FIELDS.PERIODIC_FIELD(true),
  PUNCTUAL_FIELDS.REPEAT_FIELD,
  PUNCTUAL_FIELDS.WEEKLY_FIELD,
  PUNCTUAL_FIELDS.MONTHLY_FIELD,
  PUNCTUAL_FIELDS.YEARLY_FIELD,
  PUNCTUAL_FIELDS.HOURLY_FIELD,
  PUNCTUAL_FIELDS.DAYS_FIELD,
  PUNCTUAL_FIELDS.END_TYPE_FIELD,
  PUNCTUAL_FIELDS.END_VALUE_FIELD,
])
