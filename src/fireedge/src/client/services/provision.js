import axios from 'axios'
import httpCodes from 'server/utils/constants/http-codes'
import { httpMethod } from 'server/utils/constants/defaults'
import {
  PROVIDER,
  PROVISION,
  PROVISION_TEMPLATE
} from 'server/routes/api/provision/string-routes'

import { requestData } from 'client/utils'
import { REQUEST_ACTIONS } from 'client/constants'
const { GET, POST, PUT } = httpMethod

// --------------------------------------------
// PROVIDERS REQUESTS
// --------------------------------------------

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
    method: POST
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  })

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
    method: GET
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat()
  })

export const createProvision = ({ data = {} }) =>
  Promise.resolve().then(res => res?.data?.DOCUMENT ?? {})

export default {
  getProvidersTemplates,
  getProvider,
  getProviders,
  createProvider,

  getProvisionTemplate,
  getProvisionsTemplates,

  getProvision,
  getProvisions,
  createProvision
}
