import httpCodes from 'server/utils/constants/http-codes'
import { httpMethod } from 'server/utils/constants/defaults'
import { PROVIDER } from 'server/routes/api/provision/string-routes'
import { requestData } from 'client/utils'

const { GET, POST, PUT, DELETE } = httpMethod

export const getProvidersTemplates = ({ filter }) =>
  requestData(`/api/${PROVIDER}/template`, {
    data: { filter },
    method: GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? []
  })

export const getProvider = ({ id }) =>
  requestData(`/api/${PROVIDER}/list/${id}`, {
    method: GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.DOCUMENT ?? {}
  })

export const getProviders = ({ filter }) =>
  requestData(`/api/${PROVIDER}/list`, {
    data: { filter },
    method: GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat()
  })

export const createProvider = ({ data = {} }) =>
  requestData(`/api/${PROVIDER}/create`, {
    data,
    method: POST,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  })

export const updateProvider = ({ id, data = {} }) =>
  requestData(`/api/${PROVIDER}/update/${id}`, {
    data,
    method: PUT,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  })

export const deleteProvider = ({ id }) =>
  requestData(`/api/${PROVIDER}/delete/${id}`, {
    method: DELETE,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  })

export default {
  getProvidersTemplates,

  getProvider,
  getProviders,
  createProvider,
  updateProvider,
  deleteProvider
}
