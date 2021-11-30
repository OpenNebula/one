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
import { SERVICE_TEMPLATE } from 'server/routes/api/oneflow/string-routes'
import { httpCodes, defaults } from 'server/utils/constants'
import { RestClient } from 'client/utils'

const { POST, PUT } = defaults?.httpMethod || {}

export const applicationTemplateService = {
  /**
   * Retrieves information for the service template.
   *
   * @param {object} data - Request parameters
   * @param {string} data.id - Service template id
   * @returns {object} Get service template identified by id
   * @throws Fails when response isn't code 200
   */
  getApplicationTemplate: ({ id }) => {
    const res = RestClient.request({
      url: `/api/${SERVICE_TEMPLATE}/list/${id}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.DOCUMENT ?? {}
  },

  /**
   * @returns {object} Get list of service templates
   * @throws Fails when response isn't code 200
   */
  getApplicationsTemplates: async () => {
    const res = await RestClient.request({
      url: `/api/${SERVICE_TEMPLATE}/list`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat()
  },

  /**
   * Retrieves information for all service templates.
   *
   * @param {object} params - Request parameters
   * @param {object} params.data - Data of new application template
   * @returns {object} Object of document created
   * @throws Fails when response isn't code 200
   */
  createApplicationTemplate: async ({ data = {} }) => {
    const res = await RestClient.request({
      data,
      method: POST,
      url: `/api/${SERVICE_TEMPLATE}/create`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.DOCUMENT ?? {}
  },

  /**
   * Update the service template.
   *
   * @param {object} params - Request parameters
   * @param {object} params.id - Service template id
   * @param {object} params.data - Updated data
   * @returns {object} Object of document updated
   * @throws Fails when response isn't code 200
   */
  updateApplicationTemplate: ({ id, data = {} }) => {
    const res = RestClient.request({
      data,
      method: PUT,
      url: `/api/${SERVICE_TEMPLATE}/update/${id}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.DOCUMENT ?? {}
  },

  /**
   * Perform instantiate action on the service template.
   *
   * @param {object} params - Request parameters
   * @param {object} params.id - Service template id
   * @param {object} params.data - Additional parameters to be passed inside `params`
   * @returns {Response} Response 201
   * @throws Fails when response isn't code 200
   */
  instantiateApplicationTemplate: ({ id, data = {} }) => {
    const res = RestClient.request({
      data: {
        action: {
          perform: 'instantiate',
          params: { merge_template: data },
        },
      },
      method: PUT,
      url: `/api/${SERVICE_TEMPLATE}/action/${id}`,
    })

    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  },
}
