/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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

import { logout } from 'client/features/Auth/slice'
import * as actions from 'client/features/General/actions'
import { generateKey } from 'client/utils'
import { APPS_IN_BETA, APPS_WITH_SWITCHER } from 'client/constants'

const initial = {
  zone: 0,
  appTitle: null,
  isBeta: false,
  withGroupSwitcher: false,
  isLoading: false,
  isFixMenu: false,
  isUpdateDialog: false,
  upload: 0,
  notifications: [],
  selectedIds: [],
  disabledSteps: [],
}

const slice = createSlice({
  name: 'general',
  initialState: initial,
  extraReducers: (builder) => {
    builder
      /* LOGOUT ACTION */
      .addCase(logout, (state) => ({
        ...initial,
        // persistent app state
        appTitle: state.appTitle,
        isBeta: state.isBeta,
        withGroupSwitcher: state.withGroupSwitcher,
      }))

      /* UI ACTIONS */
      .addCase(actions.fixMenu, (state, { payload }) => ({
        ...state,
        isFixMenu: !!payload,
      }))
      .addCase(actions.changeLoading, (state, { payload }) => ({
        ...state,
        isLoading: !!payload,
      }))
      .addCase(actions.changeAppTitle, (state, { payload: appTitle }) => {
        const lowerAppTitle = String(appTitle).toLowerCase()
        const isBeta = APPS_IN_BETA?.includes(lowerAppTitle)
        const withGroupSwitcher = APPS_WITH_SWITCHER?.includes(lowerAppTitle)

        return { ...state, appTitle, isBeta, withGroupSwitcher }
      })
      .addCase(actions.changeZone, (state, { payload }) => ({
        ...state,
        zone: payload,
      }))
      .addCase(actions.setSelectedIds, (state, { payload }) => {
        state.selectedIds = payload
      })
      .addCase(actions.updateDisabledSteps, (state, { payload }) => {
        state.disabledSteps = payload
      })
      .addCase(actions.setUpdateDialog, (state, { payload }) => {
        state.isUpdateDialog = !!payload
      })

      /* UPLOAD NOTIFICATION */
      .addCase(actions.setUploadSnackbar, (state, { payload }) => ({
        ...state,
        upload: payload,
      }))
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

export const { name, reducer } = slice
