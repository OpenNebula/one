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
