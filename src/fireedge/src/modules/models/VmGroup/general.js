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
import { VMGROUP_STATES } from '@ConstantsModule'

/**
 * Returns information about VmGroups state.
 *
 * @param {object} VmGroup - VmGroup object
 * @param {number} VmGroup.LOCKED - Defines lock status.
 * @returns {VMGROUP_STATES.StateInfo} - User state object
 */
export const getVmGroupState = ({ LOCKED = '0' } = {}) => VMGROUP_STATES[LOCKED]

/**
 * Normalizes the roles of a VM Group.
 *
 * @param {object} vmGroup - VM Group object
 * @returns {object[]} Normalized roles
 */
export const getVmGroupRoles = (vmGroup = {}) =>
  []
    .concat(vmGroup?.ROLES?.ROLE ?? [])
    .filter((role) => role && typeof role === 'object' && !Array.isArray(role))

/**
 * Returns the total number of roles in a VM Group.
 *
 * @param {object} vmGroup - VM Group object
 * @returns {number} Total roles
 */
export const getVmGroupTotalRoles = (vmGroup = {}) =>
  getVmGroupRoles(vmGroup).length

/**
 * Returns the total number of VMs assigned across all VM Group roles.
 *
 * @param {object} vmGroup - VM Group object
 * @returns {number} Total VMs
 */
export const getVmGroupTotalVms = (vmGroup = {}) =>
  getVmGroupRoles(vmGroup).reduce((total, { VMS } = {}) => {
    if (typeof VMS !== 'string' && typeof VMS !== 'number') return total

    const vmIds = String(VMS)
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)

    return total + vmIds.length
  }, 0)
