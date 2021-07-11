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
import { Actions, Commands } from 'server/utils/constants/commands/vn'
import { httpCodes } from 'server/utils/constants'
import { requestConfig, RestClient } from 'client/utils'

export const vNetworkService = ({
  /**
   * Retrieves information for the virtual network.
   *
   * @param {object} data - Request parameters
   * @param {string} data.id - Virtual network id
   * @returns {object} Get virtual network identified by id
   * @throws Fails when response isn't code 200
   */
  getVNetwork: async ({ id }) => {
    const name = Actions.VN_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig({ id }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.VNET ?? {}
  },

  /**
   * Retrieves information for all or part of the
   * virtual networks in the pool.
   *
   * @param {object} data - Request params
   * @param {string} data.filter - Filter flag
   * @param {number} data.start - Range start ID
   * @param {number} data.end - Range end ID
   * @returns {Array} List of virtual networks
   * @throws Fails when response isn't code 200
   */
  getVNetworks: async ({ filter, start, end }) => {
    const name = Actions.VN_POOL_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig({ filter, start, end }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.VNET_POOL?.VNET ?? []].flat()
  }
})
