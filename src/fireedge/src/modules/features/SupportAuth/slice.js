/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

export const login = createAction('Support Portal Login')

const initial = () => ({
  user: null,
  isLoginInProgress: false,
})

const slice = createSlice({
  name: 'supportAuth',
  initialState: { ...initial() },
  reducers: {
    changeSupportAuthUser: (
      state,
      { payload: { isLoginInProgress, ...user } }
    ) => {
      state.user = { ...state.user, ...user }

      if (isLoginInProgress !== undefined) {
        state.isLoginInProgress = isLoginInProgress
      }
    },
    clearSupportAuthUser: (state) => {
      state.user = null
      state.isLoginInProgress = false
    },
  },
})

export { slice as SupportSlice }
