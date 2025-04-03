/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

import { string, number, date } from 'yup'
import { getObjectSchemaFromFields, arrayToOptions } from '@UtilsModule'
import { INPUT_TYPES, T } from '@ConstantsModule'
import {
  dateToMilliseconds,
  getPeriodicityByTimeInSeconds,
  isDate,
  isRelative,
  timeFromMilliseconds,
} from '@ModelsModule'

export const SECTION_ID = 'scheduled_policies'

export const SCHED_TYPES = {
  CHANGE: 'Change',
  CARDINALITY: 'Cardinality',
  PERCENTAGE_CHANGE: 'Percentage',
}

/* eslint-disable no-useless-escape */
const cronExpressionRegex = /^([\d*\/,-]+ ){4}[\d*\/,-]+$/

/* eslint-enable no-useless-escape */

const type = {
  name: 'type',
  label: T.Type,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  cy: 'roleconfig-scheduledpolicies',
  values: arrayToOptions(Object.keys(SCHED_TYPES), {
    addEmpty: false,
    getText: (key) => SCHED_TYPES?.[key],
    getValue: (key) => key,
  }),
  validation: string()
    .trim()
    .oneOf(Object.keys(SCHED_TYPES))
    .default(() => Object.keys(SCHED_TYPES)[0]),
  grid: { md: 3.3 },
}

const adjust = {
  name: 'adjust',
  label: T.Adjust,
  dependOf: 'type',
  type: INPUT_TYPES.TEXT,
  cy: 'roleconfig-scheduledpolicies',
  validation: string()
    .trim()
    .default(() => ''),
  grid: (policyType) => ({
    md: policyType !== Object.keys(SCHED_TYPES)[2] ? 4.15 : 3.1,
  }),
}

const min = {
  name: 'min',
  label: T.Min,
  type: INPUT_TYPES.TEXT,
  dependOf: 'type',
  htmlType: (policyType) =>
    policyType !== Object.keys(SCHED_TYPES)[2] && INPUT_TYPES.HIDDEN,
  cy: 'roleconfig-scheduledpolicies',
  fieldProps: {
    type: 'number',
  },
  validation: number()
    .notRequired()
    .nullable()
    .default(() => undefined)
    .transform((value, originalValue) =>
      originalValue === '' || originalValue === undefined ? null : value
    ),
  grid: { md: 2.1 },
}

const recurrence = {
  name: 'recurrence',
  label: T.Recurrence,
  type: INPUT_TYPES.TEXT,
  cy: 'roleconfig-scheduledpolicies-recurrence',
  validation: string().matches(
    cronExpressionRegex,
    'Time Expression must be a valid CRON expression'
  ),
  grid: { md: 6 },
}

const parseDateString = (_, originalValue) => {
  if (isDate(originalValue)) return originalValue // is JS Date
  if (originalValue?.isValid) return originalValue.toJSDate() // is luxon DateTime

  const newValueInSeconds = isRelative(originalValue)
    ? getPeriodicityByTimeInSeconds(originalValue)?.time
    : originalValue

  return newValueInSeconds
    ? timeFromMilliseconds(newValueInSeconds).toJSDate()
    : undefined // is millisecond format
}

const startTime = {
  name: 'start_time',
  label: T.StartTime,
  type: INPUT_TYPES.TIME,
  validation: date()
    .nullable()
    .transform(parseDateString)
    .afterSubmit((value, { context }) =>
      value ? dateToMilliseconds(value).toString() : undefined
    )
    .default(() => undefined),
  grid: { md: 6 },
}

export const SCHEDULED_POLICY_FIELDS = [
  type,
  adjust,
  min,
  recurrence,
  startTime,
]

export const SCHEDULED_POLICY_SCHEMA = getObjectSchemaFromFields(
  SCHEDULED_POLICY_FIELDS
)
