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
import { Actions, Commands } from 'server/utils/constants/commands/group'
import { httpCodes } from 'server/utils/constants'
import { requestConfig, RestClient } from 'client/utils'

export const groupService = {
  /**
   * Retrieves information for the group.
   *
   * @param {object} data - Request parameters
   * @param {string} data.id - Group id
   * @returns {object} Get group identified by id
   * @throws Fails when response isn't code 200
   */
  getGroup: async ({ id }) => {
    const name = Actions.GROUP_INFO
    const command = { name, ...Commands[name] }
    const { url, options } = requestConfig({ id }, command)

    const res = await RestClient.get(url, options)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.GROUP ?? {}
  },

  /**
   * Retrieves information for all the groups in the pool.
   *
   * @returns {object} Get list of groups
   * @throws Fails when response isn't code 200
   */
  getGroups: async () => {
    const name = Actions.GROUP_POOL_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig(undefined, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.GROUP_POOL?.GROUP ?? []].flat()
  },
}
