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
import { Actions, Commands } from 'server/utils/constants/commands/user'
import { httpCodes } from 'server/utils/constants'
import { requestConfig, RestClient } from 'client/utils'

export const userService = {
  /**
   * Retrieves information for the user.
   *
   * @param {object} data - Request parameters
   * @param {string} data.id - User id
   * @returns {object} Get user identified by id
   * @throws Fails when response isn't code 200
   */
  getUser: async ({ id }) => {
    const name = Actions.USER_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig({ id }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.USER ?? {}
  },

  /**
   * Retrieves information for all the users in the pool.
   *
   * @returns {Array} List of users
   * @throws Fails when response isn't code 200
   */
  getUsers: async () => {
    const name = Actions.USER_POOL_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig(undefined, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.USER_POOL?.USER ?? []].flat()
  },

  /**
   * Changes the group of the given user.
   *
   * @param {object} params - Request parameters
   * @param {object} params.data - Form data
   * @returns {number} User id
   * @throws Fails when response isn't code 200
   */
  changeGroup: async (params) => {
    const name = Actions.USER_CHGRP
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  },

  /**
   * Replaces the user template contents.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - User id
   * @param {string} params.template - The new user template contents
   * @param {0|1} params.replace
   * - Update type:
   * ``0``: Replace the whole template.
   * ``1``: Merge new template with the existing one.
   * @returns {number} User id
   * @throws Fails when response isn't code 200
   */
  updateUser: async (params) => {
    const name = Actions.USER_UPDATE
    const command = { name, ...Commands[name] }
    const config = requestConfig(params, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  },
}
