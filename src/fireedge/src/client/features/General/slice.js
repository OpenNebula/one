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
import { createSlice } from '@reduxjs/toolkit'

import { logout } from 'client/features/Auth/actions'
import * as actions from 'client/features/General/actions'
import { generateKey } from 'client/utils'
import { APPS_IN_BETA } from 'client/constants'

const initial = {
  zone: 0,
  title: null,
  appTitle: null,
  isBeta: false,
  isLoading: false,
  isFixMenu: false,

  notifications: [],
}

const { name, reducer } = createSlice({
  name: 'general',
  initialState: initial,
  extraReducers: (builder) => {
    builder
      /* UI ACTIONS */
      .addCase(actions.fixMenu, (state, { payload }) => {
        return { ...state, isFixMenu: !!payload }
      })
      .addCase(actions.changeLoading, (state, { payload }) => {
        return { ...state, isLoading: !!payload }
      })
      .addCase(actions.changeTitle, (state, { payload }) => {
        return { ...state, title: payload }
      })
      .addCase(actions.changeAppTitle, (state, { payload }) => {
        const isBeta = APPS_IN_BETA?.includes(String(payload).toLowerCase())

        return { ...state, appTitle: payload, isBeta }
      })
      .addCase(actions.changeZone, (state, { payload }) => {
        return { ...state, zone: payload }
      })

      /* NOTIFICATION ACTIONS */
      .addCase(actions.enqueueSnackbar, (state, { payload }) => {
        const { key, options, message } = payload

        return {
          ...state,
          notifications: [...state.notifications, { key, options, message }],
        }
      })
      .addCase(actions.dismissSnackbar, (state, { payload }) => {
        const { key, dismissAll } = payload

        return {
          ...state,
          notifications: state.notifications.map((notification) =>
            dismissAll || notification.key !== key
              ? { ...notification, dismissed: true }
              : { ...notification }
          ),
        }
      })
      .addCase(actions.deleteSnackbar, (state, { payload }) => {
        const { key } = payload

        return {
          ...state,
          notifications: state.notifications.filter(
            (notification) => notification.key !== key
          ),
        }
      })

      /*  REQUESTS API MATCHES */
      .addMatcher(
        ({ type }) => type === logout.type,
        () => initial
      )
      .addMatcher(
        ({ type }) => type.endsWith('/pending') && !type.includes('auth'),
        (state) => ({ ...state, isLoading: true })
      )
      .addMatcher(
        ({ type }) => type.endsWith('/fulfilled') && !type.includes('auth'),
        (state) => ({ ...state, isLoading: false })
      )
      .addMatcher(
        ({ type, meta }) =>
          !meta?.aborted &&
          type.endsWith('/rejected') &&
          !type.includes('auth'),
        (state, { payload }) => ({
          ...state,
          isLoading: false,
          notifications: [
            ...state.notifications,
            payload?.length > 0 && {
              key: generateKey(),
              message: payload,
              options: { variant: 'error' },
            },
          ].filter(Boolean),
        })
      )
  },
})

export { name, reducer }
