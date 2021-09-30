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
import { T } from 'client/constants'
import { DateTime } from 'luxon'
import { j2xParser as Parser } from 'fast-xml-parser'

/**
 * @param {object} json - JSON
 * @param {boolean} [addRoot] - Add ROOT element as parent
 * @returns {string} Xml in string format
 */
export const jsonToXml = (json, addRoot = true) => {
  const parser = new Parser()
  return parser.parse(addRoot ? { ROOT: json } : json)
}

/**
 * Converts the boolean value into a readable format.
 *
 * @param {boolean} bool - Boolean value.
 * @returns {'Yes'|'No'} - If true return 'Yes', in other cases, return 'No'.
 */
export const booleanToString = bool => bool ? T.Yes : T.No

/**
 * Converts the string value into a boolean.
 *
 * @param {string} str - String value.
 * @returns {boolean} - If str is "yes" or 1 then returns true,
 * in other cases, return false.
 */
export const stringToBoolean = str =>
  String(str).toLowerCase() === 'yes' || +str === 1

/**
 * Converts the time values into "mm/dd/yyyy, hh:mm:ss" format.
 *
 * @param {number|string} time - Time to convert.
 * @returns {string} - Time string.
 * @example 02521251251 =>  "4/23/1981, 11:04:41 AM"
 */
export const timeToString = time =>
  +time ? new Date(+time * 1000).toLocaleString() : '-'

/**
 * Converts the given time into DateTime luxon type.
 *
 * @param {number|string} time - Time to convert
 * @returns {DateTime} - DateTime object.
 */
export const timeFromMilliseconds = time =>
  DateTime.fromMillis(+time * 1000)

/**
 * Returns the epoch milliseconds of the date.
 *
 * @param {number|string} date - Date
 * @returns {number} - Total milliseconds.
 */
export const dateToMilliseconds = date =>
  DateTime.fromJSDate(date).toMillis() / 1000

/**
 * Returns the epoch milliseconds of the date.
 *
 * @param {number|string} date - Date
 * @returns {number} - Total milliseconds.
 */
export const isoDateToMilliseconds = date =>
  DateTime.fromISO(date).toMillis() / 1000

/**
 * Get the diff from two times and it converts them
 * into string with format: ``dd hh mm ss``.
 *
 * @param {number|string} start - Time to convert
 * @param {number|string} end - Time to convert
 * @returns {string} - Duration time with format.
 */
export const timeDiff = (start, end) => {
  const startTime = timeFromMilliseconds(start)
  const endTime = timeFromMilliseconds(end)

  const diff = endTime.diff(startTime, ['days', 'hours', 'minutes', 'seconds'])

  const { days, hours, minutes, seconds } = diff.toObject()

  let total = ''
  days > 0 && (total = total.concat(`${days}d `))
  hours > 0 && (total = total.concat(`${hours}h`))
  minutes > 0 && (total = total.concat(`${minutes}m`))

  if (seconds > 0 || !total.length) {
    total = total.concat(`${seconds}s`)
  }

  return total
}

/**
 * Converts the lock level to its string value.
 *
 * @param {number} level - Level code number.
 * @returns {string} - Lock level text.
 */
export const levelLockToString = level => ({
  0: T.None,
  1: T.Use,
  2: T.Manage,
  3: T.Admin,
  4: T.All
}[level] || '-')

/**
 * Transform the permission from OpenNebula template to octal format.
 *
 * @param {object} permissions - Permissions object.
 * @param {('YES'|'NO')} permissions.OWNER_U - Owner use permission.
 * @param {('YES'|'NO')} permissions.OWNER_M - Owner manage permission.
 * @param {('YES'|'NO')} permissions.OWNER_A - Owner access permission.
 * @param {('YES'|'NO')} permissions.GROUP_U - Group use permission.
 * @param {('YES'|'NO')} permissions.GROUP_M - Group manage permission.
 * @param {('YES'|'NO')} permissions.GROUP_A - Group access permission.
 * @param {('YES'|'NO')} permissions.OTHER_U - Other use permission.
 * @param {('YES'|'NO')} permissions.OTHER_M - Other manage permission.
 * @param {('YES'|'NO')} permissions.OTHER_A - Other access permission.
 * @returns {string} - Permissions in octal format.
 */
export const permissionsToOctal = permissions => {
  const {
    OWNER_U, OWNER_M, OWNER_A,
    GROUP_U, GROUP_M, GROUP_A,
    OTHER_U, OTHER_M, OTHER_A
  } = permissions

  /**
   * Returns the permission numeric code.
   *
   * @param {string[]} category - Array with Use, Manage and Access permissions.
   * @param {('YES'|'NO')} category.0 - `true` if use permission is allowed
   * @param {('YES'|'NO')} category.1 - `true` if manage permission is allowed
   * @param {('YES'|'NO')} category.2 - `true` if access permission is allowed
   * @returns {number} Permission code number.
   */
  const getCategoryValue = ([u, m, a]) => (
    (stringToBoolean(u) ? 4 : 0) +
    (stringToBoolean(m) ? 2 : 0) +
    (stringToBoolean(a) ? 1 : 0)
  )

  return [
    [OWNER_U, OWNER_M, OWNER_A],
    [GROUP_U, GROUP_M, GROUP_A],
    [OTHER_U, OTHER_M, OTHER_A]
  ].map(getCategoryValue).join('')
}

/**
 * Returns the resource available actions.
 *
 * @param {object} actions - Actions from view yaml
 * @param {string} [hypervisor] - Resource hypervisor
 * @returns {string[]} - List of actions available for the resource
 */
export const getActionsAvailable = (actions = {}, hypervisor = '') =>
  Object.entries(actions)
    .filter(([_, action]) => {
      if (typeof action === 'boolean') return action

      const { enabled = false, not_on: notOn = [] } = action || {}

      return !!enabled && !notOn?.includes?.(hypervisor)
    })
    .map(([actionName, _]) => actionName)

/**
 *
 * @param {object} list - List of attributes
 * @param {object} options - Filter options
 * @param {object} [options.extra] - List of extra RegExp to filter
 * @param {RegExp} [options.hidden] - RegExp of hidden attributes
 * @returns {{attributes: object}} List of filtered attributes
 */
export const filterAttributes = (list = {}, options = {}) => {
  const { extra = {}, hidden = /^$/ } = options
  const response = {}

  const addAttributeToList = (listName, [attributeName, attributeValue]) => {
    response[listName] = {
      ...response[listName],
      [attributeName]: attributeValue
    }
  }

  Object.entries(list)
    .filter(attribute => {
      const [filterName] = Object.entries(extra)
        .find(([_, regexp]) => attribute[0].match(regexp)) ?? []

      return filterName ? addAttributeToList(filterName, attribute) : true
    })
    .forEach(attribute => {
      !attribute[0].match(hidden) &&
        addAttributeToList('attributes', attribute)
    })

  return response
}
