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
import { PROVISION } from 'server/routes/api/provision/string-routes'
import { httpCodes } from 'server/utils/constants'
import { RestClient } from 'client/utils'
import { poolRequest } from 'client/features/One/utils'

export const provisionService = ({
  // --------------------------------------------
  // ALL PROVISION TEMPLATES REQUESTS
  // --------------------------------------------

  getProvisionsTemplates: ({ filter }) => RestClient
    .get(`/api/${PROVISION}/defaults`, { data: { filter } })
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data ?? []
    }),

  createProvisionTemplate: ({ data = {} }) =>
    Promise.resolve().then(res => res?.data?.DOCUMENT ?? {}),

  // --------------------------------------------
  // PROVISIONS REQUESTS
  // --------------------------------------------

  getProvision: ({ filter, id }) => RestClient
    .get(`/api/${PROVISION}/list/${id}`, { filter })
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data?.DOCUMENT ?? {}
    }),

  getProvisions: data => {
    const command = { name: `${PROVISION}.list`, params: {} }
    return poolRequest(data, command, 'DOCUMENT')
  },

  createProvision: ({ data = {} }) => RestClient
    .post(`/api/${PROVISION}/create`, data)
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) {
        if (res?.id === httpCodes.accepted.id) return res?.data
        throw res
      }

      return res?.data
    }),

  configureProvision: ({ id }) => RestClient
    .put(`/api/${PROVISION}/configure/${id}`)
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) {
        if (res?.id === httpCodes.accepted.id) return res
        throw res
      }

      return res?.data ?? {}
    }),

  deleteProvision: ({ id }) => RestClient
    .delete(`/api/${PROVISION}/delete/${id}`)
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) {
        if (res?.id === httpCodes.accepted.id) return res
        throw res
      }

      return res?.data ?? {}
    }),

  getProvisionLog: ({ id }) => RestClient
    .get(`/api/${PROVISION}/log/${id}`)
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) {
        if (res?.id === httpCodes.accepted.id) return res
        throw res
      }

      return res?.data ?? {}
    }),

  // --------------------------------------------
  // INFRASTRUCTURES REQUESTS
  // --------------------------------------------

  deleteDatastore: ({ id }) => RestClient
    .delete(`/api/${PROVISION}/datastore/${id}`)
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data ?? {}
    }),

  deleteVNetwork: ({ id }) => RestClient
    .delete(`/api/${PROVISION}/network/${id}`)
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data ?? {}
    }),

  deleteHost: ({ id }) => RestClient
    .delete(`/api/${PROVISION}/host/${id}`)
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data ?? {}
    }),

  configureHost: ({ id }) => RestClient
    .put(`/api/${PROVISION}/host/${id}`)
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) {
        if (res?.id === httpCodes.accepted.id) return res
        throw res
      }

      return res?.data ?? {}
    })
})
