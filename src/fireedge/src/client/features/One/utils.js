import { createAsyncThunk } from '@reduxjs/toolkit'

import { logout } from 'client/features/Auth/actions'
import { ATTRIBUTES_EDITABLE } from 'client/features/One/slice'
import { requestParams, RestClient } from 'client/utils'

import { T } from 'client/constants'
import { httpCodes } from 'server/utils/constants'

export const createAction = (type, service, wrapResult) =>
  createAsyncThunk(type, async (payload, { dispatch, getState, rejectWithValue }) => {
    try {
      const { auth: { filterPool }, one } = getState()

      const response = await service({
        ...payload,
        filter: filterPool
      })

      return wrapResult ? wrapResult(response, one) : response
    } catch (error) {
      const { message, data, status, statusText } = error

      status === httpCodes.unauthorized.id && dispatch(logout(T.SessionExpired))

      return rejectWithValue(message, data?.message ?? statusText)
    }
  }, {
    condition: (_, { getState }) => !getState().one.requests[type]
  })

export const poolRequest = async (data = {}, command, element) => {
  const { filter, end, start } = data
  const { url, options } = requestParams({ filter, end, start }, command)

  const response = await RestClient.get(url, { ...options })

  if (!response?.id || response?.id !== httpCodes.ok.id) throw response

  return [response?.data?.[`${element}_POOL`]?.[element] ?? []].flat()
}

/**
 * @param {Object} currentList Current list of resources from redux
 * @param {Object} value OpenNebula resource
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
