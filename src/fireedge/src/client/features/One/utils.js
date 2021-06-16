import { createAsyncThunk } from '@reduxjs/toolkit'

import { httpCodes } from 'server/utils/constants'
import { requestParams, RestClient } from 'client/utils'

export const createAction = (type, service, wrapResult) =>
  createAsyncThunk(type, async (payload, { getState, rejectWithValue }) => {
    try {
      const { auth: { filterPool }, one } = getState()

      const response = await service({
        ...payload,
        filter: filterPool
      })

      return wrapResult ? wrapResult(response, one) : response
    } catch (err) {
      return rejectWithValue(typeof err === 'string' ? err : err?.response?.data)
    }
  }, {
    condition: (_, { getState }) => {
      const { requests } = getState().one

      return !requests[type]
    }
  })

export const poolRequest = async (data = {}, command, element) => {
  const { filter, end, start } = data
  const { url, options } = requestParams({ filter, end, start }, command)

  const response = await RestClient.get(url, { ...options })

  if (!response?.id || response?.id !== httpCodes.ok.id) throw response

  return [response?.data?.[`${element}_POOL`]?.[element] ?? []].flat()
}
