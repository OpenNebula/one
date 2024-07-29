/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

import { httpCodes } from 'server/utils/constants'
import { findStorageData } from 'client/utils'
import { T, JWT_NAME, APP_URL } from 'client/constants'

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
    timeout: window.__GLOBAL_API_TIMEOUT__,
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

export const RestClient = {
  /**
   * @param {AxiosRequestConfig} options - Request configuration
   * @returns {AxiosResponse} Response from server
   */
  request: (options) => http.request(options),
}

export default http
