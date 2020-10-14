import { httpMethod } from 'server/utils/constants/defaults'
import {
  SERVICE,
  SERVICE_TEMPLATE
} from 'server/routes/api/oneflow/string-routes'

import { requestData } from 'client/utils'
import httpCodes from 'server/utils/constants/http-codes'

export const getApplication = () => {
  // request
}

export const getApplications = ({ filter }) =>
  requestData(`/api/${SERVICE}`, {
    data: { filter },
    method: httpMethod.GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat()
  })

export const createApplication = () => {
  // request
}

export const getTemplate = ({ id }) =>
  requestData(`/api/${SERVICE_TEMPLATE}/${id}`, {
    method: httpMethod.GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.DOCUMENT ?? {}
  })

export const getTemplates = ({ filter }) =>
  requestData(`/api/${SERVICE_TEMPLATE}`, {
    data: { filter },
    method: httpMethod.GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat()
  })

export const createTemplate = ({ data = {} }) =>
  requestData(`/api/${SERVICE_TEMPLATE}`, {
    data,
    method: httpMethod.POST
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res
    if (!res?.data?.DOCUMENT?.ID) throw new Error('Error')

    return res?.data?.DOCUMENT ?? {}
  })

export const updateTemplate = ({ id, data = {} }) =>
  requestData(`/api/${SERVICE_TEMPLATE}/${id}`, {
    data,
    method: httpMethod.PUT
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res
    if (!res?.data?.DOCUMENT?.ID) throw new Error('Error')

    return res?.data?.DOCUMENT ?? {}
  })

export default {
  getApplication,
  getApplications,
  createApplication,

  getTemplate,
  getTemplates,
  createTemplate,
  updateTemplate
}
