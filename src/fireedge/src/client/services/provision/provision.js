import httpCodes from 'server/utils/constants/http-codes'
import { httpMethod } from 'server/utils/constants/defaults'
import { PROVISION, PROVISION_TEMPLATE } from 'server/routes/api/provision/string-routes'
import { requestData } from 'client/utils'

const { GET, POST, PUT, DELETE } = httpMethod

// --------------------------------------------
// PROVISIONS TEMPLATES REQUESTS
// --------------------------------------------

export const getProvisionTemplate = ({ id }) =>
  requestData(`/api/${PROVISION_TEMPLATE}/list/${id}`, {
    method: GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.DOCUMENT ?? {}
  })

export const getProvisionsTemplates = ({ filter }) =>
  requestData(`/api/${PROVISION_TEMPLATE}/list`, {
    data: { filter },
    method: GET,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat()
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
  Promise.resolve().then(res => res?.data?.DOCUMENT ?? {})

/* export const createProvision = ({ id, data = {} }) =>
  requestData(`/api/${PROVISION}/create/${id}`, {
    data,
    method: POST,
    error: err => err?.message
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  }) */

export default {
  getProvisionTemplate,
  getProvisionsTemplates,

  getProvision,
  getProvisions,
  createProvision
}
