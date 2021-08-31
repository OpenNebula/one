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
import { DateTime } from 'luxon'

import { T, INPUT_TYPES } from 'client/constants'
import { getValidationFromFields, capitalize } from 'client/utils'
import { timeFromMilliseconds } from 'client/models/Helper'
import { COMMON_FIELDS, COMMON_SCHEMA } from 'client/components/Forms/Vm/CreateSchedActionForm/CommonSchema'

const ISO_FORMAT = "yyyy-MM-dd'T'HH:mm"
const ISO_REG = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const MONTH_DAYS_REG = /^(3[01]|[12][0-9]|[1-9])(,(3[01]|[12][0-9]|[1-9]))*$/
const YEAR_DAYS_REG = /^(36[0-5]|3[0-5]\d|[12]\d{2}|[0-9]\d?)(,(36[0-5]|3[0-5]\d|[12]\d{2}|[1-9]\d?))*$/
const HOURS_REG = /^(16[0-8]|1[01][0-9]|[1-9]?[0-9])$/

const REPEAT_VALUES = {
  WEEKLY: '0',
  MONTHLY: '1',
  YEARLY: '2',
  HOURLY: '3'
}

const END_TYPE_VALUES = {
  NEVER: '0',
  REPETITION: '1',
  DATE: '2'
}

const REPEAT_OPTIONS = Object.entries(REPEAT_VALUES)
  .map(([text, value]) => ({ text: capitalize(text), value }))

const END_TYPE_OPTIONS = Object.entries(END_TYPE_VALUES)
  .map(([text, value]) => ({ text: capitalize(text), value }))

const isoDateValidation = nameInput => yup
  .string()
  .trim()
  .default(() => DateTime.local().toFormat(ISO_FORMAT))
  .matches(
    ISO_REG,
    { message: `${nameInput} should be a date with ISO format: yyyy-MM-ddTHH:mm` }
  )
  .transform((value, originalValue) => {
    if (value.length < 10 || (isNaN(value) && value.match(ISO_REG) === null)) {
      return value
    }

    const newValue = isNaN(originalValue)
      ? DateTime.fromISO(originalValue)
      : timeFromMilliseconds(originalValue)

    return newValue.isValid ? newValue.toFormat(ISO_FORMAT) : originalValue
  })

const PERIODIC_FIELD = {
  name: 'PERIODIC',
  label: 'Periodic',
  type: INPUT_TYPES.CHECKBOX,
  validation: yup
    .boolean()
    .default(false),
  grid: { md: 12 }
}

const TIME_FIELD = {
  name: 'TIME',
  label: 'Time',
  type: INPUT_TYPES.TIME,
  validation: yup
    .string()
    .required('Time field is required')
    .concat(isoDateValidation('Time'))
}

const REPEAT_FIELD = {
  name: 'REPEAT',
  label: 'Periodicity',
  type: INPUT_TYPES.SELECT,
  dependOf: PERIODIC_FIELD.name,
  htmlType: isPeriodic => !isPeriodic ? INPUT_TYPES.HIDDEN : undefined,
  values: REPEAT_OPTIONS,
  validation: yup
    .string()
    .trim()
    .when(
      PERIODIC_FIELD.name,
      (isPeriodic, schema) => isPeriodic ? schema : schema.strip()
    )
    .notRequired()
    .default(REPEAT_OPTIONS[0].value)
}

