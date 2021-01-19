import httpCodes from 'server/utils/constants/http-codes'
import { httpMethod } from 'server/utils/constants/defaults'
import { PROVISION } from 'server/routes/api/provision/string-routes'
import { requestData } from 'client/utils'

const { GET, POST, PUT, DELETE } = httpMethod

// --------------------------------------------
// ALL PROVISION TEMPLATES REQUESTS
// --------------------------------------------

export const getProvisionsTemplates = ({ filter }) =>
  requestData(`/api/${PROVISION}/defaults`, {
    data: { filter },
    method: GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? []
  })

export const createProvisionTemplate = ({ data = {} }) =>
  Promise.resolve().then(res => res?.data?.DOCUMENT ?? {})

// --------------------------------------------
// PROVISIONS REQUESTS
// --------------------------------------------

export const getProvision = ({ id }) =>
  requestData(`/api/${PROVISION}/list/${id}`, {
    method: GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.DOCUMENT ?? {}
  })

export const getProvisions = ({ filter }) =>
  requestData(`/api/${PROVISION}/list`, {
    data: { filter },
    method: GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat()
  })

export const createProvision = ({ data = {} }) =>
  requestData(`/api/${PROVISION}/create`, {
    data,
    method: POST,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) {
      if (res?.id === httpCodes.accepted.id) return res
      throw res
    }

    return res?.data ?? {}
  })

export const configureProvision = ({ id }) =>
  requestData(`/api/${PROVISION}/configure/${id}`, {
    method: PUT,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) {
      if (res?.id === httpCodes.accepted.id) return res
      throw res
    }

    return res?.data ?? {}
  })

export const deleteProvision = ({ id }) =>
  requestData(`/api/${PROVISION}/delete/${id}`, {
    method: DELETE,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) {
      if (res?.id === httpCodes.accepted.id) return res
      throw res
    }

    return res?.data ?? {}
  })

export const getProvisionLog = ({ id }) =>
  requestData(`/api/${PROVISION}/log/${id}`, {
    method: GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) {
      if (res?.id === httpCodes.accepted.id) return res
      throw res
    }

    return res?.data ?? []
  })

// --------------------------------------------
// INFRASTRUCTURES REQUESTS
// --------------------------------------------

export const deleteDatastore = ({ id }) =>
  requestData(`/api/${PROVISION}/datastore/${id}`, {
    method: DELETE,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  })

export const deleteVNetwork = ({ id }) =>
  requestData(`/api/${PROVISION}/network/${id}`, {
    method: DELETE,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  })

export const deleteHost = ({ id }) =>
  requestData(`/api/${PROVISION}/host/${id}`, {
    method: DELETE,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  })

export const configureHost = ({ id }) =>
  requestData(`/api/${PROVISION}/host/${id}`, {
    method: PUT,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) {
      if (res?.id === httpCodes.accepted.id) return res
      throw res
    }

    return res?.data ?? {}
  })

export default {
  getProvisionsTemplates,

  getProvision,
  getProvisions,
  createProvision,
  deleteProvision,
  getProvisionLog,

  deleteDatastore,
  deleteVNetwork,
  deleteHost,
  configureHost
}
