/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { ref, mixed, boolean, string, date, lazy, array, number } from 'yup'

import {
  T,
  INPUT_TYPES,
  VM_ACTIONS_IN_CHARTER,
  VM_ACTIONS_WITH_SCHEDULE,
} from 'client/constants'
import { Field, sentenceCase, arrayToOptions } from 'client/utils'
import {
  isRelative,
  END_TYPE_VALUES,
  REPEAT_VALUES,
  ARGS_TYPES,
  getRequiredArgsByAction,
  PERIOD_TYPES,
  getPeriodicityByTimeInSeconds,
} from 'client/models/Scheduler'
import {
  isDate,
  timeFromMilliseconds,
  dateToMilliseconds,
} from 'client/models/Helper'
import { getSnapshotList, getDisks } from 'client/models/VirtualMachine'

// --------------------------------------------------------
// Constants
// --------------------------------------------------------

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

const getNextWeek = () => getNow().plus({ weeks: 1 })

const parseDateString = (_, originalValue) => {
  if (isDate(originalValue)) return originalValue // is JS Date
  if (originalValue?.isValid) return originalValue.toJSDate() // is luxon DateTime

  const newValueInSeconds = isRelative(originalValue)
    ? getPeriodicityByTimeInSeconds(originalValue)?.time
    : originalValue

  return timeFromMilliseconds(newValueInSeconds).toJSDate() // is millisecond format
}

// --------------------------------------------------------
// Fields
// --------------------------------------------------------

const createArgField = (argName) => ({
  name: `ARGS.${argName}`,
  dependOf: ACTION_FIELD.name,
  htmlType: (action) =>
    !getRequiredArgsByAction(action)?.includes(argName) && INPUT_TYPES.HIDDEN,
})

/** @type {Field} Action name field */
const ACTION_FIELD = {
  name: 'ACTION',
  label: T.Action,
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(VM_ACTIONS_WITH_SCHEDULE, {
    addEmpty: false,
    getText: (action) => sentenceCase(action),
  }),
  validation: string().trim().required(),
  grid: { xs: 12 },
}

/** @type {Field} Action name field */
const ACTION_FIELD_FOR_CHARTERS = {
  ...ACTION_FIELD,
  values: arrayToOptions(VM_ACTIONS_IN_CHARTER, {
    addEmpty: false,
    getText: (action) => sentenceCase(action),
  }),
}

/**
 * @param {object} vm - Vm resource
 * @returns {Field} Disk id field
 */
const ARGS_DISK_ID_FIELD = (vm) => ({
  ...createArgField(ARGS_TYPES.DISK_ID),
  label: T.Disk,
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(getDisks(vm), {
    getText: ({ IMAGE_ID, IMAGE, NAME } = {}) => {
      const isVolatile = !IMAGE && !IMAGE_ID

      return isVolatile ? NAME : `${NAME}: ${IMAGE}`
    },
    getValue: ({ DISK_ID } = {}) => DISK_ID,
  }),
})

/** @type {Field} Snapshot name field */
const ARGS_NAME_FIELD = {
  ...createArgField(ARGS_TYPES.NAME),
  label: T.SnapshotName,
  type: INPUT_TYPES.TEXT,
}

/**
 * @param {object} vm - Vm resource
 * @returns {Field} Snapshot id field
 */
const ARGS_SNAPSHOT_ID_FIELD = (vm) => ({
  ...createArgField(ARGS_TYPES.SNAPSHOT_ID),
  label: T.Snapshot,
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(getSnapshotList(vm), {
    getText: ({ NAME } = {}) => NAME,
    getValue: ({ SNAPSHOT_ID } = {}) => SNAPSHOT_ID,
  }),
})

/** @type {Field} Periodic field */
const PERIODIC_FIELD = {
  name: 'PERIODIC',
  label: T.Periodic,
  type: INPUT_TYPES.SWITCH,
  validation: lazy((_, { context }) =>
    boolean().default(
      () => !!(context?.[DAYS_FIELD.name] || context?.[REPEAT_FIELD.name])
    )
  ),
  grid: { md: 12 },
}

/** @type {Field} Time field */
const TIME_FIELD = {
  name: 'TIME',
  label: T.Time,
  type: INPUT_TYPES.TIME,
  validation: lazy(() =>
    date()
      .min(getNow().toJSDate())
      .required()
      .transform(parseDateString)
      .afterSubmit(dateToMilliseconds)
  ),
  fieldProps: {
    defaultValue: getTomorrowAtMidnight(),
    minDateTime: getNow(),
  },
}

// --------------------------------------------------------
// Repeat fields
// --------------------------------------------------------

/** @type {Field} Granularity of action */
const REPEAT_FIELD = {
  name: 'REPEAT',
  label: T.GranularityOfAction,
  type: INPUT_TYPES.SELECT,
  dependOf: PERIODIC_FIELD.name,
  htmlType: (isPeriodic) => (!isPeriodic ? INPUT_TYPES.HIDDEN : undefined),
  values: arrayToOptions(Object.keys(REPEAT_VALUES), {
    addEmpty: false,
    getText: (key) => sentenceCase(key),
    getValue: (key) => REPEAT_VALUES[key],
  }),
  validation: string()
    .trim()
    .required()
    .default(() => REPEAT_VALUES.WEEKLY)
    .when(PERIODIC_FIELD.name, {
      is: false,
      then: (schema) => schema.strip().notRequired(),
    }),
}

