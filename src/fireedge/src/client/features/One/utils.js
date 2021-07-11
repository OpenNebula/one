/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { createAsyncThunk, AsyncThunkAction } from '@reduxjs/toolkit'

import { logout } from 'client/features/Auth/actions'

import { T } from 'client/constants'
import { httpCodes } from 'server/utils/constants'

const ATTRIBUTES_EDITABLE = ['NAME', 'STATE', 'LCM_STATE']

/**
 * @param {string} type - Name of redux action
 * @param {Promise} service - Request from service
 * @param {Function} [wrapResult] - Function to wrapping the response
 * @returns {AsyncThunkAction} Asynchronous redux action
 */
export const createAction = (type, service, wrapResult) =>
  createAsyncThunk(type, async (payload, { dispatch, getState, rejectWithValue }) => {
    try {
      const { auth: { filterPool }, one } = getState()

      const response = await service({
        ...payload,
        filter: filterPool
      })

      return wrapResult?.(response, one) ?? response
    } catch (error) {
      const { message, data, status, statusText } = error

      status === httpCodes.unauthorized.id && dispatch(logout(T.SessionExpired))

      return rejectWithValue(message ?? data?.data ?? data?.message ?? statusText)
    }
  }, {
    condition: (_, { getState }) => !getState().one.requests[type]
  })

/**
 * @param {object} currentList - Current list of resources from redux
 * @param {object} value - OpenNebula resource
 * @returns {Array} Returns a new list with the attributes editable modified
 */
export const updateResourceList = (currentList, value) => {
  const id = value.ID

  const newItem = currentList?.find(({ ID }) => ID === id)

  const editedItem = ATTRIBUTES_EDITABLE.reduce(
    (item, attr) => value[attr] ? ({ ...item, [attr]: value[attr] }) : item,
    newItem || {}
  )

  // update if exists in current list, if not add it to list
  const updatedList = newItem
    ? currentList?.map(item => item?.ID === id ? editedItem : item)
    : [value, currentList]

  return updatedList
}
