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
import { prettyBytes } from 'client/utils'
import { MARKETPLACE_STATES, STATES, Marketplace } from 'client/constants'

/**
 * Returns the marketplace state.
 *
 * @param {Marketplace} marketplace - Marketplace
 * @returns {STATES.StateInfo} Marketplace state information
 */
export const getState = ({ STATE } = {}) => MARKETPLACE_STATES[+STATE]

/**
 * Returns the marketplace capacity information.
 *
 * @param {Marketplace} marketplace - Marketplace
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

  return { percentOfUsed, percentLabel }
}

/**
 * Returns `true` if the marketplace can be perform
 * one of these actions: monitor, create, delete.
 *
 * @param {Marketplace} marketplace - Marketplace
 * @param {object} onedConf - One daemon configuration
 * @param {'monitor'|'create'|'delete'} action - Marketplace action
 * @returns {boolean} If the oned.conf includes the action
 */
export const onedConfIncludesAction = (
  marketplace = {},
  onedConf = {},
  action = 'monitor'
) => {
  const isInZone = (onedConf.FEDERATION?.ZONE_ID ?? '0') === marketplace.ZONE_ID
  const includesAction = onedConf.MARKET_MAD_CONF?.some(
    ({ APP_ACTIONS, NAME }) =>
      APP_ACTIONS?.includes(action) &&
      `${NAME}`.toLowerCase() === `${marketplace.MARKET_MAD}`.toLowerCase()
  )

  return isInZone && includesAction
}
