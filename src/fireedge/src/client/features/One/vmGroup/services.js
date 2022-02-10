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
import { Actions, Commands } from 'server/utils/constants/commands/vmgroup'
import { httpCodes } from 'server/utils/constants'
import { requestConfig, RestClient } from 'client/utils'

export const vmGroupService = {
  /**
   * Retrieves information for the VM group.
   *
   * @param {object} params - Request parameters
   * @param {string} params.id - VM group id
   * @param {boolean} params.decrypt - `true` to decrypt contained secrets
   * @returns {object} Get VM group identified by id
   * @throws Fails when response isn't code 200
   */
  getVmGroup: async (params) => {
    const name = Actions.VM_GROUP_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.VM_GROUP ?? {}
  },

  /**
   * Retrieves information for all or part of the
   * VM groups in the pool.
   *
   * @param {object} data - Request params
   * @param {string} data.filter - Filter flag
   * @param {number} data.start - Range start ID
   * @param {number} data.end - Range end ID
   * @returns {Array} List of VM groups
   * @throws Fails when response isn't code 200
   */
  getVmGroups: async ({ filter, start, end }) => {
    const name = Actions.VM_GROUP_POOL_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig({ filter, start, end }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.VM_GROUP_POOL?.VM_GROUP ?? []].flat()
  },
}
