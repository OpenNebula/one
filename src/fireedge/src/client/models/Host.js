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
 * @returns {StateInfo} Host state object
 */
export const getState = host => HOST_STATES[+host?.STATE ?? 0]

/**
 * @param {object} host - Host
 * @returns {Array} List of datastores from resource
 */
export const getDatastores = host =>
  [host?.HOST_SHARE?.DATASTORES?.DS ?? []].flat()

/**
 * Returns the allocate information.
 *
 * @param {object} host - Host
 * @returns {{
 * percentCpuUsed: number,
 * percentCpuLabel: string,
 * percentMemUsed: number,
 * percentMemLabel: string
 * }} Allocated information object
 */
export const getAllocatedInfo = host => {
  const { CPU_USAGE, TOTAL_CPU, MEM_USAGE, TOTAL_MEM } = host?.HOST_SHARE ?? {}

  const percentCpuUsed = +CPU_USAGE * 100 / +TOTAL_CPU || 0
  const percentCpuLabel = `${CPU_USAGE} / ${TOTAL_CPU} 
    (${Math.round(isFinite(percentCpuUsed) ? percentCpuUsed : '--')}%)`

  const isMemUsageNegative = +MEM_USAGE < 0
  const percentMemUsed = +MEM_USAGE * 100 / +TOTAL_MEM || 0
  const usedMemBytes = prettyBytes(Math.abs(+MEM_USAGE))
  const totalMemBytes = prettyBytes(+TOTAL_MEM)
  const percentMemLabel = `${isMemUsageNegative ? '-' : ''}${usedMemBytes} / ${totalMemBytes} 
      (${Math.round(isFinite(percentMemUsed) ? percentMemUsed : '--')}%)`

  return {
    percentCpuUsed,
    percentCpuLabel,
    percentMemUsed,
    percentMemLabel
  }
}
