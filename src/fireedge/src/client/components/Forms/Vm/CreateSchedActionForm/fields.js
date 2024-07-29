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
import { DateTime } from 'luxon'
import { array, date, lazy, mixed, number, ref, string } from 'yup'

import {
  ARGS_TYPES,
  END_TYPE_VALUES,
  INPUT_TYPES,
  PERIOD_TYPES,
  REPEAT_VALUES,
  SCHEDULE_TYPE,
  T,
  TEMPLATE_SCHEDULE_TYPE_STRING,
  VM_ACTIONS_IN_CHARTER,
  VM_ACTIONS_WITH_SCHEDULE,
  VM_ACTIONS_WITH_SCHEDULE_INTANTIATED,
  VM_SCHEDULE_TYPE_STRING,
} from 'client/constants'
import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'
import {
  dateToMilliseconds,
  isDate,
  timeFromMilliseconds,
} from 'client/models/Helper'
import {
  getPeriodicityByTimeInSeconds,
  getRequiredArgsByAction,
  isRelative,
} from 'client/models/Scheduler'
import { getDisks, getSnapshotList } from 'client/models/VirtualMachine'
import { Field, arrayToOptions, prettyBytes, sentenceCase } from 'client/utils'

// --------------------------------------------------------
// Constants
// --------------------------------------------------------

const PERIODIC_FIELD_NAME = 'PERIODIC'

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
export const ACTION_FIELD_NAME = 'ACTION'
export const ACTION_FIELD_VALIDATION = string().trim().required()

const createArgField = (argName) => ({
  name: `ARGS.${argName}`,
  dependOf: ACTION_FIELD_NAME,
  htmlType: (action) =>
    !getRequiredArgsByAction(action)?.includes(argName) && INPUT_TYPES.HIDDEN,
})

/**
 * @param {object} vm - Vm resource
 * @returns {Field} Action name field
 */
const ACTION_FIELD = (vm) => ({
  name: ACTION_FIELD_NAME,
  label: T.Action,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(
    Object.entries({
      ...VM_ACTIONS_WITH_SCHEDULE,
      ...(vm?.ID && VM_ACTIONS_WITH_SCHEDULE_INTANTIATED),
    }),
    {
      addEmpty: false,
      getText: ([, text]) => text,
      getValue: ([value]) => value,
    }
  ),
  validation: ACTION_FIELD_VALIDATION,
  grid: { xs: 12 },
})

/** @type {Field} Action name field */
const ACTION_FIELD_FOR_CHARTERS = {
  ...ACTION_FIELD(),
  values: arrayToOptions(VM_ACTIONS_IN_CHARTER, {
    addEmpty: false,
    getText: (action) => sentenceCase(action),
  }),
}

/**
 * @returns {Field} Datastore id field
 */
const ARGS_DS_ID_FIELD = {
  ...createArgField(ARGS_TYPES.DS_ID),
  label: T.BackupDatastore,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () => {
    const { data: datastores = [] } = useGetDatastoresQuery()

    return arrayToOptions(
      datastores.filter(({ TEMPLATE }) => TEMPLATE.TYPE === 'BACKUP_DS'),
      {
        getText: ({ NAME, ID } = {}) => `${ID}: ${NAME}`,
        getValue: ({ ID } = {}) => ID,
      }
    )
  },
}

/**
 * @param {object} vm - Vm resource
 * @returns {Field} Disk id field
 */
