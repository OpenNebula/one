/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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

/**
 * @param {string} type - Name of redux action
 * @param {Promise} service - Request from service
 * @param {function(object, object)} [wrapResult] - Function to wrapping the response
 * @returns {AsyncThunkAction} Asynchronous redux action
 */
export const createAction = (type, service, wrapResult) =>
  createAsyncThunk(
    type,
    async (payload, { dispatch, getState, rejectWithValue }) => {
      try {
        const {
          auth: { filterPool },
          one,
        } = getState()

        const response = await service({
          ...payload,
          filter: filterPool,
        })

        return wrapResult?.(response, one) ?? response
      } catch (error) {
        const { message, data, status, statusText } = error

        status === httpCodes.unauthorized.id &&
          dispatch(logout(T.SessionExpired))

        return rejectWithValue(
          message ?? data?.data ?? data?.message ?? statusText
        )
      }
    },
    {
      condition: (_, { getState }) => !getState().one.requests[type],
    }
  )

/**
 * @param {object} currentList - Current list of resources from redux
 * @param {object} value - OpenNebula resource
 * @returns {Array} Returns a new list with the attributes editable modified
 */
export const updateResourceList = (currentList, value) => {
  const id = value.ID

  const currentItem = currentList?.find(({ ID }) => ID === id)

  // update if exists in current list, if not add it to list
  const updatedList = currentItem
    ? currentList?.map((item) => (item?.ID === id ? value : item))
    : [value, ...currentList]

  return updatedList
}
