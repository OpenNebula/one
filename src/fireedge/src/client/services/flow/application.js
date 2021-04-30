import httpCodes from 'server/utils/constants/http-codes'
import { httpMethod } from 'server/utils/constants/defaults'
import {
  SERVICE,
  SERVICE_TEMPLATE
} from 'server/routes/api/oneflow/string-routes'

import { requestData } from 'client/utils'

const { GET, POST, PUT } = httpMethod

export const getApplication = ({ id }) =>
  requestData(`/api/${SERVICE}/list/${id}`, {
    method: GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.DOCUMENT ?? {}
  })

export const getApplications = ({ filter }) =>
  requestData(`/api/${SERVICE}/list`, {
    data: { filter },
    method: GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat()
  })

export const getTemplate = ({ id }) =>
  requestData(`/api/${SERVICE_TEMPLATE}/list/${id}`, {
    method: GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.DOCUMENT ?? {}
  })

export const getTemplates = ({ filter }) =>
  requestData(`/api/${SERVICE_TEMPLATE}/list`, {
    data: { filter },
    method: GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat()
  })

export const createTemplate = ({ data = {} }) =>
  requestData(`/api/${SERVICE_TEMPLATE}/create`, {
    data,
    method: POST
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res
    if (!res?.data?.DOCUMENT?.ID) throw new Error('Error')

    return res?.data?.DOCUMENT ?? {}
  })

export const updateTemplate = ({ id, data = {} }) =>
  requestData(`/api/${SERVICE_TEMPLATE}/update/${id}`, {
    data,
    method: PUT
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res
    if (!res?.data?.DOCUMENT?.ID) throw new Error('Error')

    return res?.data?.DOCUMENT ?? {}
  })

export const instantiateTemplate = ({ id, data = {} }) =>
  requestData(`/api/${SERVICE_TEMPLATE}/action/${id}`, {
    data: {
      action: {
        perform: 'instantiate',
        params: { merge_template: data }
      }
    },
    method: POST
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res
    if (!res?.data?.DOCUMENT?.ID) throw new Error('Error')

    return res?.data?.DOCUMENT ?? {}
  })

export default {
  getApplication,
  getApplications,

  getTemplate,
  getTemplates,
  createTemplate,
  updateTemplate,
  instantiateTemplate
}
