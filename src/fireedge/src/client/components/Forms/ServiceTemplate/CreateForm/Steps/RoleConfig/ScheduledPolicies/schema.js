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
import { object, string, number } from 'yup'
import { getValidationFromFields, arrayToOptions } from 'client/utils'
import { INPUT_TYPES, T } from 'client/constants'

const TIME_TYPES = {
  none: '',
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

/**
 * Creates fields for scheduled policies schema based on a path prefix.
 *
 * @param {string} pathPrefix - Path prefix for field names.
 * @returns {object[]} - Array of field definitions for scheduled policies.
 */
export const createScheduledPolicyFields = (pathPrefix) => {
  const getPath = (fieldName) =>
    pathPrefix ? `${pathPrefix}.${fieldName}` : fieldName

  return [
    {
      name: getPath('SCHEDTYPE'),
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
      grid: { xs: 12, sm: 6, md: 3.3 },
    },
    {
      name: getPath('ADJUST'),
      label: T.Adjust,
      type: INPUT_TYPES.TEXT,
      cy: 'roleconfig-scheduledpolicies',
      validation: string()
        .trim()
        .default(() => ''),
      grid: { xs: 12, sm: 6, md: 3.1 },
    },
    {
      name: getPath('MIN'),
      label: T.Min,
      type: INPUT_TYPES.TEXT,
      cy: 'roleconfig-scheduledpolicies',
      fieldProps: {
        type: 'number',
      },
      validation: number().notRequired(),
      grid: { xs: 12, sm: 6, md: 2.1 },
    },
    {
      name: getPath('TIMEFORMAT'),
      label: T.TimeFormat,
      type: INPUT_TYPES.AUTOCOMPLETE,
      optionsOnly: true,
      cy: 'roleconfig-scheduledpolicies',
      values: arrayToOptions(Object.values(TIME_TYPES), { addEmpty: false }),
      validation: string()
        .trim()
        .required()
        .oneOf(Object.values(TIME_TYPES))
        .default(() => Object.values(TIME_TYPES)[0]),
      grid: { xs: 12, sm: 6, md: 3.5 },
    },
    {
      name: getPath('TIMEEXPRESSION'),
      label: T.TimeExpression,
      type: INPUT_TYPES.TEXT,
      cy: 'roleconfig-scheduledpolicies',
      validation: string()
        .trim()
        .when(getPath('TIMEFORMAT'), {
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
      grid: { xs: 12, sm: 12, md: 12 },
    },
  ]
}

/**
 * Creates a Yup schema for scheduled policies based on a given path prefix.
 *
 * @param {string} pathPrefix - Path prefix for field names in the schema.
 * @returns {object} - Yup schema object for scheduled policies.
 */
export const createScheduledPoliciesSchema = (pathPrefix) => {
  const fields = createScheduledPolicyFields(pathPrefix)

  return object(getValidationFromFields(fields))
}
