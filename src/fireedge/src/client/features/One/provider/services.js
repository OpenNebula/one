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
import { PROVIDER } from 'server/routes/api/provision/string-routes'
import { httpCodes, defaults } from 'server/utils/constants'
import { RestClient } from 'client/utils'

const { POST, PUT, DELETE } = defaults?.httpMethod || {}

export const providerService = {
  /**
   * Retrieves information for the provider.
   *
   * @param {object} data - Request parameters
   * @param {string} data.id - Provider id
   * @returns {object} Get provider identified by id
   * @throws Fails when response isn't code 200
   */
  getProvider: async ({ id }) => {
    const res = await RestClient.request({
      url: `/api/${PROVIDER}/list/${id}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.DOCUMENT ?? {}
  },

  /**
   * Retrieves information for all providers.
   *
   * @returns {Array} List of providers
   * @throws Fails when response isn't code 200
   */
  getProviders: async () => {
    const res = await RestClient.request({
      url: `/api/${PROVIDER}/list`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat()
  },

  /**
   * Retrieves connection information for the
   * provider.
   *
   * @param {object} data - Request parameters
   * @param {string} data.id - Provider id
   * @returns {object} Get connection info from the
   * provider identified by id
   * @throws Fails when response isn't code 200
   */
  getProviderConnection: async ({ id }) => {
    const res = await RestClient.request({
      url: `/api/${PROVIDER}/connection/${id}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  },

  /**
   * Create a provider.
   *
   * @param {object} params - Request parameters
   * @param {object} params.data - Template data
   * @returns {object} Object of document created
   * @throws Fails when response isn't code 200
   */
  createProvider: async ({ data = {} }) => {
    const res = await RestClient.request({
      data,
      method: POST,
      url: `/api/${PROVIDER}/create`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  },

  /**
   * Update the provider information.
   *
   * @param {object} params - Request parameters
   * @param {object} params.id - Provider id
   * @param {object} params.data - Updated data
   * @returns {object} Object of document updated
   * @throws Fails when response isn't code 200
   */
  updateProvider: async ({ id, data = {} }) => {
    const res = await RestClient.request({
      data,
      method: PUT,
      url: `/api/${PROVIDER}/update/${id}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  },

  /**
   * Delete the provider.
   *
   * @param {object} params - Request parameters
   * @param {object} params.id - Provider id
   * @returns {object} Object of document deleted
   * @throws Fails when response isn't code 200
   */
  deleteProvider: async ({ id }) => {
    const res = await RestClient.request({
      method: DELETE,
      url: `/api/${PROVIDER}/delete/${id}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  },
}
