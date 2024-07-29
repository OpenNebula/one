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
import { isIPv6, isIPv4, isMAC } from 'client/utils'
import {
  VirtualNetwork,
  AddressRange,
  VN_STATES,
  STATES,
  LEASE_STATE,
  VN_ACTIONS_BY_STATE,
} from 'client/constants'

/**
 * Returns the lease state.
 *
 * @param {string} state - Leases
 * @returns {STATES.StateInfo} State information from leases
 */
export const getLeaseState = (state) => LEASE_STATE[state]

/**
 * Returns the state of the virtual network.
 *
 * @param {VirtualNetwork} virtualNetwork - Virtual network
 * @returns {STATES.StateInfo} State information from resource
 */
export const getState = ({ STATE = 0 } = {}) => VN_STATES[+STATE]

/**
 * Returns the Virtual Network Manager name.
 *
 * @param {VirtualNetwork} virtualNetwork - Virtual network
 * @returns {string} Virtual Network Manager
 */
export const getVNManager = (virtualNetwork) => virtualNetwork?.VN_MAD

/**
 * Returns the total number of leases in the virtual network.
 *
 * @param {VirtualNetwork} virtualNetwork - Virtual network
 * @returns {number} Total leases
 */
export const getTotalLeases = ({ AR_POOL } = {}) => {
  const addressRanges = [AR_POOL?.AR ?? []].flat()

  return addressRanges.reduce((total, { SIZE = 0 }) => total + +SIZE, 0)
}

/**
 * Returns the virtual network leases information.
 *
 * @param {VirtualNetwork} virtualNetwork - Virtual network
 * @returns {{ percentOfUsed: number, percentLabel: string }} Leases information
 */
export const getLeasesInfo = ({ USED_LEASES, ...virtualNetwork } = {}) => {
  const totalLeases = getTotalLeases(virtualNetwork)
  const percentOfUsed = (+USED_LEASES * 100) / +totalLeases || 0
  const percentLabel = `${USED_LEASES} / ${totalLeases} (${Math.round(
    percentOfUsed
  )}%)`

  return { percentOfUsed, percentLabel }
}

/**
 * Returns the address range leases information.
 *
 * @param {AddressRange} ar - Address range
 * @returns {{ percentOfUsed: number, percentLabel: string }} Leases information
 */
export const getARLeasesInfo = ({ USED_LEASES, SIZE } = {}) => {
  const percentOfUsed = (+USED_LEASES * 100) / +SIZE || 0
  const percentLabel = `${USED_LEASES} / ${SIZE} (${Math.round(
    percentOfUsed
  )}%)`

  return { percentOfUsed, percentLabel }
}

/**
 * Checks the address type: IP, IP6 or MAC
 * Otherwise returns undefined.
 *
 * @param {string} addr - Address to check
 * @returns {'IP'|'IP6'|'MAC'|undefined} Returns name of address type, undefined otherwise
 */
export const getAddressType = (addr) => {
  if (isIPv4(addr)) return 'IP'
  if (isIPv6(addr)) return 'IP6'
  if (isMAC(addr)) return 'MAC'
}

/**
 * Check if action is available for **all Virtual Networks**.
 *
 * @param {object} action - Virtual Network action
 * @param {VirtualNetwork|VirtualNetwork[]} vnets - Virtual networks
 * @returns {boolean} If `true`, the action is available for all Virtual Networks
 */
export const isAvailableAction = (action, vnets = []) => {
  if (VN_ACTIONS_BY_STATE[action]?.length === 0) return true

  return [vnets].flat().every((vnet) => {
    const state = VN_STATES[vnet.STATE]?.name

    return VN_ACTIONS_BY_STATE[action]?.includes(state)
  })
}
