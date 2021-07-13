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
 * This gets the Datastore type object.
 *
 * @param {object} datastore - Datastore.
 * @param {number} datastore.TYPE - Datastore type.
 * @returns {{
 * name: string,
 * shortName: string
 * }} - Datastore type object.
 */
export const getType = ({ TYPE } = {}) => DATASTORE_TYPES[TYPE]

/**
 * This gets the Datastore state object.
 *
 * @param {object} datastore - Datastore.
 * @param {number} datastore.STATE - Datastore state ID.
 * @returns {StateInfo} - Datastore state object.
 */
export const getState = ({ STATE = 0 } = {}) => DATASTORE_STATES[STATE]

/**
 * This gets the Datasore use percentage and the corresponding label.
 *
 * @param {object} props - Props object.
 * @param {number} props.TOTAL_MB - Datastore total space in MB.
 * @param {number} props.USED_MB - Datastore used space in MB.
 * @returns {{
 * percentOfUsed: number,
 * percentLabel: string
 * }} - Datastore use percentage and label.
 */
export const getCapacityInfo = ({ TOTAL_MB, USED_MB } = {}) => {
  const percentOfUsed = +USED_MB * 100 / +TOTAL_MB || 0
  const usedBytes = prettyBytes(+USED_MB, 'MB')
  const totalBytes = prettyBytes(+TOTAL_MB, 'MB')
  const percentLabel = `${usedBytes} / ${totalBytes} (${Math.round(percentOfUsed)}%)`

  return { percentOfUsed, percentLabel }
}
