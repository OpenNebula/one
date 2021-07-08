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
import { httpCodes } from 'server/utils/constants'
import { RestClient } from 'client/utils'
import { poolRequest } from 'client/features/One/utils'

export const providerService = ({
  // --------------------------------------------
  // PROVIDERS REQUESTS
  // --------------------------------------------

  getProvider: ({ filter, id }) => RestClient
    .get(`/api/${PROVIDER}/list/${id}`, { filter })
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data?.DOCUMENT ?? {}
    }),

  getProviders: data => {
    const command = { name: `${PROVIDER}.list`, params: {} }
    return poolRequest(data, command, 'DOCUMENT')
  },

  getProviderConnection: ({ id }) => RestClient
    .get(`/api/${PROVIDER}/connection/${id}`)
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data ?? {}
    }),

  createProvider: ({ data = {} }) => RestClient
    .post(`/api/${PROVIDER}/create`, data)
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data ?? {}
    }),

  updateProvider: ({ id, data = {} }) => RestClient
    .put(`/api/${PROVIDER}/update/${id}`, data)
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data ?? {}
    }),

  deleteProvider: ({ id }) => RestClient
    .delete(`/api/${PROVIDER}/delete/${id}`)
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data ?? {}
    })
})
