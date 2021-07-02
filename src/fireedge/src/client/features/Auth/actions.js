import { createAsyncThunk, createAction } from '@reduxjs/toolkit'

import { authService } from 'client/features/Auth/services'
import { userService } from 'client/features/One/user/services'
import { getGroups } from 'client/features/One/group/actions'
import { dismissSnackbar } from 'client/features/General/actions'

import { httpCodes } from 'server/utils/constants'
import { T, JWT_NAME, ONEADMIN_ID, FILTER_POOL } from 'client/constants'
import { storage, removeStoreData } from 'client/utils'

export const login = createAsyncThunk(
  'auth/login',
  async ({ remember, ...user }, { rejectWithValue, dispatch }) => {
    try {
      const response = await authService.login(user)
      const { id, token } = response
      const isOneAdmin = id === ONEADMIN_ID

      if (token) {
        storage(JWT_NAME, token, remember)
        dispatch(dismissSnackbar({ dismissAll: true }))
      }

      return {
        jwt: token,
        user: { ID: id },
        isOneAdmin,
        isLoginInProgress: !!token && !isOneAdmin
      }
    } catch (error) {
      const { data, status, statusText } = error

      status === httpCodes.unauthorized.id && dispatch(logout(T.SessionExpired))

      return rejectWithValue({ error: data?.message ?? statusText })
    }
  }
)

export const getUser = createAsyncThunk(
  'auth/user',
  async (_, { dispatch, getState }) => {
    try {
      const user = await authService.getUser()
      await dispatch(getGroups())

      const isOneAdmin = user?.ID === ONEADMIN_ID
      const userSettings = user?.TEMPLATE?.FIREEDGE ?? {}

      const settings = {
        ...getState().auth?.settings,
        ...Object.entries(userSettings).reduce((res, [key, value]) =>
          ({ ...res, [String(key).toLowerCase()]: value })
        , {})
      }

      return { user, settings, isOneAdmin }
    } catch (error) {
      dispatch(logout(T.SessionExpired))
    }
  }, {
    condition: (_, { getState }) => {
      const { isLoading } = getState().auth

      return !isLoading
    }
  }
)

export const logout = createAction('logout', errorMessage => {
  removeStoreData([JWT_NAME])

  return { error: errorMessage }
})

export const changeFilter = createAction(
  'auth/change-filter',
  filterPool => ({ payload: { filterPool, isLoginInProgress: false } })
)

export const changeGroup = createAsyncThunk(
  'auth/change-group',
  async ({ group }, { getState, dispatch, rejectWithValue }) => {
    try {
      if (group === FILTER_POOL.ALL_RESOURCES) {
        dispatch(changeFilter(FILTER_POOL.ALL_RESOURCES))
      } else {
        const { user } = getState().auth

        const data = { id: user?.ID, group }
        await userService.changeGroup({ data })

        dispatch(changeFilter(FILTER_POOL.PRIMARY_GROUP_RESOURCES))
        return {
          user: {
            ...user,
            GID: group
          }
        }
      }
    } catch (error) {
      const { data, status, statusText } = error

      status === httpCodes.unauthorized.id && dispatch(logout(T.SessionExpired))

      return rejectWithValue({ error: data?.message ?? statusText })
    }
  }
)
