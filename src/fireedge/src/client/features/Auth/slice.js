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

import {
  login,
  getUser,
  logout,
  changeFilter,
  changeGroup,
} from 'client/features/Auth/actions'
import { getProviderConfig } from 'client/features/Auth/provision'
import {
  getSunstoneViews,
  getSunstoneConfig,
  changeView,
} from 'client/features/Auth/sunstone'
import {
  JWT_NAME,
  FILTER_POOL,
  DEFAULT_SCHEME,
  DEFAULT_LANGUAGE,
} from 'client/constants'
import { isBackend } from 'client/utils'

const initial = () => ({
  jwt: !isBackend()
    ? window.localStorage.getItem(JWT_NAME) ??
      window.sessionStorage.getItem(JWT_NAME) ??
      null
    : null,
  user: null,
  error: null,
  filterPool: FILTER_POOL.ALL_RESOURCES,
  settings: {
    scheme: DEFAULT_SCHEME,
    lang: DEFAULT_LANGUAGE,
    disableanimations: 'NO',
  },
  isLoginInProgress: false,
  isLoading: false,
})

const { name, actions, reducer } = createSlice({
  name: 'auth',
  initialState: { ...initial(), firstRender: true },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        ({ type }) => type === logout.type,
        (_, { error }) => ({ ...initial(), error })
      )
      .addMatcher(
        ({ type }) =>
          [
            changeFilter.type,
            login.fulfilled.type,
            getUser.fulfilled.type,
            changeGroup.fulfilled.type,
            // provision
            getProviderConfig.fulfilled.type,
            // sunstone
            getSunstoneViews.fulfilled.type,
            getSunstoneConfig.fulfilled.type,
            changeView.type,
          ].includes(type),
        (state, { payload }) => ({ ...state, ...payload })
      )
      .addMatcher(
        ({ type }) => type.startsWith('auth/') && type.endsWith('/pending'),
        (state) => ({ ...state, isLoading: true, error: null })
      )
      .addMatcher(
        ({ type }) => type.startsWith('auth/') && type.endsWith('/fulfilled'),
        (state) => ({ ...state, isLoading: false, firstRender: false })
      )
      .addMatcher(
        ({ type }) => type.startsWith('auth/') && type.endsWith('/rejected'),
        (state, { payload }) => ({
          ...state,
          ...payload,
          isLoginInProgress: false,
          isLoading: false,
          firstRender: false,
          jwt: null,
        })
      )
  },
})

export { name, actions, reducer }
