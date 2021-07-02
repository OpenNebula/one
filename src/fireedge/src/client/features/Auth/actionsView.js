import { createAsyncThunk, createAction } from '@reduxjs/toolkit'

import { authService } from 'client/features/Auth/services'
import { logout } from 'client/features/Auth/actions'

import { httpCodes } from 'server/utils/constants'
import { T } from 'client/constants'

export const getSunstoneViews = createAsyncThunk(
  'sunstone/views',
  async (_, { dispatch }) => {
    try {
      const views = await authService.getSunstoneViews() ?? {}
      // const config = await authService.getSunstoneConfig()

      return {
        views,
        view: Object.keys(views)[0]
      }
    } catch (error) {
      status === httpCodes.unauthorized.id && dispatch(logout(T.SessionExpired))
    }
  }
)

export const changeView = createAction(
  'sunstone/change-view',
  view => ({ payload: { view } })
)
