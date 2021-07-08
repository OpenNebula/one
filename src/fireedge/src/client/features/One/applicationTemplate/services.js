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
import { httpCodes } from 'server/utils/constants'
import { RestClient } from 'client/utils'
import { poolRequest } from 'client/features/One/utils'

export const applicationTemplateService = ({
  getApplicationTemplate: ({ filter, id }) => RestClient
    .get(`/api/${SERVICE_TEMPLATE}/list/${id}`, { filter })
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data?.DOCUMENT ?? {}
    }),

  getApplicationsTemplates: data => {
    const command = { name: `${SERVICE_TEMPLATE}.list`, params: {} }
    return poolRequest(data, command, 'DOCUMENT')
  },

  createApplicationTemplate: ({ data = {} }) => RestClient
    .post(`/api/${SERVICE_TEMPLATE}/create`, data)
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data?.DOCUMENT ?? {}
    }),

  updateApplicationTemplate: ({ id, data = {} }) => RestClient
    .put(`/api/${SERVICE_TEMPLATE}/update/${id}`, data)
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data?.DOCUMENT ?? {}
    }),

  instantiateApplicationTemplate: ({ id, data = {} }) => RestClient
    .post(`/api/${SERVICE_TEMPLATE}/action/${id}`, {
      data: {
        action: {
          perform: 'instantiate',
          params: { merge_template: data }
        }
      }
    })
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data?.DOCUMENT ?? {}
    })
})
