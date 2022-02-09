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
import { httpCodes } from 'server/utils/constants'
import { RestClient } from 'client/utils'

export const authService = {
  /**
   * @param {object} data - User credentials
   * @param {string} data.user - Username
   * @param {string} data.token - Password
   * @param {boolean} [data.remember] - Remember session
   * @param {string} [data.token2fa] - Token for Two factor authentication
   * @returns {object} Response data from request
   * @throws Fails when response isn't code 200
   */
  login: async (data) => {
    const res = await RestClient.request({
      url: '/api/auth',
      data,
      method: 'POST',
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) {
      if (res?.id === httpCodes.accepted.id) return res
      throw res
    }

    return res?.data
  },
  /**
   * @returns {object} Information about user authenticated
   * @throws Fails when response isn't code 200
   */
  getUser: async () => {
    const res = await RestClient.request({ url: '/api/user/info' })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.USER ?? {}
  },
  /**
   * @returns {object} Provider configuration
   * @throws Fails when response isn't code 200
   */
  getProviderConfig: async () => {
    const res = await RestClient.request({ url: '/api/provider/config' })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  },
  /**
   * @returns {object} Views available for the user authenticated
   * @throws Fails when response isn't code 200
   */
  getSunstoneViews: async () => {
    const res = await RestClient.request({ url: '/api/sunstone/views' })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  },
  /**
   * @returns {object} Sunstone configuration
   * @throws Fails when response isn't code 200
   */
  getSunstoneConfig: async () => {
    const res = await RestClient.request({ url: '/api/sunstone/config' })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  },
}
