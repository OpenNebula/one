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
import { VirtualNetwork, VN_STATES, STATES } from 'client/constants'

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
