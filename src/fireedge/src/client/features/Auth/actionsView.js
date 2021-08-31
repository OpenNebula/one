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
/* eslint-disable jsdoc/require-jsdoc */
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

      return {
        views,
        view: Object.keys(views)[0]
      }
    } catch (error) {
      status === httpCodes.unauthorized.id && dispatch(logout(T.SessionExpired))
    }
  }
)

export const getSunstoneConfig = createAsyncThunk(
  'sunstone/config',
  async (_, { dispatch }) => {
    try {
      const config = await authService.getSunstoneConfig() ?? {}

      return { config }
    } catch (error) {
      status === httpCodes.unauthorized.id && dispatch(logout(T.SessionExpired))
    }
  }
)

export const changeView = createAction(
  'sunstone/change-view',
  view => ({ payload: { view } })
)
