/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { findStorageData } from '@modules/utils'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

import { APP_URL, JWT_NAME, T } from '@ConstantsModule'

const httpCodes = {
  badRequest: {
    id: 400,
    message: 'Bad Request',
  },
  unauthorized: {
    id: 401,
    message: 'Unauthorized',
  },
  notFound: {
    id: 404,
    message: 'Not Found',
  },
  conflict: {
    id: 409,
    message: 'Conflict',
  },
  methodNotAllowed: {
    id: 405,
    message: 'Method not Allowed',
  },
  internalServerError: {
    id: 500,
    message: 'Internal Server Error',
  },
  serviceUnavailable: {
    id: 503,
    message: 'Service Unavailable',
  },
  noContent: {
    id: 204,
    message: 'No content',
  },
  accepted: {
    id: 202,
    message: 'Accepted',
  },
  ok: {
    id: 200,
    message: 'OK',
  },
}

const http = axios.create({ baseURL: APP_URL })

http.interceptors.request.use((config) => {
  const token = findStorageData(JWT_NAME)
  token && (config.headers.Authorization = `Bearer ${token}`)

  return {
    ...config,
    headers: {
      ...config.headers,
      'Content-Type': 'application/json',
    },
    ...(!config?.onUploadProgress
      ? { timeout: window.__GLOBAL_API_TIMEOUT__ }
      : {}),
    timeoutErrorMessage: T.Timeout,
    withCredentials: true,
    validateStatus: (status) =>
      Object.values(httpCodes).some(({ id }) => id === status),
  }
})

http.interceptors.response.use(
  (response) => {
    if (response?.data && response?.status < httpCodes.badRequest.id) {
      return typeof response === 'string' ? response.data.json() : response.data
    }

    return Promise.reject(response)
  },
  (error) => error
)

const RestClient = {
  /**
   * @param {AxiosRequestConfig} options - Request configuration
   * @returns {AxiosResponse} Response from server
   */
  request: (options) => http.request(options),
}

export { http, RestClient }