/** @type {Field} Weekly field */
const WEEKLY_FIELD = {
  name: 'WEEKLY',
  dependOf: [REPEAT_FIELD.name, PERIODIC_FIELD.name],
  type: INPUT_TYPES.SELECT,
  multiple: true,
  label: T.DayOfWeek,
  values: arrayToOptions(DAYS_OF_WEEK, {
    addEmpty: false,
    getValue: (_, index) => String(index),
  }),
  htmlType: ([repeatType, isPeriodic] = []) =>
    (!isPeriodic || repeatType !== REPEAT_VALUES.WEEKLY) && INPUT_TYPES.HIDDEN,
  validation: lazy((_, { context }) =>
    array(string())
      .required(T.DaysBetween0_6)
      .min(1)
      .default(() => context?.[DAYS_FIELD.name]?.split?.(',') ?? [])
      .when([PERIODIC_FIELD.name, REPEAT_FIELD.name], {
        is: (isPeriodic, repeatType) =>
          !isPeriodic || repeatType !== REPEAT_VALUES.WEEKLY,
        then: (schema) => schema.strip().notRequired(),
      })
      .afterSubmit((value) => value?.join?.(','))
  ),
}

/** @type {Field} Monthly field */
const MONTHLY_FIELD = {
  name: 'MONTHLY',
  dependOf: [REPEAT_FIELD.name, PERIODIC_FIELD.name],
  type: INPUT_TYPES.TEXT,
  label: T.DayOfMonth,
  htmlType: ([repeatType, isPeriodic] = []) =>
    (!isPeriodic || repeatType !== REPEAT_VALUES.MONTHLY) && INPUT_TYPES.HIDDEN,
  validation: lazy((_, { context }) =>
    string()
      .trim()
      .matches(MONTH_DAYS_REG, { message: T.DaysBetween1_31 })
      .required()
      .default(() => context?.[DAYS_FIELD.name])
      .when([PERIODIC_FIELD.name, REPEAT_FIELD.name], {
        is: (isPeriodic, repeatType) =>
          !isPeriodic || repeatType !== REPEAT_VALUES.MONTHLY,
        then: (schema) => schema.strip().notRequired(),
      })
  ),
}

/** @type {Field} Yearly field */
const YEARLY_FIELD = {
  name: 'YEARLY',
  dependOf: [REPEAT_FIELD.name, PERIODIC_FIELD.name],
  type: INPUT_TYPES.TEXT,
  label: T.DayOfYear,
  htmlType: ([repeatType, isPeriodic] = []) =>
    (!isPeriodic || repeatType !== REPEAT_VALUES.YEARLY) && INPUT_TYPES.HIDDEN,
  validation: lazy((_, { context }) =>
    string()
      .trim()
      .matches(YEAR_DAYS_REG, { message: T.DaysBetween0_365 })
      .required()
      .default(() => context?.[DAYS_FIELD.name])
      .when([PERIODIC_FIELD.name, REPEAT_FIELD.name], {
        is: (isPeriodic, repeatType) =>
          !isPeriodic || repeatType !== REPEAT_VALUES.YEARLY,
        then: (schema) => schema.strip().notRequired(),
      })
  ),
}

/** @type {Field} Hourly field */
const HOURLY_FIELD = {
  name: 'HOURLY',
  dependOf: [REPEAT_FIELD.name, PERIODIC_FIELD.name],
  type: INPUT_TYPES.TEXT,
  label: T.EachXHours,
  htmlType: ([repeatType, isPeriodic] = []) =>
    !isPeriodic || repeatType !== REPEAT_VALUES.HOURLY
      ? INPUT_TYPES.HIDDEN
      : 'number',
  validation: lazy((_, { context }) =>
    number()
      .min(0)
      .max(168)
      .integer()
      .required()
      .default(() => context?.[DAYS_FIELD.name])
      .when([PERIODIC_FIELD.name, REPEAT_FIELD.name], {
        is: (isPeriodic, repeatType) =>
          !isPeriodic || repeatType !== REPEAT_VALUES.HOURLY,
        then: (schema) => schema.strip().notRequired(),
      })
      .afterSubmit((value) => `${value}`)
  ),
  fieldProps: { min: 0, max: 168, step: 1 },
}

/**
 * This field is only used to transform the number of the days that
 * the users wants execute the action: weekly, monthly, yearly or hourly
 *
 * ** Depends of {@link PERIODIC_FIELD} and {@link REPEAT_FIELD} fields **
 *
 * @type {Field} Days field
 */
