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
import { isDate, timeToString } from 'client/models/Helper'
import { Tr } from 'client/components/HOC'
import { T, VM_ACTIONS } from 'client/constants'

const {
  SNAPSHOT_DISK_CREATE,
  SNAPSHOT_DISK_REVERT,
  SNAPSHOT_DISK_DELETE,
  SNAPSHOT_CREATE,
  SNAPSHOT_REVERT,
  SNAPSHOT_DELETE,
} = VM_ACTIONS

/**
 * @typedef ScheduledAction
 * @property {string} ACTION - Action to execute
 * @property {string} ID - Id
 * @property {string} TIME - Time
 * @property {string} [WARNING] - Warning time
 * @property {string} [ARGS] - Arguments separated by comma
 * @property {string} [DAYS] - Days that the users wants execute the action.
 * List separated by comma. Depend of REPEAT:
 * - weekly: 0 (Sunday) to 6 (Saturday)
 * - monthly: 1 to 31
 * - yearly: 1 to 365
 * - hourly: each ‘x’ hours
 * @property {'0'|'1'|'2'} [END_TYPE] - Way to end the repetition. Can be:
 * - never: 0
 * - repetition: 1
 * - date: 2
 * @property {string} [END_VALUE] - End value
 * @property {'0'|'1'|'2'|'3'} [REPEAT] - Type of repetition. Can be:
 * - weekly: '0',
 * - monthly: '1',
 * - yearly: '2',
 * - hourly: '3',
 */

/**
 * @typedef CharterOptions
 * @property {boolean} [edit] - If `true`, the charter can be edited in form
 * @property {number|string} execute_after_days - Days to execute the action
 * @property {number|string} warn_before_days - Alert a time before the action (in days)
 */

/** @enum {string} Values to end an action */
export const END_TYPE_VALUES = {
  NEVER: '0',
  REPETITION: '1',
  DATE: '2',
}

/** @enum {string} Values to repeat an action */
export const REPEAT_VALUES = {
  WEEKLY: '0',
  MONTHLY: '1',
  YEARLY: '2',
  HOURLY: '3',
}

/** @enum {string} Argument attributes */
export const ARGS_TYPES = {
  DISK_ID: 'DISK_ID',
  NAME: 'NAME',
  SNAPSHOT_ID: 'SNAPSHOT_ID',
}

/** @enum {string} Period type */
export const PERIOD_TYPES = {
  YEARS: 'years',
  MONTHS: 'months',
  WEEKS: 'weeks',
  DAYS: 'days',
  HOURS: 'hours',
  MINUTES: 'minutes',
}

/**
 * Checks if time is relative.
 *
 * @param {string} time - Time to check
 * @returns {boolean} Returns `true` if time contains plus or minus signs
 */
export const isRelative = (time) =>
  !isDate(time) && (String(time).includes('+') || String(time).includes('-'))

/**
 * Filters leases to get only those that cannot be edited.
 *
 * @param {[VM_ACTIONS, CharterOptions]} leases - Leases from configuration yaml
 * @returns {[VM_ACTIONS, CharterOptions]} Fixed leases
 */
export const getFixedLeases = (leases) =>
  leases?.filter(([_, { edit } = {}]) => !edit)

/**
 * Filters leases to get only those that can be edited.
 *
 * @param {[VM_ACTIONS, CharterOptions]} leases - Leases from configuration yaml
 * @returns {[VM_ACTIONS, CharterOptions]} Editable leases
 */
export const getEditableLeases = (leases) =>
  leases?.filter(([_, { edit } = {}]) => !!edit)

/**
 * Returns the periodicity of time in seconds.
 *
 * @param {number} seconds - Time in seconds
 * @returns {{ period: PERIOD_TYPES, time: number }} - Periodicity and time
 */
export const getPeriodicityByTimeInSeconds = (seconds) => {
  const allPeriods = {
    [PERIOD_TYPES.YEARS]: seconds / 365 / 24 / 3600,
    [PERIOD_TYPES.MONTHS]: seconds / 30 / 24 / 3600,
    [PERIOD_TYPES.WEEKS]: seconds / 7 / 24 / 3600,
    [PERIOD_TYPES.DAYS]: seconds / 24 / 3600,
    [PERIOD_TYPES.HOURS]: seconds / 3600,
    [PERIOD_TYPES.MINUTES]: seconds / 60,
  }

  const [period, time] = Object.entries(allPeriods).find(
    ([_, value]) => value >= 1
  )

  return { period, time }
}

/**
 * Transform period time to seconds.
 *
 * @param {PERIOD_TYPES} period - Periodicity
 * @param {number} time - Time in period format
 * @returns {number} Time in seconds
 */
export const timeToSecondsByPeriodicity = (period, time) =>
  ({
    [PERIOD_TYPES.YEARS]: time * 365 * 24 * 3600,
    [PERIOD_TYPES.MONTHS]: time * 30 * 24 * 3600,
    [PERIOD_TYPES.WEEKS]: time * 7 * 24 * 3600,
    [PERIOD_TYPES.DAYS]: time * 24 * 3600,
    [PERIOD_TYPES.HOURS]: time * 3600,
    [PERIOD_TYPES.MINUTES]: time * 60,
  }[period])

