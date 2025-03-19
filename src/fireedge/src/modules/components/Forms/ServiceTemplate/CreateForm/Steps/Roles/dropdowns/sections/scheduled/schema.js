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

import { string, number } from 'yup'
import { getObjectSchemaFromFields, arrayToOptions } from '@UtilsModule'
import { INPUT_TYPES, T } from '@ConstantsModule'

export const SECTION_ID = 'scheduled_policies'

const TIME_TYPES = {
  recurrence: 'Recurrence',
  starttime: 'Start time',
}

export const SCHED_TYPES = {
  CHANGE: 'Change',
  CARDINALITY: 'Cardinality',
  PERCENTAGE_CHANGE: 'Percentage',
}

/* eslint-disable no-useless-escape */
const timeExpressionRegex =
  /^(\d{4}-\d{2}-\d{2}(?: [0-2]\d:[0-5]\d:[0-5]\d|\d{4}-\d{2}-\d{2}T[0-2]\d:[0-5]\d:[0-5]\dZ)?)$/

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
    .default(() => undefined),
  grid: { md: 2.1 },
}

const format = {
  name: 'format',
  label: T.TimeFormat,
  type: INPUT_TYPES.AUTOCOMPLETE,
  dependOf: 'type',
  optionsOnly: true,
  cy: 'roleconfig-scheduledpolicies',
  values: arrayToOptions(Object.values(TIME_TYPES), { addEmpty: false }),
  validation: string()
    .trim()
    .required()
    .oneOf(Object.values(TIME_TYPES))
    .default(() => undefined),
  grid: (policyType) => ({
    md: policyType !== Object.keys(SCHED_TYPES)[2] ? 4.55 : 3.5,
  }),
}

const expression = {
  name: 'expression',
  label: T.TimeExpression,
  type: INPUT_TYPES.TEXT,
  cy: 'roleconfig-scheduledpolicies',
  validation: string()
    .trim()
    .when('TIMEFORMAT', {
      is: 'Start time',
      then: string().matches(
        timeExpressionRegex,
        'Time Expression must be in the format YYYY-MM-DD hh:mm:ss or YYYY-MM-DDThh:mm:ssZ'
      ),
      otherwise: string().matches(
        cronExpressionRegex,
        'Time Expression must be a valid CRON expression'
      ),
    })
    .required(),
  grid: { md: 12 },
}

export const SCHEDULED_POLICY_FIELDS = [type, adjust, min, format, expression]

export const SCHEDULED_POLICY_SCHEMA = getObjectSchemaFromFields(
  SCHEDULED_POLICY_FIELDS
)
