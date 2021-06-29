import axios from 'axios'

import { httpCodes } from 'server/utils/constants'
import { messageTerminal } from 'server/utils/general'

import { findStorageData, isDevelopment } from 'client/utils'
import { JWT_NAME, APP_URL } from 'client/constants'

const http = axios.create({ baseURL: APP_URL })

http.interceptors.request.use((config) => {
  const token = findStorageData(JWT_NAME)
  token && (config.headers.Authorization = `Bearer ${token}`)

  return {
    ...config,
    withCredentials: true,
    validateStatus: status =>
      Object.values(httpCodes).some(({ id }) => id === status)
  }
})

http.interceptors.response.use(
  response => {
    if (response?.data && response?.status < httpCodes.badRequest.id) {
      return typeof response === 'string'
        ? response.data.json()
        : response.data
    }

    if (response.status === httpCodes.unauthorized.id) {
      const configErrorParser = {
        color: 'red',
        error: response?.data?.message ?? response?.statusText,
        message: 'Error request: %s'
      }

      isDevelopment() && messageTerminal(configErrorParser)
    }

    return Promise.reject(response)
  },
  error => {
    console.log('error interceptor', error)
    return error
  }
)

export const RestClient = {
  get: (url, options) => {
    const headers = {
      credentials: 'include'
    }

    return http.get(url, { headers, ...options })
  },

  post: (url, body, options) => {
    const headers = {
      'Content-Type': 'application/json'
    }

    if (options && typeof options.headers === 'object') {
      Object.assign(headers, options.headers)
    }

    return http.post(url, body, { headers })
  },

  put: (url, body, options) => {
    const headers = {
      'Content-Type': 'application/json'
    }

    if (options && typeof options.headers === 'object') {
      Object.assign(headers, options.headers)
    }

    return http.put(url, body, { headers })
  },

  delete: (url, options) => {
    const headers = {}

    if (options && typeof options.headers === 'object') {
      Object.assign(headers, options.headers)
    }

    return http.delete(url, { headers })
  }
}
