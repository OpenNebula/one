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
import { Actions, Commands } from 'server/utils/constants/commands/marketapp'
import { httpCodes } from 'server/utils/constants'
import { requestConfig, RestClient } from 'client/utils'

export const marketplaceAppService = ({
  /**
   * Retrieves information for the marketplace app.
   *
   * @param {object} data - Request parameters
   * @param {string} data.id - Marketplace apps id
   * @returns {object} Get marketplace app identified by id
   * @throws Fails when response isn't code 200
   */
  getMarketplaceApp: async ({ id }) => {
    const name = Actions.MARKETAPP_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig({ id }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.MARKETPLACEAPP ?? {}
  },

  /**
   * Retrieves information for all or part of the
   * marketplace apps in the pool.
   *
   * @param {object} data - Request params
   * @param {string} data.filter - Filter flag
   * @param {number} data.start - Range start ID
   * @param {number} data.end - Range end ID
   * @returns {Array} List of marketplace apps
   * @throws Fails when response isn't code 200
   */
  getMarketplaceApps: async ({ filter, start, end }) => {
    const name = Actions.MARKETAPP_POOL_INFO
    const command = { name, ...Commands[name] }
    const config = requestConfig({ filter, start, end }, command)

    const res = await RestClient.request(config)

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.MARKETPLACEAPP_POOL?.MARKETPLACEAPP ?? []].flat()
  },

  /**
   * Exports the marketplace app to the OpenNebula cloud.
   *
   * @param {object} params - Request parameters
   * @param {string|number} params.id - App id
   * @param {string} params.name - Image name
   * @param {string|number} params.datastore - Datastore id or name
   * @param {string|number} params.file - File datastore id or name
   * @param {string} params.tag - DockerHub image tag (default latest)
   * @param {string|number} params.template - Associate with VM template
   * @param {boolean} params.associated - If `true`, Do not import/export associated VM templates/images
   * @param {string} params.vmname - The name for the new VM Template, if the App contains one
   * @returns {number} Template id
   * @throws Fails when response isn't code 200
   */
  export: async ({ id, ...data }) => {
    const res = await RestClient.request({
      url: `/api/marketapp/export/${id}`,
      method: 'POST',
      data
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res?.data

    return res?.data
  }
})
