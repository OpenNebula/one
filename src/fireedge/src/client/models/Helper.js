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

export const booleanToString = bool => bool ? 'Yes' : 'No'

export const stringToBoolean = str =>
  String(str).toLowerCase() === 'yes' || +str === 1

export const timeToString = time =>
  +time ? new Date(+time * 1000).toLocaleString() : '-'

export const timeFromMilliseconds = time =>
  DateTime.fromMillis(+time * 1000)

export const levelLockToString = level => ({
  0: 'None',
  1: 'Use',
  2: 'Manage',
  3: 'Admin',
  4: 'All'
}[level] || '-')

export const permissionsToOctal = permissions => {
  const {
    OWNER_U, OWNER_M, OWNER_A,
    GROUP_U, GROUP_M, GROUP_A,
    OTHER_U, OTHER_M, OTHER_A
  } = permissions

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
 * @param {Object} actions Actions from view yaml
 * @param {String} [hypervisor] Resource hypervisor
 * @returns {String[]} List of actions available for the resource
 */
export const getActionsAvailable = (actions = {}, hypervisor = '') =>
  Object.entries(actions)
    .filter(([_, action]) => {
      if (typeof action === 'boolean') return !!action

      const { enabled = false, not_on: notOn = [] } = action || {}

      return !!enabled && !notOn?.includes?.(hypervisor)
    })
    .map(([actionName, _]) => actionName)
