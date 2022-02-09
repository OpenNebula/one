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
import { SERVICE } from 'server/routes/api/oneflow/basepath'
import { httpCodes } from 'server/utils/constants'
import { RestClient } from 'client/utils'

export const applicationService = {
  /**
   * Retrieves information for the service.
   *
   * @param {object} data - Request parameters
   * @param {string} data.id - Service id
   * @returns {object} Get service identified by id
   * @throws Fails when response isn't code 200
   */
  getApplication: async ({ id }) => {
    const res = await RestClient.request({
      url: `/api/${SERVICE}/${id}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.DOCUMENT ?? {}
  },

  /**
   * Retrieves information for all services.
   *
   * @returns {object} Get list of services
   * @throws Fails when response isn't code 200
   */
  getApplications: async () => {
    const res = await RestClient.request({
      url: `/api/${SERVICE}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat()
  },
}
