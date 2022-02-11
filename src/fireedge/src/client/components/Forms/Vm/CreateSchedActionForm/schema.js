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
import { string, object, ObjectSchema } from 'yup'

import { getRequiredArgsByAction } from 'client/models/Scheduler'
import { Field, getObjectSchemaFromFields } from 'client/utils'
import {
  PUNCTUAL_FIELDS,
  RELATIVE_FIELDS,
} from 'client/components/Forms/Vm/CreateSchedActionForm/fields'
import { ARGS_TYPES } from 'client/constants'

const { ACTION_FIELD } = PUNCTUAL_FIELDS

const ARG_SCHEMA = string()
  .trim()
  .required()
  .default(() => undefined)

const ARG_SCHEMAS = {
  [ARGS_TYPES.DISK_ID]: ARG_SCHEMA,
  [ARGS_TYPES.NAME]: ARG_SCHEMA,
  [ARGS_TYPES.SNAPSHOT_ID]: ARG_SCHEMA,
}

/**
 * @param {object} vm - Vm resource
 * @returns {Field[]} Common fields
 */
const COMMON_FIELDS = (vm) => [
  PUNCTUAL_FIELDS.ARGS_NAME_FIELD,
  PUNCTUAL_FIELDS.ARGS_DISK_ID_FIELD(vm),
  PUNCTUAL_FIELDS.ARGS_SNAPSHOT_ID_FIELD(vm),
  PUNCTUAL_FIELDS.PERIODIC_FIELD,
  PUNCTUAL_FIELDS.REPEAT_FIELD,
  PUNCTUAL_FIELDS.WEEKLY_FIELD,
  PUNCTUAL_FIELDS.MONTHLY_FIELD,
  PUNCTUAL_FIELDS.YEARLY_FIELD,
  PUNCTUAL_FIELDS.HOURLY_FIELD,
]

/** @type {ObjectSchema} Common schema with relative */
const COMMON_SCHEMA = object({
  [ACTION_FIELD.name]: ACTION_FIELD.validation,
  ARGS: object().when(ACTION_FIELD.name, (action) =>
    getRequiredArgsByAction(action)
      .map((arg) => object({ [arg]: ARG_SCHEMAS[arg] }))
      .reduce((result, argSchema) => result.concat(argSchema), object())
  ),
})

/**
 * @param {object} vm - Vm resource
 * @returns {Field[]} Fields
 */
export const SCHED_FIELDS = (vm) => [
  PUNCTUAL_FIELDS.ACTION_FIELD,
  PUNCTUAL_FIELDS.TIME_FIELD,
  ...COMMON_FIELDS(vm),
  PUNCTUAL_FIELDS.END_TYPE_FIELD,
  PUNCTUAL_FIELDS.END_VALUE_FIELD,
]

/** @type {Field[]} Fields for relative actions */
export const RELATIVE_SCHED_FIELDS = (vm) => [
  PUNCTUAL_FIELDS.ACTION_FIELD,
  RELATIVE_FIELDS.RELATIVE_TIME_FIELD,
  RELATIVE_FIELDS.PERIOD_FIELD,
  ...COMMON_FIELDS(vm),
  RELATIVE_FIELDS.END_TYPE_FIELD_WITHOUT_DATE,
  PUNCTUAL_FIELDS.END_VALUE_FIELD,
]

/** @type {ObjectSchema} Schema */
export const SCHED_SCHEMA = COMMON_SCHEMA.concat(
  getObjectSchemaFromFields([
    PUNCTUAL_FIELDS.TIME_FIELD,
    PUNCTUAL_FIELDS.PERIODIC_FIELD,
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

/** @type {ObjectSchema} Relative Schema */
export const RELATIVE_SCHED_SCHEMA = COMMON_SCHEMA.concat(
  getObjectSchemaFromFields([
    RELATIVE_FIELDS.RELATIVE_TIME_FIELD,
    RELATIVE_FIELDS.PERIOD_FIELD,
    PUNCTUAL_FIELDS.PERIODIC_FIELD,
    PUNCTUAL_FIELDS.REPEAT_FIELD,
    PUNCTUAL_FIELDS.WEEKLY_FIELD,
    PUNCTUAL_FIELDS.MONTHLY_FIELD,
    PUNCTUAL_FIELDS.YEARLY_FIELD,
    PUNCTUAL_FIELDS.HOURLY_FIELD,
    PUNCTUAL_FIELDS.DAYS_FIELD,
    RELATIVE_FIELDS.END_TYPE_FIELD_WITHOUT_DATE,
    PUNCTUAL_FIELDS.END_VALUE_FIELD,
  ])
)
