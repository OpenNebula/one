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
import { DateTime } from 'luxon'
import { array, date, lazy, mixed, number, ref, string } from 'yup'

import {
  END_TYPE_VALUES,
  INPUT_TYPES,
  REPEAT_VALUES,
  SCHEDULE_TYPE,
  T,
  VM_SCHEDULE_TYPE_STRING,
} from '@ConstantsModule'
import { getPeriodicityByTimeInSeconds, isRelative } from '@ModelsModule'
import AlertText from '@modules/resources/resources/BackupJobs/Forms/SchedActionForm/AlertText'
import {
  Field,
  arrayToOptions,
  dateToMilliseconds,
  isDate,
  sentenceCase,
  OPTION_SORTERS,
  timeFromMilliseconds,
} from '@UtilsModule'

export const PERIODIC_FIELD_NAME = 'PERIODIC'

/** @type {RegExp} Regex to days of month (1-31) */
const MONTH_DAYS_REG = /^(3[01]|[12][0-9]|[1-9])(,(3[01]|[12][0-9]|[1-9]))*$/

/** @type {RegExp} Regex to days of year (1-365) */
const YEAR_DAYS_REG =
  /^(36[0-5]|3[0-5]\d|[12]\d{2}|[0-9]\d?)(,(36[0-5]|3[0-5]\d|[12]\d{2}|[1-9]\d?))*$/

const DAYS_OF_WEEK = [
  T.Sunday,
  T.Monday,
  T.Tuesday,
  T.Wednesday,
  T.Thursday,
  T.Friday,
  T.Saturday,
]

const getNow = () => DateTime.now()

const getTomorrow = () => getNow().plus({ days: 1 })

const getTomorrowAtMidnight = () =>
  getTomorrow().set({ hour: 12, minute: 0, second: 0 })

const getNextWeek = () =>
  getNow().plus({ weeks: 1 }).set({ hour: 12, minute: 0, second: 0 })

const parseDateString = (_, originalValue) => {
  if ([undefined, null, ''].includes(originalValue)) return undefined
  if (isDate(originalValue)) return originalValue
  if (originalValue?.isValid) return originalValue.toJSDate()

  const newValueInSeconds = isRelative(originalValue)
    ? getPeriodicityByTimeInSeconds(originalValue)?.time
    : originalValue

  return timeFromMilliseconds(newValueInSeconds).toJSDate()
}

/** @type {Field} Schedule type field */
export const PERIODIC_FIELD = {
  name: PERIODIC_FIELD_NAME,
  label: T.ScheduleActionType,
  type: INPUT_TYPES.TOGGLE,
  values: () =>
    arrayToOptions(Object.keys(VM_SCHEDULE_TYPE_STRING), {
      addEmpty: false,
      getText: (key) => VM_SCHEDULE_TYPE_STRING[key],
      getValue: (key) => key,
    }),
  validation: string()
    .trim()
    .required()
    .default(() => SCHEDULE_TYPE.ONETIME),
  grid: { md: 12 },
  notNull: true,
}

/** @type {Field} Time field */
export const TIME_FIELD = {
  name: 'TIME',
  label: (typeAction) =>
    typeAction === SCHEDULE_TYPE.PERIODIC ? T.StartTime : T.Time,
  type: INPUT_TYPES.TIME,
  dependOf: PERIODIC_FIELD_NAME,
  validation: lazy(() =>
    date()
      .nullable()
      .transform(parseDateString)
      // .min(getNow().toJSDate())
      .default(() => getTomorrowAtMidnight())
      .required()
      .afterSubmit((value) => (value ? dateToMilliseconds(value) : undefined))
  ),
  fieldProps: {
    minDateTime: getNow(),
  },
  grid: { md: 12 },
}

/** @type {Field} Granularity of action */
export const REPEAT_FIELD = {
  name: 'REPEAT',
  label: T.GranularityOfAction,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.keys(REPEAT_VALUES), {
    addEmpty: true,
    getText: (key) => sentenceCase(key),
    getValue: (key) => REPEAT_VALUES[key],
    sorter: OPTION_SORTERS.unsort,
  }),
  dependOf: PERIODIC_FIELD_NAME,
  htmlType: (typeAction) =>
    typeAction !== SCHEDULE_TYPE.PERIODIC && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when(PERIODIC_FIELD_NAME, (typeAction, schema) =>
      typeAction === SCHEDULE_TYPE.PERIODIC ? schema.required() : schema.strip()
    ),
  grid: { md: 12 },
  notNull: true,
}

