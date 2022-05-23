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
import { createAction, createSlice } from '@reduxjs/toolkit'

import { removeStoreData } from 'client/utils'
import { JWT_NAME, FILTER_POOL } from 'client/constants'

export const logout = createAction('logout')

const initial = () => ({
  jwt: null,
  user: null,
  filterPool: FILTER_POOL.ALL_RESOURCES,
  isLoginInProgress: false,
})

const slice = createSlice({
  name: 'auth',
  initialState: { ...initial(), firstRender: true },
  reducers: {
    changeAuthUser: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    changeJwt: (state, { payload }) => {
      state.jwt = payload
    },
    changeFilterPool: (state, { payload: filterPool }) => {
      state.filterPool = filterPool
      state.isLoginInProgress = false
    },
    changeView: (state, { payload }) => {
      state.view = payload
    },
    stopFirstRender: (state) => {
      state.firstRender = false
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (_, { payload }) => {
      removeStoreData([JWT_NAME])

      return { ...initial(), error: payload }
    })
  },
})

export const { name, reducer } = slice

const actions = { ...slice.actions, logout }
export { actions }
