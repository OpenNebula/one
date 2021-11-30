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
import { prettyBytes } from 'client/utils'
import { MARKETPLACE_STATES, StateInfo } from 'client/constants'

/**
 * Returns the marketplace state.
 *
 * @param {object} marketplace - Marketplace
 * @param {number|string} marketplace.STATE - Marketplace state numeric code
 * @returns {StateInfo} Marketplace state information
 */
export const getState = ({ STATE } = {}) => MARKETPLACE_STATES[+STATE]

/**
 * Returns the marketplace capacity information.
 *
 * @param {object} marketplace - Marketplace
 * @param {number|string} marketplace.TOTAL_MB - Total capacity MB available
 * @param {number|string} marketplace.USED_MB - Capacity used MB
 * @returns {{
 * percentOfUsed: number,
 * percentLabel: string
 * }} Marketplace capacity information
 */
export const getCapacityInfo = ({ TOTAL_MB, USED_MB } = {}) => {
  const percentOfUsed = (+USED_MB * 100) / +TOTAL_MB || 0
  const usedBytes = prettyBytes(+USED_MB, 'MB')
  const totalBytes = prettyBytes(+TOTAL_MB, 'MB')
  const percentLabel = `${usedBytes} / ${totalBytes} (${Math.round(
    percentOfUsed
  )}%)`

  return {
    percentOfUsed,
    percentLabel,
  }
}
