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
import { HOST_STATES, StateInfo } from 'client/constants'

/**
 * Returns information about the host state.
 *
 * @param {object} host - Host
 * @param {number} host.STATE - Host state
 * @returns {StateInfo} Host state object
 */
export const getState = ({ STATE = 0 } = {}) => HOST_STATES[+STATE]

/**
 * Returns the allocate information.
 *
 * @param {object} host - Host
 * @param {object} host.HOST_SHARE - Host share object
 * @returns {{
 * percentCpuUsed: number,
 * percentCpuLabel: string,
 * percentMemUsed: number,
 * percentMemLabel: string
 * }} Allocated information object
 */
export const getAllocatedInfo = ({ HOST_SHARE = {} } = {}) => {
  const { CPU_USAGE, TOTAL_CPU, MEM_USAGE, TOTAL_MEM } = HOST_SHARE

  const percentCpuUsed = +CPU_USAGE * 100 / +TOTAL_CPU || 0
  const percentCpuLabel = `${CPU_USAGE} / ${TOTAL_CPU} 
    (${Math.round(isFinite(percentCpuUsed) ? percentCpuUsed : '--')}%)`

  const percentMemUsed = +MEM_USAGE * 100 / +TOTAL_MEM || 0
  const usedMemBytes = prettyBytes(+MEM_USAGE)
  const totalMemBytes = prettyBytes(+TOTAL_MEM)
  const percentMemLabel = `${usedMemBytes} / ${totalMemBytes} 
      (${Math.round(isFinite(percentMemUsed) ? percentMemUsed : '--')}%)`

  return {
    percentCpuUsed,
    percentCpuLabel,
    percentMemUsed,
    percentMemLabel
  }
}