const DAYS_FIELD = {
  name: 'DAYS',
  dependOf: [PERIODIC_FIELD.name, REPEAT_FIELD.name],
  multiple: (dependValues = {}) => {
    const { [REPEAT_FIELD.name]: repeat } = dependValues

    return REPEAT_VALUES.WEEKLY === repeat
  },
  type: (dependValues = {}) => {
    const { [REPEAT_FIELD.name]: repeat } = dependValues

    return REPEAT_VALUES.WEEKLY === repeat ? INPUT_TYPES.SELECT : INPUT_TYPES.TEXT
  },
  label: (dependValues = {}) => {
    const { [REPEAT_FIELD.name]: repeat } = dependValues

    return {
      [REPEAT_VALUES.WEEKLY]: 'Days of week',
      [REPEAT_VALUES.MONTHLY]: 'Days of month',
      [REPEAT_VALUES.YEARLY]: 'Days of year',
      [REPEAT_VALUES.HOURLY]: "Each 'x' hours"
    }[repeat]
  },
  values: [
    { text: T.Sunday, value: '0' },
    { text: T.Monday, value: '1' },
    { text: T.Tuesday, value: '2' },
    { text: T.Wednesday, value: '3' },
    { text: T.Thursday, value: '4' },
    { text: T.Friday, value: '5' },
    { text: T.Saturday, value: '6' }
  ],
  htmlType: (dependValues = {}) => {
    const { [PERIODIC_FIELD.name]: periodic, [REPEAT_FIELD.name]: repeat } = dependValues

    if (!periodic) return INPUT_TYPES.HIDDEN

    return REPEAT_VALUES.HOURLY === repeat ? 'number' : undefined
  },
  validation: yup
    .string()
    .default(undefined)
    .when(
      REPEAT_FIELD.name,
      (repeatType, schema) => ({
        [REPEAT_VALUES.WEEKLY]: schema
          .transform(value => Array.isArray(value) ? value.join(',') : value)
          .required('Days field is required: between 0 (Sunday) and 6 (Saturday)'),
        [REPEAT_VALUES.MONTHLY]: schema
          .trim()
          .matches(MONTH_DAYS_REG, { message: 'Days should be between 1 and 31' })
          .required('Days field is required: between 1 and 31'),
        [REPEAT_VALUES.YEARLY]: schema
          .trim()
          .matches(YEAR_DAYS_REG, { message: 'Days should be between 0 and 365' })
          .required('Days field is required: between 0 and 365'),
        [REPEAT_VALUES.HOURLY]: schema
          .trim()
          .matches(HOURS_REG, { message: 'Hours should be between 0 and 168' })
          .required('Hours field is required: between 0 and 168')
      }[repeatType])
    ),
  fieldProps: { min: 0, max: 168, step: 1 }
}

const END_TYPE_FIELD = {
  name: 'END_TYPE',
  label: 'End type',
  type: INPUT_TYPES.SELECT,
  dependOf: PERIODIC_FIELD.name,
  htmlType: isPeriodic => !isPeriodic ? INPUT_TYPES.HIDDEN : undefined,
  values: END_TYPE_OPTIONS,
  validation: yup
    .string()
    .trim()
    .when(
      PERIODIC_FIELD.name,
      (isPeriodic, schema) => isPeriodic ? schema : schema.strip()
    )
    .notRequired()
    .default(END_TYPE_OPTIONS[0].value)
}

const END_VALUE_FIELD = {
  name: 'END_VALUE',
  label: 'When you want that the action finishes',
  dependOf: [PERIODIC_FIELD.name, END_TYPE_FIELD.name],
  type: (dependValues = {}) => {
    const { [END_TYPE_FIELD.name]: endType } = dependValues

    return endType === END_TYPE_VALUES.DATE ? INPUT_TYPES.TIME : INPUT_TYPES.TEXT
  },
  htmlType: (dependValues = {}) => {
    const { [PERIODIC_FIELD.name]: isPeriodic, [END_TYPE_FIELD.name]: endType } = dependValues

    if (!isPeriodic) return INPUT_TYPES.HIDDEN

    return {
      [END_TYPE_VALUES.NEVER]: INPUT_TYPES.HIDDEN,
      [END_TYPE_VALUES.REPETITION]: 'number',
      [END_TYPE_VALUES.DATE]: 'datetime-local'
    }[endType]
  },
  validation: yup
    .string()
    .trim()
    .default(undefined)
    .when(
      PERIODIC_FIELD.name,
      (isPeriodic, schema) => isPeriodic ? schema : schema.strip()
    )
    .when(
      END_TYPE_FIELD.name,
      (endType, schema) => ({
        [END_TYPE_VALUES.NEVER]: schema.strip(),
        [END_TYPE_VALUES.REPETITION]: schema
          .required('Number of repetitions is required'),
        [END_TYPE_VALUES.DATE]: schema
          .concat(isoDateValidation('Date'))
          .required('Date to finish the action is required')
      }[endType])
    )
}

export const FIELDS = vm => [
  ...COMMON_FIELDS(vm),
  TIME_FIELD,
  PERIODIC_FIELD,
  REPEAT_FIELD,
  DAYS_FIELD,
  END_TYPE_FIELD,
  END_VALUE_FIELD
]

export const SCHEMA = vm => yup
  .object(getValidationFromFields(FIELDS(vm)))
  .concat(COMMON_SCHEMA(vm))
  .transform(value => {
    const { [DAYS_FIELD.name]: DAYS, [REPEAT_FIELD.name]: REPEAT, ...rest } = value

    return {
      ...rest,
      [DAYS_FIELD.name]: DAYS,
      [REPEAT_FIELD.name]: REPEAT,
      [PERIODIC_FIELD.name]: !!(DAYS || REPEAT)
    }
  })
