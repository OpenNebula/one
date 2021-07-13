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

import { DateTime } from 'luxon'

/**
 * This converts the boolean value into a string.
 *
 * @param {boolean} bool - Boolean value.
 * @returns {'Yes'|'No'} - If true return 'Yes', in other cases, return 'No'.
 */
export const booleanToString = bool => bool ? 'Yes' : 'No'

/**
 * This converts the string value into a boolean.
 *
 * @param {string} str - String value.
 * @returns {boolean} - If str is "yes" or 1 then returns true,
 * in other cases, return false.
 */
export const stringToBoolean = str =>
  String(str).toLowerCase() === 'yes' || +str === 1

/**
 * This converts the time values to string.
 *
 * @param {number|string} time - Time to convert.
 * @returns {string} - Time string.
 */
export const timeToString = time =>
  +time ? new Date(+time * 1000).toLocaleString() : '-'

/**
 * This function converts the given time into DateTime.
 *
 * @param {number|string} time - Time to convert
 * @returns {DateTime} - Datetime object.
 */
export const timeFromMilliseconds = time =>
  DateTime.fromMillis(+time * 1000)

/**
 * This function converts the lock level to its string value.
 *
 * @param {number} level - Level code number.
 * @returns {string} - Lock level text.
 */
export const levelLockToString = level => ({
  0: 'None',
  1: 'Use',
  2: 'Manage',
  3: 'Admin',
  4: 'All'
}[level] || '-')

/**
 * This function gets the permission string given the
 * owner, group and owner permissions strings.
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
 * @returns {string} - Permissions string.
 */
export const permissionsToOctal = permissions => {
  const {
    OWNER_U, OWNER_M, OWNER_A,
    GROUP_U, GROUP_M, GROUP_A,
    OTHER_U, OTHER_M, OTHER_A
  } = permissions

  /**
   * This function will return the permission numeric code.
   *
   * @param {string[]} props - Array with Use, Manage and Access
   * permissions.
   * @param {('YES'|'NO')} props.0 - Is use permission allowed?
   * @param {('YES'|'NO')} props.1 - Is manage permission allowed?
   * @param {('YES'|'NO')} props.2 - Is access permission allowed?
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
 * This returns the resource available actions.
 *
 * @param {object} actions - Actions from view yaml
 * @param {string} [hypervisor] - Resource hypervisor
 * @returns {string[]} - List of actions available for the resource
 */
export const getActionsAvailable = (actions = {}, hypervisor = '') =>
  Object.entries(actions)
    .filter(([_, action]) => {
      if (typeof action === 'boolean') return !!action

      const { enabled = false, not_on: notOn = [] } = action || {}

      return !!enabled && !notOn?.includes?.(hypervisor)
    })
    .map(([actionName, _]) => actionName)