/** @type {Field} Weekly field */
export const WEEKLY_FIELD = {
  name: 'WEEKLY',
  dependOf: [PERIODIC_FIELD_NAME, REPEAT_FIELD.name],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  multiple: true,
  label: T.DayOfWeek,
  values: arrayToOptions(DAYS_OF_WEEK, {
    addEmpty: false,
    getValue: (_, index) => String(index),
  }),
  htmlType: (_, context) => {
    const values = context?.getValues() || {}

    return (
      !(
        values?.PERIODIC === SCHEDULE_TYPE.PERIODIC &&
        values?.REPEAT === REPEAT_VALUES.WEEKLY
      ) && INPUT_TYPES.HIDDEN
    )
  },
  validation: lazy((_, { context }) =>
    array(string())
      .ensure()
      .min(1)
      .default(() => context?.[DAYS_FIELD.name]?.split?.(',') ?? [])
      .when(REPEAT_FIELD.name, (repeatType, schema) =>
        repeatType !== REPEAT_VALUES.WEEKLY
          ? schema.strip()
          : schema.required(T.DaysBetween0_6)
      )
  ),
  grid: { md: 12 },
}

/** @type {Field} Monthly field */
export const MONTHLY_FIELD = {
  name: 'MONTHLY',
  dependOf: [PERIODIC_FIELD_NAME, REPEAT_FIELD.name],
  type: INPUT_TYPES.TEXT,
  label: T.DayOfMonth,
  htmlType: (_, context) => {
    const values = context?.getValues() || {}

    return (
      !(
        values?.PERIODIC === SCHEDULE_TYPE.PERIODIC &&
        values?.REPEAT === REPEAT_VALUES.MONTHLY
      ) && INPUT_TYPES.HIDDEN
    )
  },
  grid: { md: 12 },
  validation: lazy((_, { context }) =>
    string()
      .trim()
      .matches(MONTH_DAYS_REG, {
        message: T.DaysBetween1_31,
        excludeEmptyString: true,
      })
      .default(() => context?.[DAYS_FIELD.name])
      .when(REPEAT_FIELD.name, (repeatType, schema) =>
        repeatType !== REPEAT_VALUES.MONTHLY
          ? schema.strip()
          : schema.required()
      )
  ),
}

/** @type {Field} Yearly field */
export const YEARLY_FIELD = {
  name: 'YEARLY',
  dependOf: [PERIODIC_FIELD_NAME, REPEAT_FIELD.name],
  type: INPUT_TYPES.TEXT,
  label: T.DayOfYear,
  htmlType: (_, context) => {
    const values = context?.getValues() || {}

    return (
      !(
        values?.PERIODIC === SCHEDULE_TYPE.PERIODIC &&
        values?.REPEAT === REPEAT_VALUES.YEARLY
      ) && INPUT_TYPES.HIDDEN
    )
  },
  grid: { md: 12 },
  validation: lazy((_, { context }) =>
    string()
      .trim()
      .matches(YEAR_DAYS_REG, {
        message: T.DaysBetween0_365,
        excludeEmptyString: true,
      })
      .default(() => context?.[DAYS_FIELD.name])
      .when(REPEAT_FIELD.name, (repeatType, schema) =>
        repeatType !== REPEAT_VALUES.YEARLY ? schema.strip() : schema.required()
      )
  ),
}

/** @type {Field} Hourly field */
export const HOURLY_FIELD = {
  name: 'HOURLY',
  dependOf: [PERIODIC_FIELD_NAME, REPEAT_FIELD.name],
  type: INPUT_TYPES.TEXT,
  label: T.EachXHours,
  grid: { md: 12 },
  htmlType: (_, context) => {
    const values = context?.getValues() || {}

    return (
      !(
        values?.PERIODIC === SCHEDULE_TYPE.PERIODIC &&
        values?.REPEAT === REPEAT_VALUES.HOURLY
      ) && INPUT_TYPES.HIDDEN
    )
  },
  validation: lazy((_, { context }) =>
    number()
      .transform((value, originalValue) =>
        [undefined, null, ''].includes(originalValue) ? undefined : value
      )
      .min(0)
      .max(168)
      .integer()
      .default(() => context?.[DAYS_FIELD.name])
      .when(REPEAT_FIELD.name, (repeatType, schema) =>
        repeatType !== REPEAT_VALUES.HOURLY ? schema.strip() : schema.required()
      )
  ),
  fieldProps: { min: 0, max: 168, step: 1 },
}