const DAYS_FIELD = {
  name: 'DAYS',
  validation: string().afterSubmit((_, { parent }) => {
    const isPeriodic = !!parent?.[PERIODIC_FIELD.name]
    const repeatType = parent?.[REPEAT_FIELD.name]

    if (!isPeriodic) return undefined

    const { WEEKLY, MONTHLY, YEARLY, HOURLY } = REPEAT_VALUES

    return {
      [WEEKLY]: parent?.[WEEKLY_FIELD.name],
      [MONTHLY]: parent?.[MONTHLY_FIELD.name],
      [YEARLY]: parent?.[YEARLY_FIELD.name],
      [HOURLY]: parent?.[HOURLY_FIELD.name],
    }[repeatType]
  }),
}

// --------------------------------------------------------
// End fields
// --------------------------------------------------------

/** @type {Field} End type field */
const END_TYPE_FIELD = {
  name: 'END_TYPE',
  label: T.EndType,
  type: INPUT_TYPES.SELECT,
  dependOf: PERIODIC_FIELD.name,
  htmlType: (isPeriodic) => !isPeriodic && INPUT_TYPES.HIDDEN,
  values: arrayToOptions(Object.keys(END_TYPE_VALUES), {
    addEmpty: false,
    getText: (value) => sentenceCase(value),
    getValue: (value) => END_TYPE_VALUES[value],
  }),
  validation: string()
    .trim()
    .required()
    .default(() => END_TYPE_VALUES.NEVER)
    .when(PERIODIC_FIELD.name, {
      is: false,
      then: (schema) => schema.strip().notRequired(),
    }),
}

/** @type {Field} End value field */
const END_VALUE_FIELD = {
  name: 'END_VALUE',
  label: T.WhenYouWantThatTheActionFinishes,
  dependOf: [PERIODIC_FIELD.name, END_TYPE_FIELD.name],
  type: ([_, endType] = []) =>
    endType === END_TYPE_VALUES.DATE ? INPUT_TYPES.TIME : INPUT_TYPES.TEXT,
  htmlType: ([isPeriodic, endType] = []) =>
    !isPeriodic || endType === END_TYPE_VALUES.NEVER
      ? INPUT_TYPES.HIDDEN
      : 'number',
  validation: mixed().when(
    END_TYPE_FIELD.name,
    (endType) =>
      ({
        [END_TYPE_VALUES.NEVER]: string().strip(),
        [END_TYPE_VALUES.REPETITION]: number().required().min(1).default(1),
        [END_TYPE_VALUES.DATE]: lazy(() =>
          date()
            .min(ref(TIME_FIELD.name))
            .required()
            .transform(parseDateString)
            .afterSubmit(dateToMilliseconds)
        ),
      }[endType])
  ),
  fieldProps: ([_, endType] = []) =>
    endType === END_TYPE_VALUES.DATE && { defaultValue: getNextWeek() },
}

// --------------------------------------------------------
// Relative fields
// --------------------------------------------------------

/** @type {Field} Relative time field */
export const RELATIVE_TIME_FIELD = {
  name: 'TIME',
  label: T.TimeAfterTheVmIsInstantiated,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .required()
    .positive()
    .transform((value, originalValue) =>
      isRelative(originalValue)
        ? getPeriodicityByTimeInSeconds(originalValue)?.time
        : value
    ),
}

/** @type {Field} Periodicity type field */
export const PERIOD_FIELD = {
  name: 'PERIOD',
  label: T.PeriodType,
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(Object.keys(PERIOD_TYPES), {
    addEmpty: false,
    getText: (key) => sentenceCase(key),
    getValue: (key) => PERIOD_TYPES[key],
  }),
  validation: lazy((_, { context }) =>
    string()
      .trim()
      .required()
      .default(
        () =>
          getPeriodicityByTimeInSeconds(context?.[TIME_FIELD.name])?.period ??
          PERIOD_TYPES.YEARS
      )
  ),
}

/**
 * Filters the types to discard absolute times.
 *
 * @see {@linkplain https://github.com/OpenNebula/one/issues/5673 Waiting support from scheduler}
 * @type {Field} End types available to relative actions
 */
const END_TYPE_FIELD_WITHOUT_DATE = {
  ...END_TYPE_FIELD,
  values: END_TYPE_FIELD.values.filter(
    ({ value }) => value !== END_TYPE_VALUES.DATE
  ),
}

// --------------------------------------------------------
// Export
// --------------------------------------------------------

export const RELATIVE_FIELDS = {
  RELATIVE_TIME_FIELD,
  PERIOD_FIELD,
  END_TYPE_FIELD_WITHOUT_DATE,
}

export const PUNCTUAL_FIELDS = {
  ACTION_FIELD,
  ACTION_FIELD_FOR_CHARTERS,
  TIME_FIELD,
  ARGS_NAME_FIELD,
  ARGS_DISK_ID_FIELD,
  ARGS_SNAPSHOT_ID_FIELD,
  PERIODIC_FIELD,
  REPEAT_FIELD,
  WEEKLY_FIELD,
  MONTHLY_FIELD,
  YEARLY_FIELD,
  HOURLY_FIELD,
  DAYS_FIELD,
  END_TYPE_FIELD,
  END_VALUE_FIELD,
}
