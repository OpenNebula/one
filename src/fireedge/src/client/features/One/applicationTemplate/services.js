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