/**
 * Returns information about the repetition of an action: periodicity and the end.
 *
 * @param {ScheduledAction} action - Schedule action
 * @returns {{repeat: string|string[], end: string}} - Periodicity of the action.
 */
export const getRepeatInformation = (action) => {
  const { REPEAT, DAYS = '', END_TYPE, END_VALUE = '' } = action ?? {}

  const daysOfWeek = [T.Sun, T.Mon, T.Tue, T.Wed, T.Thu, T.Fri, T.Sat]
  const days = DAYS?.split(',')?.map((day) => Tr(daysOfWeek[day])) ?? []

  const repeat = {
    0: `${Tr(T.Weekly)} ${days.join(',')}`,
    1: `${Tr(T.Monthly)} ${DAYS}`,
    2: `${Tr(T.Yearly)} ${DAYS}`,
    3: Tr([T.EachHours, DAYS]),
  }[+REPEAT]

  const end = {
    0: Tr(T.None),
    1: Tr([T.AfterTimes, END_VALUE]),
    2: `${Tr(T.On)} ${timeToString(END_VALUE)}`,
  }[+END_TYPE]

  return { repeat, end }
}

/**
 * Returns the arguments that action needs to execute.
 *
 * @param {string} action - Action will be executed
 * @returns {ARGS_TYPES[]} Arguments
 */
export const getRequiredArgsByAction = (action) => {
  const { DISK_ID, NAME, SNAPSHOT_ID } = ARGS_TYPES

  return (
    {
      [SNAPSHOT_DISK_CREATE]: [DISK_ID, NAME],
      [SNAPSHOT_DISK_REVERT]: [DISK_ID, SNAPSHOT_ID],
      [SNAPSHOT_DISK_DELETE]: [DISK_ID, SNAPSHOT_ID],
      [SNAPSHOT_CREATE]: [NAME],
      [SNAPSHOT_REVERT]: [SNAPSHOT_ID],
      [SNAPSHOT_DELETE]: [SNAPSHOT_ID],
    }[action] ?? []
  )
}

/**
 * Transforms the arguments from the scheduled action to object.
 *
 * @param {scheduledAction} [scheduledAction] - Schedule action
 * @returns {object} Arguments in object format
 */
export const transformStringToArgsObject = ({ ACTION, ARGS = {} } = {}) => {
  if (typeof ARGS !== 'string') return ARGS

  // IMPORTANT - String data from ARGS has strict order: DISK_ID, NAME, SNAPSHOT_ID
  const [arg1, arg2] = ARGS.split(',')
  const { DISK_ID, NAME, SNAPSHOT_ID } = ARGS_TYPES

  return (
    {
      [SNAPSHOT_DISK_CREATE]: { [DISK_ID]: arg1, [NAME]: arg2 },
      [SNAPSHOT_DISK_REVERT]: { [DISK_ID]: arg1, [SNAPSHOT_ID]: arg2 },
      [SNAPSHOT_DISK_DELETE]: { [DISK_ID]: arg1, [SNAPSHOT_ID]: arg2 },
      [SNAPSHOT_CREATE]: { [NAME]: arg1 },
      [SNAPSHOT_REVERT]: { [SNAPSHOT_ID]: arg1 },
      [SNAPSHOT_DELETE]: { [SNAPSHOT_ID]: arg1 },
    }[ACTION] ?? {}
  )
}

/**
 * Returns the period type and time value from a charter options.
 *
 * @param {CharterOptions} options - Charter options
 * @param {string} prefix - Prefix of period type
 * @returns {[number, PERIOD_TYPES]} - Period type and time value
 * @example ({ after_days: 5 }, 'after_') //=> [5, days]
 * @example ({ before_hours: 16 }, 'before_') //=> [16, hours]
 */
const getTimeAndPeriodTypeFromCharter = (options, prefix) => {
  const periodType = Object.values(PERIOD_TYPES).find(
    (type) => options[`${prefix}${type}`]
  )

  return [options[`${prefix}${periodType}`], periodType]
}

/**
 * Transforms charter to schedule action.
 *
 * @param {[string, CharterOptions][]} charters - Charters from configuration yaml
 * @param {boolean} relative - If `true`, returns times in relative format
 * @returns {ScheduledAction[]} - Scheduled action
 */
export const transformChartersToSchedActions = (charters, relative = false) => {
  const now = Math.round(Date.now() / 1000)

  return charters?.map(([action, options = {}] = []) => {
    const [time, timePeriodType] = getTimeAndPeriodTypeFromCharter(
      options,
      'execute_after_'
    )

    const [warn, warnPeriodType] = getTimeAndPeriodTypeFromCharter(
      options,
      'warn_before_'
    )

    return relative
      ? {
          ACTION: action,
          TIME: time,
          WARNING: warn,
          PERIOD: timePeriodType,
          WARNING_PERIOD: warnPeriodType,
        }
      : {
          ACTION: action,
          TIME: now + timeToSecondsByPeriodicity(timePeriodType, time),
          WARNING: now + timeToSecondsByPeriodicity(warnPeriodType, warn),
        }
  })
}
