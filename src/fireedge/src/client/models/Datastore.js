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
import { DATASTORE_STATES, DATASTORE_TYPES, StateInfo } from 'client/constants'

/**
 * Returns the datastore type name.
 *
 * @param {object} datastore - Datastore
 * @param {number} datastore.TYPE - Datastore type
 * @returns {DATASTORE_TYPES} - Datastore type object
 */
export const getType = ({ TYPE } = {}) => DATASTORE_TYPES[TYPE]

/**
 * Returns information about datastore state.
 *
 * @param {object} datastore - Datastore
 * @param {number} datastore.STATE - Datastore state ID
 * @returns {StateInfo} - Datastore state object
 */
export const getState = ({ STATE = 0 } = {}) => DATASTORE_STATES[STATE]

/**
 * Return the TM_MAD_SYSTEM attribute.
 *
 * @param {object} datastore - Datastore
 * @returns {string[]} - The list of deploy modes available
 */
export const getDeployMode = (datastore = {}) => {
  const { TEMPLATE = {} } = datastore
  const isImage = getType(datastore)?.name === DATASTORE_TYPES[0]?.name

  return isImage
    ? TEMPLATE?.TM_MAD_SYSTEM?.split(',')?.filter(Boolean) ?? []
    : []
}

/**
 * Returns information about datastore capacity.
 *
 * @param {object} datastore - Datastore
 * @param {number} datastore.TOTAL_MB - Total capacity in MB
 * @param {number} datastore.USED_MB - Used capacity in MB
 * @returns {{
 * percentOfUsed: number,
 * percentLabel: string
 * }} - Datastore used percentage and label.
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
 * Returns `true` if Datastore allows to export to Marketplace.
 *
 * @param {object} props - Datastore ob
 * @param {object} props.NAME - Name
 * @param {object} oneConfig - One config from redux
 * @returns {boolean} - Datastore supports to export
 */
export const isMarketExportSupport = ({ NAME } = {}, oneConfig) => {
  // When in doubt, allow the action and let oned return failure
  return (
    !NAME ||
    oneConfig?.DS_MAD_CONF?.some(
      (dsMad) =>
        dsMad?.NAME === NAME && dsMad?.MARKETPLACE_ACTIONS?.includes?.('export')
    )
  )
}