const ARGS_DISK_ID_FIELD = (vm) => ({
  ...createArgField(ARGS_TYPES.DISK_ID),
  label: T.Disk,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(getDisks(vm), {
    getText: ({ IMAGE_ID, IMAGE, TARGET, SIZE } = {}) => {
      const isVolatile = !IMAGE && !IMAGE_ID
      const diskImage = isVolatile
        ? `${T.Volatile} (${prettyBytes(SIZE, 'MB')})`
        : IMAGE

      return `${diskImage}: ${TARGET}`
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
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(getSnapshotList(vm), {
    getText: ({ NAME } = {}) => NAME,
    getValue: ({ SNAPSHOT_ID } = {}) => SNAPSHOT_ID,
  }),
})

/** @type {Field} Periodic field */
const PERIODIC_FIELD = (isVM = false) => ({
  name: PERIODIC_FIELD_NAME,
  label: T.ScheduleActionType,
  type: INPUT_TYPES.TOGGLE,
  values: () => {
    const periodicValues = isVM
      ? VM_SCHEDULE_TYPE_STRING
      : TEMPLATE_SCHEDULE_TYPE_STRING

    const periodicTypes = arrayToOptions(Object.keys(periodicValues), {
      addEmpty: false,
      getText: (key) => periodicValues[key],
      getValue: (key) => key,
    })

    return periodicTypes
  },
  validation: string()
    .trim()
    .required()
    .default(() => SCHEDULE_TYPE.ONETIME),
  grid: { md: 12 },
  notNull: true,
})
// --------------------------------------------------------
// One time fields
// --------------------------------------------------------

/** @type {Field} Time field */
const TIME_FIELD = {
  name: 'TIME',
  label: (typeAction) =>
    typeAction === SCHEDULE_TYPE.PERIODIC ? T.StartTime : T.Time,
  type: INPUT_TYPES.TIME,
  dependOf: PERIODIC_FIELD_NAME,
  htmlType: (typeAction) =>
    typeAction === SCHEDULE_TYPE.RELATIVE && INPUT_TYPES.HIDDEN,
  validation: date()
    .min(getNow().toJSDate())
    .transform(parseDateString)
    .afterSubmit(dateToMilliseconds)
    .default(() => getTomorrowAtMidnight())
    .when(PERIODIC_FIELD_NAME, (typeAction, schema) =>
      typeAction !== SCHEDULE_TYPE.RELATIVE ? schema.required() : schema
    ),
  fieldProps: {
    minDateTime: getNow(),
  },
}
// --------------------------------------------------------
// Periodic fields
// --------------------------------------------------------

/** @type {Field} Granularity of action */
const REPEAT_FIELD = {
  name: 'REPEAT',
  label: T.GranularityOfAction,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.keys(REPEAT_VALUES), {
    addEmpty: true,
    getText: (key) => sentenceCase(key),
    getValue: (key) => REPEAT_VALUES[key],
  }),
  dependOf: PERIODIC_FIELD_NAME,
  htmlType: (typeAction) =>
    typeAction !== SCHEDULE_TYPE.PERIODIC && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .when(PERIODIC_FIELD_NAME, (typeAction, schema) =>
      typeAction === TEMPLATE_SCHEDULE_TYPE_STRING.PERIODIC
        ? schema.required()
        : schema
    ),
  grid: { md: 6 },
  notNull: true,
}

/** @type {Field} Weekly field */
const WEEKLY_FIELD = {
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
      .min(1)
      .default(() => context?.[DAYS_FIELD.name]?.split?.(',') ?? [])
      .when(REPEAT_FIELD.name, (repeatType, schema) =>
        repeatType !== REPEAT_VALUES.WEEKLY
          ? schema.strip()
          : schema.required(T.DaysBetween0_6)
      )
      .afterSubmit((value) => value?.join?.(','))
  ),
  grid: { md: 6 },
}

/** @type {Field} Monthly field */
const MONTHLY_FIELD = {
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
  grid: { md: 6 },
  validation: lazy((_, { context }) =>
    string()
      .trim()
      .matches(MONTH_DAYS_REG, { message: T.DaysBetween1_31 })
      .default(() => context?.[DAYS_FIELD.name])
      .when(REPEAT_FIELD.name, (repeatType, schema) =>
        repeatType !== REPEAT_VALUES.MONTHLY
          ? schema.strip()
          : schema.required()
      )
  ),
}

/** @type {Field} Yearly field */
const YEARLY_FIELD = {
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
  grid: { md: 6 },
  validation: lazy((_, { context }) =>
    string()
      .trim()
      .matches(YEAR_DAYS_REG, { message: T.DaysBetween0_365 })
      .default(() => context?.[DAYS_FIELD.name])
      .when(REPEAT_FIELD.name, (repeatType, schema) =>
        repeatType !== REPEAT_VALUES.YEARLY ? schema.strip() : schema.required()
      )
  ),
}

/** @type {Field} Hourly field */
const HOURLY_FIELD = {
  name: 'HOURLY',
  dependOf: [PERIODIC_FIELD_NAME, REPEAT_FIELD.name],
  type: INPUT_TYPES.TEXT,
  label: T.EachXHours,
  grid: { md: 6 },
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
      .min(0)
      .max(168)
      .integer()
      .default(() => context?.[DAYS_FIELD.name])
      .when(REPEAT_FIELD.name, (repeatType, schema) =>
        repeatType !== REPEAT_VALUES.HOURLY ? schema.strip() : schema.required()
      )
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
  validation: mixed()
    .notRequired()
    .transform((value, _originalValue, context) => {
      const isPeriodic = !!context?.parent?.[PERIODIC_FIELD_NAME]
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

// --------------------------------------------------------
// End fields
// --------------------------------------------------------

/** @type {Field} End type field */
const END_TYPE_FIELD = {
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
}

/** @type {Field} End value field */
const END_VALUE_FIELD = {
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
  htmlType: (_, context) => {
    const values = context?.getValues() || {}

    return values?.PERIODIC === SCHEDULE_TYPE.PERIODIC &&
      values?.END_TYPE !== END_TYPE_VALUES.NEVER
      ? 'number'
      : INPUT_TYPES.HIDDEN
  },
  validation: mixed().when(
    [PERIODIC_FIELD_NAME, END_TYPE_FIELD.name],
    (typeAction, endType) => {
      if (typeAction === SCHEDULE_TYPE.PERIODIC) {
        return {
          [END_TYPE_VALUES.NEVER]: string().strip(),
          [END_TYPE_VALUES.REPETITION]: number().required().min(1),
          [END_TYPE_VALUES.DATE]: date()
            .min(ref(TIME_FIELD.name))
            .required()
            .transform(parseDateString)
            .afterSubmit(dateToMilliseconds),
        }[endType]
      } else {
        return string().trim().notRequired()
      }
    }
  ),
  fieldProps: ([_, endType] = []) =>
    endType === END_TYPE_VALUES.DATE && { defaultValue: getNextWeek() },
}

// --------------------------------------------------------
// Relative fields
// --------------------------------------------------------

/** @type {Field} Relative time field */
export const RELATIVE_TIME_FIELD = {
  name: 'RELATIVE_TIME',
  label: T.TimeAfterTheVmIsInstantiated,
  type: INPUT_TYPES.TEXT,
  dependOf: PERIODIC_FIELD_NAME,
  htmlType: (typeAction) =>
    typeAction === SCHEDULE_TYPE.RELATIVE ? 'number' : INPUT_TYPES.HIDDEN,
  validation: number()
    .positive()
    .transform((value, originalValue) =>
      isRelative(originalValue)
        ? getPeriodicityByTimeInSeconds(originalValue)?.time
        : value
    )
    .when(PERIODIC_FIELD_NAME, (typeAction, schema) =>
      typeAction === SCHEDULE_TYPE.RELATIVE ? schema.required() : schema
    ),
}

/** @type {Field} Periodicity type field */
export const PERIOD_FIELD = {
  name: 'PERIOD',
  label: T.PeriodType,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: PERIODIC_FIELD_NAME,
  htmlType: (typeAction) =>
    typeAction !== SCHEDULE_TYPE.RELATIVE && INPUT_TYPES.HIDDEN,
  values: arrayToOptions(Object.keys(PERIOD_TYPES), {
    addEmpty: false,
    getText: (key) => PERIOD_TYPES[key],
    getValue: (key) => PERIOD_TYPES[key],
  }),
  validation: lazy((_, { context }) =>
    string()
      .trim()
      .default(
        () =>
          getPeriodicityByTimeInSeconds(context?.[TIME_FIELD.name])?.period ??
          PERIOD_TYPES.YEARS
      )
      .when(PERIODIC_FIELD_NAME, (typeAction, schema) =>
        typeAction === SCHEDULE_TYPE.RELATIVE
          ? schema.required()
          : schema.strip()
      )
  ),
}

// --------------------------------------------------------
// Export
// --------------------------------------------------------

export const RELATIVE_FIELDS = {
  RELATIVE_TIME_FIELD,
  PERIOD_FIELD,
  END_TYPE_FIELD,
}

export const PUNCTUAL_FIELDS = {
  ACTION_FIELD,
  ACTION_FIELD_FOR_CHARTERS,
  TIME_FIELD,
  ARGS_NAME_FIELD,
  ARGS_DISK_ID_FIELD,
  ARGS_SNAPSHOT_ID_FIELD,
  ARGS_DS_ID_FIELD,
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