/**
 * This field is only used to transform the number of the days that
 * the users wants execute the action: weekly, monthly, yearly or hourly.
 *
 * @type {Field} Days field
 */
export const DAYS_FIELD = {
  name: 'DAYS',
  validation: mixed()
    .notRequired()
    .transform((value, _originalValue, context) => {
      const isPeriodic =
        context?.parent?.[PERIODIC_FIELD_NAME] === SCHEDULE_TYPE.PERIODIC
      const repeatType = context?.parent?.[REPEAT_FIELD.name]

      if (!isPeriodic) return undefined

      const { WEEKLY, MONTHLY, YEARLY, HOURLY } = REPEAT_VALUES

      const dayValues = {
        [WEEKLY]: context?.parent?.[WEEKLY_FIELD.name],
        [MONTHLY]: context?.parent?.[MONTHLY_FIELD.name],
        [YEARLY]: context?.parent?.[YEARLY_FIELD.name],
        [HOURLY]: context?.parent?.[HOURLY_FIELD.name],
      }

      return dayValues[repeatType] ?? value
    }),
}

/** @type {Field} End type field */
export const END_TYPE_FIELD = {
  name: 'END_TYPE',
  label: T.EndType,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: PERIODIC_FIELD_NAME,
  htmlType: (typeAction) =>
    typeAction !== SCHEDULE_TYPE.PERIODIC && INPUT_TYPES.HIDDEN,
  values: arrayToOptions(Object.keys(END_TYPE_VALUES), {
    addEmpty: false,
    getText: (value) => sentenceCase(value),
    getValue: (value) => END_TYPE_VALUES[value],
  }),
  validation: mixed().notRequired(),
  grid: { md: 12 },
}

/** @type {Field} End value field */
export const END_VALUE_FIELD = {
  name: 'END_VALUE',
  label: ([typeAction, endType] = []) =>
    typeAction === SCHEDULE_TYPE.PERIODIC && endType === END_TYPE_VALUES.DATE
      ? T.WhenDoYouWantThisActionToStop
      : T.HowManyTimesDoYouWantThisActionToExecute,
  dependOf: [PERIODIC_FIELD_NAME, END_TYPE_FIELD.name],
  type: ([typeAction, endType] = []) =>
    typeAction === SCHEDULE_TYPE.PERIODIC && endType === END_TYPE_VALUES.DATE
      ? INPUT_TYPES.TIME
      : INPUT_TYPES.TEXT,
  htmlType: ([typeAction, endType] = []) => {
    if (
      typeAction !== SCHEDULE_TYPE.PERIODIC ||
      endType === END_TYPE_VALUES.NEVER
    ) {
      return INPUT_TYPES.HIDDEN
    }

    return endType === END_TYPE_VALUES.REPETITION ? 'number' : false
  },
  validation: lazy((_, { parent } = {}) => {
    const typeAction = parent?.[PERIODIC_FIELD_NAME]
    const endType = parent?.[END_TYPE_FIELD.name]

    if (typeAction !== SCHEDULE_TYPE.PERIODIC) {
      return string().trim().notRequired()
    }

    const schemas = {
      [END_TYPE_VALUES.NEVER]: string().strip(),
      [END_TYPE_VALUES.REPETITION]: number().required().min(1),
      [END_TYPE_VALUES.DATE]: date()
        .nullable()
        .transform(parseDateString)
        .min(ref(TIME_FIELD.name))
        .required()
        .afterSubmit((value) =>
          value ? dateToMilliseconds(value) : undefined
        ),
    }

    return schemas[endType] ?? string().strip()
  }),
  grid: { md: 12 },
  fieldProps: ([_, endType] = []) =>
    endType === END_TYPE_VALUES.DATE && { defaultValue: getNextWeek() },
}

/** @type {Field} Text periodicity field */
export const PERIOD_TEXT_FIELD = {
  name: 'PERIOD_TEXT',
  type: INPUT_TYPES.TYPOGRAPHY,
  dependOf: [
    PERIODIC_FIELD_NAME,
    REPEAT_FIELD.name,
    TIME_FIELD.name,
    END_TYPE_FIELD.name,
    END_VALUE_FIELD.name,
    WEEKLY_FIELD.name,
    MONTHLY_FIELD.name,
    YEARLY_FIELD.name,
    HOURLY_FIELD.name,
  ],
  grid: { md: 12 },
  text: AlertText,
}
