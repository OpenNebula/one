/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

import axios from 'axios'
import root from 'window-or-global'

import { JWT_NAME } from 'client/constants'
import { messageTerminal } from 'server/utils/general'
import { httpCodes } from 'server/utils/constants'
import { defaultAppName } from 'server/utils/constants/defaults'

const defaultData = {
  data: {},
  json: true,
  baseURL: root?.location?.origin?.concat(`/${defaultAppName}`) ?? '',
  method: 'GET',
  authenticate: true,
  onUploadProgress: null,
  error: err => err
}

export const storage = (name = '', data = '', keepData = false) => {
  if (name && data) {
    keepData
      ? root?.localStorage?.setItem(name, data)
      : root?.sessionStorage?.setItem(name, data)
  }
}

export const removeStoreData = (items = []) => {
  const itemsToRemove = !Array.isArray(items) ? [items] : items

  itemsToRemove.forEach(item => {
    root?.localStorage?.removeItem(item)
    root?.sessionStorage?.removeItem(item)
  })
}

export const findStorageData = (name = '') => {
  if (name && root?.localStorage.getItem(name)) {
    return root.localStorage.getItem(name)
  } else if (name && root?.sessionStorage.getItem(name)) {
    return root.sessionStorage.getItem(name)
  } else return false
}

export const requestData = (url = '', data = {}) => {
  const params = { ...defaultData, ...data }
  const config = {
    url,
    method: params.method,
    baseURL: params.baseURL,
    headers: {},
    validateStatus: status =>
      Object.values(httpCodes).some(({ id }) => id === status),
    ...params?.config
  }

  if (params.json) {
    config.headers['Content-Type'] = 'application/json'
  }

  if (params.data && params.method.toUpperCase() !== 'GET') {
    config.data = params.data
  }

  if (typeof params.onUploadProgress === 'function') {
    config.onUploadProgress = params.onUploadProgress
  }

  if (params.authenticate === true && findStorageData(JWT_NAME)) {
    config.headers.Authorization = `Bearer ${findStorageData(JWT_NAME)}`
  }

  return axios
    .request(config)
    .then(response => {
      if (response?.data && response?.status < httpCodes.badRequest.id) {
        return params.json && typeof response === 'string'
          ? response.data.json()
          : response.data
      }
      throw new Error(response?.data?.message ?? response?.statusText)
    })
    .catch(err => {
      const configErrorParser = {
        color: 'red',
        type: err.message,
        message: 'Error request: %s'
      }
      messageTerminal(configErrorParser)
      return params.error(err)
    })
}
