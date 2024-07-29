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
import { T } from 'client/constants'

/**
 * @typedef ScheduleAction
 * @property {string} ACTION - Action to execute
 * @property {string} ID - Id
 * @property {string} TIME - Time
 * @property {string} [WARNING] - Warning time
 * @property {string} [ARGS] - Arguments separated by comma
 * @property {string} [DAYS] - Days that the users wants execute the action.
 * List separated by comma. Depend of {@link REPEAT}:
 * - weekly: 0 (Sunday) to 6 (Saturday)
 * - monthly: 1 to 31
 * - yearly: 1 to 365
 * - hourly: each ‘x’ hours
 * @property {'0'|'1'|'2'} [END_TYPE] - Way to end the repetition:
 * - `0`: never
 * - `1`: repetition
 * - `2`: date
 * @property {string} [END_VALUE] - End value
 * @property {'0'|'1'|'2'|'3'} [REPEAT] - Type of repetition:
 * - `0`: weekly
 * - `1`: monthly
 * - `2`: yearly
 * - `3`: hourly
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
  DAILY: '-1',
  WEEKLY: '0',
  MONTHLY: '1',
  YEARLY: '2',
  HOURLY: '3',
}

/** {string} All days string */
export const ALL_DAYS = '0,1,2,3,4,5,6'

/** @enum {string} Argument attributes */
export const ARGS_TYPES = {
  DISK_ID: 'DISK_ID',
  NAME: 'NAME',
  SNAPSHOT_ID: 'SNAPSHOT_ID',
  DS_ID: 'DS_ID',
}

/** @enum {string} Period type */
export const PERIOD_TYPES = {
  YEARS: T.Years,
  MONTHS: T.Months,
  WEEKS: T.Weeks,
  DAYS: T.Days,
  HOURS: T.Hours,
  MINUTES: T.Minutes,
}

export const SCHEDULE_TYPE = {
  ONETIME: 'ONETIME',
  PERIODIC: 'PERIODIC',
  RELATIVE: 'RELATIVE',
}

/** @enum {string} Schedule type options */
export const TEMPLATE_SCHEDULE_TYPE_STRING = {
  [SCHEDULE_TYPE.ONETIME]: T.OneTimeAction,
  [SCHEDULE_TYPE.PERIODIC]: T.PeriodicAction,
  [SCHEDULE_TYPE.RELATIVE]: T.RelativeAction,
}

/** @enum {string} Schedule type options */
export const VM_SCHEDULE_TYPE_STRING = {
  [SCHEDULE_TYPE.ONETIME]: T.OneTimeAction,
  [SCHEDULE_TYPE.PERIODIC]: T.PeriodicAction,
}
