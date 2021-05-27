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
